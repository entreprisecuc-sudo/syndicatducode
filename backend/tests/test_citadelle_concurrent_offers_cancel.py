"""
Tests d'intégration Citadelle — Annulation automatique des offres concurrentes.

Règle métier : quand UNE offre est acceptée (par vendeur via /accept ou par acheteur
via /accept-counter), TOUTES les autres offres actives (offer_sent/offer_countered)
de la MÊME annonce passent à 'cancelled' avec cancelled_reason='concurrent_offer_accepted',
un message système "vient de trouver acquéreur ... la perle rare" est ajouté et un email
est envoyé aux acheteurs concernés (SMTP MOCKED en env preview).

Seed direct MongoDB (marqueur qa_seed_concurrent_offers), nettoyage à la fin.
"""
import os
import uuid
import pytest
import requests
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
load_dotenv("/app/frontend/.env")

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

VENDEUR_EMAIL = "test.vendeur@citadelle.fr"
VENDEUR_PASSWORD = "DemoVendeur2026!"
ACHETEUR_EMAIL = "test.acheteur@citadelle.fr"
ACHETEUR_PASSWORD = "DemoAcheteur2026!"

QA_TAG = "qa_seed_concurrent_offers"
QA_PREFIX = "QA-"


# ── Fixtures ──────────────────────────────────────────────────────────────────
@pytest.fixture(scope="module")
def mongo():
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    yield db
    db.citadelle_listings.delete_many({QA_TAG: True})
    db.citadelle_transactions.delete_many({QA_TAG: True})
    client.close()


def _login(email, password):
    r = requests.post(f"{API}/citadelle/auth/login",
                      json={"email": email, "password": password}, timeout=15)
    assert r.status_code == 200, f"login {email}: {r.status_code} {r.text}"
    return r.json()["access_token"]


def _me(token):
    r = requests.get(f"{API}/citadelle/auth/me",
                     headers={"Authorization": f"Bearer {token}"}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="module")
def vendeur_token():
    return _login(VENDEUR_EMAIL, VENDEUR_PASSWORD)


@pytest.fixture(scope="module")
def acheteur_token():
    return _login(ACHETEUR_EMAIL, ACHETEUR_PASSWORD)


@pytest.fixture(scope="module")
def vendeur_id(vendeur_token):
    return _me(vendeur_token)["id"]


@pytest.fixture(scope="module")
def acheteur_id(acheteur_token):
    return _me(acheteur_token)["id"]


def _h(tok):
    return {"Authorization": f"Bearer {tok}"}


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


# ── Helpers seed ──────────────────────────────────────────────────────────────
def _seed_listing(mongo, vendeur_id, seller_email):
    lid = f"{QA_PREFIX}listing-{uuid.uuid4().hex[:8]}"
    now = _now_iso()
    doc = {
        "id": lid,
        "slug": lid.lower(),
        "title": f"QA Annonce {uuid.uuid4().hex[:6]}",
        "description": "Annonce de test annulation concurrente.",
        "price": 5000.0,
        "status": "active",
        "seller_id": vendeur_id,
        "seller_email": seller_email,
        "created_at": now,
        "updated_at": now,
        QA_TAG: True,
    }
    mongo.citadelle_listings.insert_one(doc)
    return doc


def _seed_transaction(mongo, listing, buyer_id, buyer_email, status="offer_sent",
                      offer_amount=1000.0, counter_amount=None):
    tid = f"{QA_PREFIX}tx-{uuid.uuid4().hex[:10]}"
    now = _now_iso()
    doc = {
        "id": tid,
        "listing_id": listing["id"],
        "listing_title": listing["title"],
        "listing_slug": listing["slug"],
        "buyer_id": buyer_id,
        "buyer_email": buyer_email,
        "buyer_name": buyer_email.split("@")[0],
        "seller_id": listing["seller_id"],
        "seller_email": listing["seller_email"],
        "status": status,
        "offer_amount": offer_amount,
        "offer_message": "Test offer",
        "counter_amount": counter_amount,
        "counter_message": None,
        "payment_id": None,
        "payment_amount": None,
        "credentials": None,
        "credentials_transmitted": False,
        "messages": [],
        "dispute_messages": [],
        "created_at": now,
        "updated_at": now,
        "completed_at": None,
        "paid_at": None,
        "disputed_at": None,
        "dispute_reason": None,
        QA_TAG: True,
    }
    mongo.citadelle_transactions.insert_one(doc)
    return doc


# ── Tests ─────────────────────────────────────────────────────────────────────

class TestAcceptCancelsConcurrent:
    """Vendeur accepte une offre → toutes autres offres en cours de la même
    annonce sont automatiquement annulées."""

    def test_accept_cancels_concurrent_offers(self, mongo, vendeur_token,
                                              vendeur_id, acheteur_id):
        vendeur = _me(vendeur_token)
        listing = _seed_listing(mongo, vendeur_id, vendeur["email"])

        # Acheteur A (celui qu'on va accepter) - utilise le vrai acheteur_id
        txA = _seed_transaction(mongo, listing, acheteur_id, ACHETEUR_EMAIL,
                                status="offer_sent", offer_amount=4800.0)
        # Acheteur B - offer_sent
        txB = _seed_transaction(mongo, listing,
                                f"qa-buyer-B-{uuid.uuid4().hex[:6]}",
                                "qa.buyerB@test.fr",
                                status="offer_sent", offer_amount=4000.0)
        # Acheteur C - offer_countered
        txC = _seed_transaction(mongo, listing,
                                f"qa-buyer-C-{uuid.uuid4().hex[:6]}",
                                "qa.buyerC@test.fr",
                                status="offer_countered",
                                offer_amount=3500.0, counter_amount=4500.0)
        # Acheteur D - déjà cancelled (ne doit pas être touché)
        txD = _seed_transaction(mongo, listing,
                                f"qa-buyer-D-{uuid.uuid4().hex[:6]}",
                                "qa.buyerD@test.fr",
                                status="cancelled", offer_amount=3000.0)
        # Acheteur E - completed (ne doit pas être touché)
        txE = _seed_transaction(mongo, listing,
                                f"qa-buyer-E-{uuid.uuid4().hex[:6]}",
                                "qa.buyerE@test.fr",
                                status="completed", offer_amount=3200.0)

        # Autre annonce (ne doit pas être touchée)
        other_listing = _seed_listing(mongo, vendeur_id, vendeur["email"])
        txOther = _seed_transaction(mongo, other_listing,
                                    f"qa-buyer-X-{uuid.uuid4().hex[:6]}",
                                    "qa.buyerX@test.fr",
                                    status="offer_sent", offer_amount=2000.0)

        # Action : le vendeur accepte txA
        r = requests.post(f"{API}/citadelle/transactions/{txA['id']}/accept",
                          headers=_h(vendeur_token), timeout=15)
        assert r.status_code == 200, f"accept failed: {r.status_code} {r.text}"
        data = r.json()
        assert data.get("payment_amount") == 4800.0

        # Vérifs base : A → offer_accepted
        a_after = mongo.citadelle_transactions.find_one({"id": txA["id"]})
        assert a_after["status"] == "offer_accepted"
        assert a_after.get("payment_amount") == 4800.0

        # B et C → cancelled + concurrent_offer_accepted + message système
        for tx_seed in (txB, txC):
            after = mongo.citadelle_transactions.find_one({"id": tx_seed["id"]})
            assert after["status"] == "cancelled", \
                f"tx {tx_seed['id']} expected cancelled got {after['status']}"
            assert after.get("cancelled_reason") == "concurrent_offer_accepted"
            assert after.get("cancelled_at")
            sys_msgs = [m for m in after.get("messages", [])
                        if m.get("type") == "system"]
            assert sys_msgs, "message système manquant"
            joined = " ".join(m.get("content", "") for m in sys_msgs)
            assert "vient de trouver acquéreur" in joined
            assert "la perle rare" in joined

        # D (cancelled) et E (completed) → inchangés
        d_after = mongo.citadelle_transactions.find_one({"id": txD["id"]})
        assert d_after["status"] == "cancelled"
        assert d_after.get("cancelled_reason") != "concurrent_offer_accepted"
        e_after = mongo.citadelle_transactions.find_one({"id": txE["id"]})
        assert e_after["status"] == "completed"

        # Autre annonce → inchangée
        other_after = mongo.citadelle_transactions.find_one({"id": txOther["id"]})
        assert other_after["status"] == "offer_sent"


class TestAcceptCounterCancelsConcurrent:
    """Acheteur accepte la contre-offre → mêmes annulations concurrentes."""

    def test_accept_counter_cancels_concurrent_offers(self, mongo, acheteur_token,
                                                     vendeur_id, acheteur_id):
        vendeur_email_row = mongo.users.find_one({"id": vendeur_id}) or {}
        seller_email = vendeur_email_row.get("email", VENDEUR_EMAIL)
        listing = _seed_listing(mongo, vendeur_id, seller_email)

        # A = acheteur réel, en offer_countered → acceptera la contre-offre
        txA = _seed_transaction(mongo, listing, acheteur_id, ACHETEUR_EMAIL,
                                status="offer_countered",
                                offer_amount=3000.0, counter_amount=4200.0)
        # B / C = autres acheteurs en cours
        txB = _seed_transaction(mongo, listing,
                                f"qa-buyer-B2-{uuid.uuid4().hex[:6]}",
                                "qa.buyerB2@test.fr",
                                status="offer_sent", offer_amount=3800.0)
        txC = _seed_transaction(mongo, listing,
                                f"qa-buyer-C2-{uuid.uuid4().hex[:6]}",
                                "qa.buyerC2@test.fr",
                                status="offer_countered",
                                offer_amount=3200.0, counter_amount=4100.0)

        r = requests.post(f"{API}/citadelle/transactions/{txA['id']}/accept-counter",
                          headers=_h(acheteur_token), timeout=15)
        assert r.status_code == 200, f"accept-counter failed: {r.status_code} {r.text}"
        assert r.json().get("payment_amount") == 4200.0

        a_after = mongo.citadelle_transactions.find_one({"id": txA["id"]})
        assert a_after["status"] == "offer_accepted"

        for tx_seed in (txB, txC):
            after = mongo.citadelle_transactions.find_one({"id": tx_seed["id"]})
            assert after["status"] == "cancelled"
            assert after.get("cancelled_reason") == "concurrent_offer_accepted"
            joined = " ".join(m.get("content", "") for m in after.get("messages", [])
                              if m.get("type") == "system")
            assert "vient de trouver acquéreur" in joined
            assert "la perle rare" in joined


class TestAccessControl:
    """Contrôles d'accès et statuts inchangés."""

    def test_accept_403_if_not_seller(self, mongo, acheteur_token,
                                      vendeur_id, acheteur_id):
        listing = _seed_listing(mongo, vendeur_id, VENDEUR_EMAIL)
        tx = _seed_transaction(mongo, listing, acheteur_id, ACHETEUR_EMAIL,
                               status="offer_sent")
        r = requests.post(f"{API}/citadelle/transactions/{tx['id']}/accept",
                          headers=_h(acheteur_token), timeout=15)
        assert r.status_code == 403

    def test_accept_counter_403_if_not_buyer(self, mongo, vendeur_token,
                                             vendeur_id, acheteur_id):
        listing = _seed_listing(mongo, vendeur_id, VENDEUR_EMAIL)
        tx = _seed_transaction(mongo, listing, acheteur_id, ACHETEUR_EMAIL,
                               status="offer_countered",
                               offer_amount=1000.0, counter_amount=1500.0)
        r = requests.post(f"{API}/citadelle/transactions/{tx['id']}/accept-counter",
                          headers=_h(vendeur_token), timeout=15)
        assert r.status_code == 403

    def test_accept_400_if_wrong_status(self, mongo, vendeur_token,
                                        vendeur_id, acheteur_id):
        listing = _seed_listing(mongo, vendeur_id, VENDEUR_EMAIL)
        tx = _seed_transaction(mongo, listing, acheteur_id, ACHETEUR_EMAIL,
                               status="cancelled")
        r = requests.post(f"{API}/citadelle/transactions/{tx['id']}/accept",
                          headers=_h(vendeur_token), timeout=15)
        assert r.status_code == 400

    def test_accept_counter_400_if_not_countered(self, mongo, acheteur_token,
                                                vendeur_id, acheteur_id):
        listing = _seed_listing(mongo, vendeur_id, VENDEUR_EMAIL)
        tx = _seed_transaction(mongo, listing, acheteur_id, ACHETEUR_EMAIL,
                               status="offer_sent")
        r = requests.post(f"{API}/citadelle/transactions/{tx['id']}/accept-counter",
                          headers=_h(acheteur_token), timeout=15)
        assert r.status_code == 400

    def test_accept_404_if_unknown(self, vendeur_token):
        r = requests.post(f"{API}/citadelle/transactions/QA-does-not-exist/accept",
                          headers=_h(vendeur_token), timeout=15)
        assert r.status_code == 404

    def test_accept_counter_404_if_unknown(self, acheteur_token):
        r = requests.post(f"{API}/citadelle/transactions/QA-does-not-exist/accept-counter",
                          headers=_h(acheteur_token), timeout=15)
        assert r.status_code == 404


class TestNoRegression:
    """Aucune régression sur les flux d'offre existants."""

    def test_full_flow_create_counter_buyer_counter_refuse_withdraw(
            self, mongo, vendeur_token, acheteur_token, vendeur_id, acheteur_id):
        listing = _seed_listing(mongo, vendeur_id, VENDEUR_EMAIL)

        # 1. Create offer (via API) — utilise le vrai buyer via token
        r = requests.post(f"{API}/citadelle/transactions/offer",
                          headers=_h(acheteur_token),
                          json={"listing_id": listing["id"],
                                "amount": 3000.0,
                                "message": "Offre test régression."},
                          timeout=15)
        assert r.status_code == 201, r.text
        tx_id = r.json()["id"]

        # 2. Counter-offer (vendeur)
        r = requests.post(f"{API}/citadelle/transactions/{tx_id}/counter",
                          headers=_h(vendeur_token),
                          json={"amount": 3500.0,
                                "message": "Contre-offre régression test."},
                          timeout=15)
        assert r.status_code == 200, r.text

        tx = mongo.citadelle_transactions.find_one({"id": tx_id})
        assert tx["status"] == "offer_countered"

        # 3. Buyer counter (revenir en offer_sent)
        r = requests.post(f"{API}/citadelle/transactions/{tx_id}/buyer-counter",
                          headers=_h(acheteur_token),
                          json={"amount": 3200.0,
                                "message": "Nouvelle proposition acheteur."},
                          timeout=15)
        assert r.status_code == 200, r.text
        tx = mongo.citadelle_transactions.find_one({"id": tx_id})
        assert tx["status"] == "offer_sent"

        # 4. Refuse (vendeur)
        r = requests.post(f"{API}/citadelle/transactions/{tx_id}/refuse",
                          headers=_h(vendeur_token), timeout=15)
        assert r.status_code == 200, r.text
        tx = mongo.citadelle_transactions.find_one({"id": tx_id})
        assert tx["status"] == "offer_refused"

        # Tag pour cleanup
        mongo.citadelle_transactions.update_one({"id": tx_id},
                                                {"$set": {QA_TAG: True}})

        # 5. Withdraw : créer une autre offre et la retirer
        listing2 = _seed_listing(mongo, vendeur_id, VENDEUR_EMAIL)
        r = requests.post(f"{API}/citadelle/transactions/offer",
                          headers=_h(acheteur_token),
                          json={"listing_id": listing2["id"],
                                "amount": 2500.0,
                                "message": "Offre à retirer."},
                          timeout=15)
        assert r.status_code == 201, r.text
        tx2_id = r.json()["id"]
        mongo.citadelle_transactions.update_one({"id": tx2_id},
                                                {"$set": {QA_TAG: True}})
        r = requests.post(f"{API}/citadelle/transactions/{tx2_id}/withdraw-offer",
                          headers=_h(acheteur_token), timeout=15)
        assert r.status_code == 200, r.text
        tx2 = mongo.citadelle_transactions.find_one({"id": tx2_id})
        assert tx2["status"] == "cancelled"
        assert tx2.get("cancelled_by_buyer") is True
