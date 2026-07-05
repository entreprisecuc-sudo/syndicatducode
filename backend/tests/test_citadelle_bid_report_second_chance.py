"""
Tests d'intégration Citadelle iter19 :
FEATURE 1 — Signalement d'enchère suspecte + suppression admin de l'enchère.
FEATURE 2 — Enchère 'dernière chance' (second chance) après médiation.

Seed direct MongoDB (annonces + transactions taguées 'qa_seed_iter19': True), nettoyage à la fin.
"""
import os
import uuid
import time
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

ADMIN_EMAIL = "bigpapa1981@asar.com"
ADMIN_PASSWORD = "Josiane03@@@!1981"
VENDEUR_EMAIL = "test.vendeur@citadelle.fr"
VENDEUR_PASSWORD = "DemoVendeur2026!"
ACHETEUR_EMAIL = "test.acheteur@citadelle.fr"
ACHETEUR_PASSWORD = "DemoAcheteur2026!"

QA_TAG = "qa_seed_iter19"


# ── Fixtures ──────────────────────────────────────────────────────────────────
@pytest.fixture(scope="module")
def mongo():
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    yield db
    # Cleanup
    db.citadelle_listings.delete_many({QA_TAG: True})
    db.citadelle_transactions.delete_many({QA_TAG: True})
    db.citadelle_reports.delete_many({QA_TAG: True})
    client.close()


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"admin login: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def vendeur_token():
    r = requests.post(f"{API}/citadelle/auth/login", json={"email": VENDEUR_EMAIL, "password": VENDEUR_PASSWORD}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def acheteur_token():
    r = requests.post(f"{API}/citadelle/auth/login", json={"email": ACHETEUR_EMAIL, "password": ACHETEUR_PASSWORD}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def vendeur_id(vendeur_token):
    r = requests.get(f"{API}/citadelle/auth/me", headers={"Authorization": f"Bearer {vendeur_token}"}, timeout=15)
    return r.json()["id"]


@pytest.fixture(scope="module")
def acheteur_id(acheteur_token):
    r = requests.get(f"{API}/citadelle/auth/me", headers={"Authorization": f"Bearer {acheteur_token}"}, timeout=15)
    return r.json()["id"]


def _h(tok):
    return {"Authorization": f"Bearer {tok}"}


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


# ── Helpers seed ──────────────────────────────────────────────────────────────
def _seed_active_auction(mongo, vendeur_id, bids):
    """Crée une annonce active is_auction avec les enchères données."""
    now = datetime.now(timezone.utc)
    ends = now + timedelta(days=5)
    slug = f"qa-auction-{uuid.uuid4().hex[:8]}"
    listing_id = str(uuid.uuid4())
    highest = max((b["amount"] for b in bids), default=1000.0)
    doc = {
        "id": listing_id,
        "slug": slug,
        "title": f"QA-Auction {slug}",
        "type": "website",
        "short_description": "QA test enchère signalement — description minimum 20 caractères",
        "description": "QA test enchère signalement — description longue pour satisfaire la validation Pydantic (>=50 chars).",
        "seller_id": vendeur_id,
        "seller_email": VENDEUR_EMAIL,
        "status": "active",
        "price": 1000.0,
        "price_negotiable": False,
        "is_adult": False,
        "is_featured": False,
        "is_verified": False,
        "views_count": 0,
        "favorites_count": 0,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "published_at": now.isoformat(),
        "expires_at": (now + timedelta(days=90)).isoformat(),
        "is_auction": True,
        "auction_show_reserve": False,
        "auction_duration_days": 7,
        "auction_buy_now_price": None,
        "auction_ends_at": ends.isoformat(),
        "auction_current_bid": highest if bids else 1000.0,
        "auction_current_bidder_id": bids[-1]["bidder_id"] if bids else None,
        "auction_current_bidder_email": bids[-1]["bidder_email"] if bids else None,
        "auction_current_bidder_name": bids[-1].get("bidder_name") if bids else None,
        "auction_bids": bids,
        "auction_winner_transaction_id": None,
        QA_TAG: True,
    }
    mongo.citadelle_listings.insert_one(doc)
    return listing_id, slug


def _mk_bid(bidder_id, bidder_email, amount, name="QA Bidder", with_id=True):
    b = {
        "bidder_id": bidder_id,
        "bidder_email": bidder_email,
        "bidder_name": name,
        "amount": amount,
        "bid_at": _now_iso(),
    }
    if with_id:
        b["bid_id"] = str(uuid.uuid4())
    return b


# =============================================================================
# FEATURE 1 — Report bid + Admin delete bid
# =============================================================================
class TestReportBidBackend:
    def test_report_bid_401_sans_auth(self, mongo, vendeur_id, acheteur_id):
        listing_id, _ = _seed_active_auction(mongo, vendeur_id, [
            _mk_bid(acheteur_id, ACHETEUR_EMAIL, 1500.0),
        ])
        r = requests.post(f"{API}/citadelle/listings/{listing_id}/report-bid",
                          json={"message": "no auth"}, timeout=15)
        assert r.status_code in (401, 403), r.text

    def test_report_bid_404_annonce_inconnue(self, acheteur_token):
        r = requests.post(f"{API}/citadelle/listings/{uuid.uuid4()}/report-bid",
                          headers=_h(acheteur_token), json={"message": "x"}, timeout=15)
        assert r.status_code == 404

    def test_report_bid_400_pas_enchere(self, mongo, vendeur_id, acheteur_token):
        # annonce classique (is_auction=False)
        now = datetime.now(timezone.utc).isoformat()
        listing_id = str(uuid.uuid4())
        mongo.citadelle_listings.insert_one({
            "id": listing_id, "slug": f"qa-classique-{uuid.uuid4().hex[:6]}",
            "title": "QA classique", "type": "website",
            "short_description": "desc courte >= 20 chars ok ici",
            "description": "description longue au delà de 50 caracteres pour Pydantic OK ici.",
            "seller_id": vendeur_id, "seller_email": VENDEUR_EMAIL,
            "status": "active", "price": 500.0, "is_auction": False,
            "created_at": now, "updated_at": now,
            QA_TAG: True,
        })
        r = requests.post(f"{API}/citadelle/listings/{listing_id}/report-bid",
                          headers=_h(acheteur_token), json={"message": "x"}, timeout=15)
        assert r.status_code == 400
        assert "enchère" in r.json()["detail"].lower() or "enchere" in r.json()["detail"].lower()

    def test_report_bid_400_sans_enchere(self, mongo, vendeur_id, acheteur_token):
        listing_id, _ = _seed_active_auction(mongo, vendeur_id, [])
        r = requests.post(f"{API}/citadelle/listings/{listing_id}/report-bid",
                          headers=_h(acheteur_token), json={"message": "x"}, timeout=15)
        assert r.status_code == 400

    def test_report_bid_200_backfill_bid_id(self, mongo, vendeur_id, acheteur_id, acheteur_token):
        # bid sans bid_id → doit être backfillé
        bid_no_id = _mk_bid(acheteur_id, ACHETEUR_EMAIL, 1500.0, with_id=False)
        listing_id, _ = _seed_active_auction(mongo, vendeur_id, [bid_no_id])
        r = requests.post(f"{API}/citadelle/listings/{listing_id}/report-bid",
                          headers=_h(acheteur_token), json={"message": "QA suspect"}, timeout=15)
        assert r.status_code == 200, r.text
        # verifier la présence du report + du bid_id backfillé
        rep = mongo.citadelle_reports.find_one({"listing_id": listing_id, "report_type": "bid"})
        assert rep is not None
        assert rep["report_type"] == "bid"
        assert rep["bid_id"], "bid_id doit être présent (backfill)"
        assert rep["bid_amount"] == 1500.0
        assert rep["status"] == "open"
        # tag pour cleanup
        mongo.citadelle_reports.update_one({"id": rep["id"]}, {"$set": {QA_TAG: True}})
        # verifier backfill dans le listing
        listing = mongo.citadelle_listings.find_one({"id": listing_id})
        assert listing["auction_bids"][0]["bid_id"] == rep["bid_id"]


class TestAdminDeleteBidBackend:
    def test_delete_bid_403_sans_admin(self, mongo, vendeur_id, acheteur_id, acheteur_token):
        bid = _mk_bid(acheteur_id, ACHETEUR_EMAIL, 1500.0)
        listing_id, _ = _seed_active_auction(mongo, vendeur_id, [bid])
        r = requests.delete(
            f"{API}/citadelle/admin/listings/{listing_id}/bids/{bid['bid_id']}",
            headers=_h(acheteur_token), timeout=15)
        assert r.status_code in (401, 403)

    def test_delete_bid_404_bid_inconnu(self, mongo, vendeur_id, acheteur_id, admin_token):
        bid = _mk_bid(acheteur_id, ACHETEUR_EMAIL, 1500.0)
        listing_id, _ = _seed_active_auction(mongo, vendeur_id, [bid])
        r = requests.delete(
            f"{API}/citadelle/admin/listings/{listing_id}/bids/{uuid.uuid4()}",
            headers=_h(admin_token), timeout=15)
        assert r.status_code == 404

    def test_delete_bid_200_recalcul_current(self, mongo, vendeur_id, acheteur_id, admin_token):
        # 2 enchères : 1200 (garder) + 1500 (supprimer)
        bid_low = _mk_bid(acheteur_id, ACHETEUR_EMAIL, 1200.0, name="Low")
        bid_high = _mk_bid("qa-other-bidder", "qa.other@citadelle.fr", 1500.0, name="High")
        listing_id, _ = _seed_active_auction(mongo, vendeur_id, [bid_low, bid_high])
        # signalement pour lier + tester resolved
        rep_id = str(uuid.uuid4())
        mongo.citadelle_reports.insert_one({
            "id": rep_id, "report_type": "bid", "listing_id": listing_id,
            "bid_id": bid_high["bid_id"], "status": "open",
            "created_at": _now_iso(), "updated_at": _now_iso(), QA_TAG: True,
        })
        r = requests.delete(
            f"{API}/citadelle/admin/listings/{listing_id}/bids/{bid_high['bid_id']}",
            headers=_h(admin_token), timeout=15)
        assert r.status_code == 200, r.text
        listing = mongo.citadelle_listings.find_one({"id": listing_id})
        assert listing["auction_current_bid"] == 1200.0
        assert listing["auction_current_bidder_id"] == acheteur_id
        assert len(listing["auction_bids"]) == 1
        # Le signalement doit être résolu
        rep = mongo.citadelle_reports.find_one({"id": rep_id})
        assert rep["status"] == "resolved"

    def test_delete_bid_200_dernier_bid_reset_prix(self, mongo, vendeur_id, acheteur_id, admin_token):
        bid = _mk_bid(acheteur_id, ACHETEUR_EMAIL, 1500.0)
        listing_id, _ = _seed_active_auction(mongo, vendeur_id, [bid])
        r = requests.delete(
            f"{API}/citadelle/admin/listings/{listing_id}/bids/{bid['bid_id']}",
            headers=_h(admin_token), timeout=15)
        assert r.status_code == 200
        listing = mongo.citadelle_listings.find_one({"id": listing_id})
        assert listing["auction_current_bid"] == listing["price"]  # 1000
        assert listing["auction_current_bidder_id"] is None
        assert listing["auction_bids"] == []

    def test_delete_bid_double_delete_404(self, mongo, vendeur_id, acheteur_id, admin_token):
        bid = _mk_bid(acheteur_id, ACHETEUR_EMAIL, 1500.0)
        listing_id, _ = _seed_active_auction(mongo, vendeur_id, [bid])
        r1 = requests.delete(
            f"{API}/citadelle/admin/listings/{listing_id}/bids/{bid['bid_id']}",
            headers=_h(admin_token), timeout=15)
        assert r1.status_code == 200
        r2 = requests.delete(
            f"{API}/citadelle/admin/listings/{listing_id}/bids/{bid['bid_id']}",
            headers=_h(admin_token), timeout=15)
        assert r2.status_code == 404


# =============================================================================
# FEATURE 2 — Second chance
# =============================================================================
def _seed_cancelled_auction_tx(mongo, vendeur_id, buyer_id, buyer_email, listing_id, listing_title, amount):
    tx_id = str(uuid.uuid4())
    now = _now_iso()
    mongo.citadelle_transactions.insert_one({
        "id": tx_id,
        "listing_id": listing_id,
        "listing_title": listing_title,
        "listing_slug": f"qa-auction-{uuid.uuid4().hex[:6]}",
        "buyer_id": buyer_id, "buyer_email": buyer_email,
        "seller_id": vendeur_id, "seller_email": VENDEUR_EMAIL,
        "status": "cancelled",
        "is_auction": True,
        "offer_amount": amount, "payment_amount": amount,
        "cancelled_at": now, "created_at": now, "updated_at": now,
        "messages": [], "dispute_messages": [],
        QA_TAG: True,
    })
    return tx_id


class TestSecondChanceBackend:
    @pytest.fixture(scope="class")
    def scenario(self, mongo, vendeur_id, acheteur_id):
        """Annonce vendue + 2 enchères (gagnant = acheteur test, second = QA-B2) + tx cancelled."""
        winner_bid = _mk_bid(acheteur_id, ACHETEUR_EMAIL, 2000.0, name="Winner")
        second_bid = _mk_bid("qa-second-bidder", "qa.second@citadelle.fr", 1500.0, name="Second")
        listing_id, _ = _seed_active_auction(mongo, vendeur_id, [second_bid, winner_bid])
        # marquer 'sold'
        mongo.citadelle_listings.update_one({"id": listing_id}, {"$set": {"status": "sold"}})
        tx_id = _seed_cancelled_auction_tx(mongo, vendeur_id, acheteur_id, ACHETEUR_EMAIL,
                                           listing_id, "QA-Auction winner", 2000.0)
        return {"listing_id": listing_id, "tx_id": tx_id}

    def test_request_second_chance_403_sans_admin(self, scenario, vendeur_token):
        r = requests.post(
            f"{API}/citadelle/admin/transactions/{scenario['tx_id']}/request-second-chance",
            headers=_h(vendeur_token), timeout=15)
        assert r.status_code in (401, 403)

    def test_request_second_chance_400_tx_non_annulee(self, mongo, vendeur_id, acheteur_id, admin_token):
        tx_id = str(uuid.uuid4())
        listing_id, _ = _seed_active_auction(mongo, vendeur_id, [_mk_bid(acheteur_id, ACHETEUR_EMAIL, 1500.0)])
        now = _now_iso()
        mongo.citadelle_transactions.insert_one({
            "id": tx_id, "listing_id": listing_id, "listing_title": "x",
            "buyer_id": acheteur_id, "buyer_email": ACHETEUR_EMAIL,
            "seller_id": vendeur_id, "seller_email": VENDEUR_EMAIL,
            "status": "payment_done", "is_auction": True,
            "created_at": now, "updated_at": now, "messages": [], QA_TAG: True,
        })
        r = requests.post(
            f"{API}/citadelle/admin/transactions/{tx_id}/request-second-chance",
            headers=_h(admin_token), timeout=15)
        assert r.status_code == 400
        assert "annulée" in r.json()["detail"] or "annul" in r.json()["detail"].lower()

    def test_request_second_chance_400_non_auction(self, mongo, vendeur_id, acheteur_id, admin_token):
        # tx cancelled mais pas d'enchère (is_auction=false et listing non enchère)
        listing_id = str(uuid.uuid4())
        now = _now_iso()
        mongo.citadelle_listings.insert_one({
            "id": listing_id, "slug": f"qa-classic-{uuid.uuid4().hex[:6]}",
            "title": "QA classic", "type": "website",
            "short_description": "desc courte >= 20 chars ok ici",
            "description": "description longue au delà de 50 caracteres pour Pydantic OK ici.",
            "seller_id": vendeur_id, "seller_email": VENDEUR_EMAIL,
            "status": "active", "price": 500.0, "is_auction": False,
            "created_at": now, "updated_at": now, QA_TAG: True,
        })
        tx_id = str(uuid.uuid4())
        mongo.citadelle_transactions.insert_one({
            "id": tx_id, "listing_id": listing_id, "listing_title": "QA classic",
            "buyer_id": acheteur_id, "buyer_email": ACHETEUR_EMAIL,
            "seller_id": vendeur_id, "seller_email": VENDEUR_EMAIL,
            "status": "cancelled", "is_auction": False,
            "created_at": now, "updated_at": now, "messages": [], QA_TAG: True,
        })
        r = requests.post(
            f"{API}/citadelle/admin/transactions/{tx_id}/request-second-chance",
            headers=_h(admin_token), timeout=15)
        assert r.status_code == 400

    def test_full_flow_request_confirm_and_chain(self, mongo, scenario, admin_token, vendeur_token, acheteur_id):
        tx_id = scenario["tx_id"]
        listing_id = scenario["listing_id"]

        # 1) admin demande la seconde chance
        r1 = requests.post(
            f"{API}/citadelle/admin/transactions/{tx_id}/request-second-chance",
            headers=_h(admin_token), timeout=15)
        assert r1.status_code == 200, r1.text
        assert r1.json()["next_amount"] == 1500.0
        tx = mongo.citadelle_transactions.find_one({"id": tx_id})
        assert tx["second_chance_requested"] is True
        assert tx["second_chance_next_bidder"]["amount"] == 1500.0

        # 2) confirm-second-chance sans être vendeur → 403
        # (acheteur test n'est PAS le vendeur)
        acheteur_headers = _h(requests.post(
            f"{API}/citadelle/auth/login",
            json={"email": ACHETEUR_EMAIL, "password": ACHETEUR_PASSWORD}, timeout=15).json()["access_token"])
        r_403 = requests.post(
            f"{API}/citadelle/transactions/{tx_id}/confirm-second-chance",
            headers=acheteur_headers, timeout=15)
        assert r_403.status_code == 403

        # 3) vendeur confirme
        r2 = requests.post(
            f"{API}/citadelle/transactions/{tx_id}/confirm-second-chance",
            headers=_h(vendeur_token), timeout=15)
        assert r2.status_code == 200, r2.text
        new_tx_id = r2.json()["new_transaction_id"]
        # tagger la nouvelle tx pour cleanup
        mongo.citadelle_transactions.update_one({"id": new_tx_id}, {"$set": {QA_TAG: True}})

        # 4) vérifier la nouvelle transaction
        new_tx = mongo.citadelle_transactions.find_one({"id": new_tx_id})
        assert new_tx is not None
        assert new_tx["status"] == "offer_accepted"
        assert new_tx["is_auction"] is True
        assert new_tx["second_chance"] is True
        assert new_tx["offer_amount"] == 1500.0
        assert new_tx["buyer_id"] == "qa-second-bidder"

        # 5) ancienne tx marquée done
        old_tx = mongo.citadelle_transactions.find_one({"id": tx_id})
        assert old_tx["second_chance_done"] is True

        # 6) chaîne : plus d'enchérisseur → new request-second-chance sur old → 400
        # d'abord marquer old_tx cancelled + non-done pour tester l'exclusion
        # Créons une 2e tx cancelled sur le même listing pour le 2e bidder,
        # puis re-demandons.
        tx2_id = str(uuid.uuid4())
        now = _now_iso()
        mongo.citadelle_transactions.insert_one({
            "id": tx2_id, "listing_id": listing_id, "listing_title": "QA-Auction winner",
            "buyer_id": "qa-second-bidder", "buyer_email": "qa.second@citadelle.fr",
            "seller_id": mongo.citadelle_listings.find_one({"id": listing_id})["seller_id"],
            "seller_email": VENDEUR_EMAIL,
            "status": "cancelled", "is_auction": True,
            "created_at": now, "updated_at": now, "messages": [], QA_TAG: True,
        })
        r3 = requests.post(
            f"{API}/citadelle/admin/transactions/{tx2_id}/request-second-chance",
            headers=_h(admin_token), timeout=15)
        # Plus d'enchérisseur disponible (les 2 ont déjà une tx)
        assert r3.status_code == 400
        assert "enchérisseur" in r3.json()["detail"].lower() or "encheris" in r3.json()["detail"].lower()

    def test_decline_second_chance(self, mongo, vendeur_id, acheteur_id, admin_token, vendeur_token):
        # nouveau scénario indépendant
        winner_bid = _mk_bid(acheteur_id, ACHETEUR_EMAIL, 3000.0, name="Winner")
        second_bid = _mk_bid("qa-second-decline", "qa.decline@citadelle.fr", 2500.0, name="Second")
        listing_id, _ = _seed_active_auction(mongo, vendeur_id, [second_bid, winner_bid])
        mongo.citadelle_listings.update_one({"id": listing_id}, {"$set": {"status": "sold"}})
        tx_id = _seed_cancelled_auction_tx(mongo, vendeur_id, acheteur_id, ACHETEUR_EMAIL,
                                           listing_id, "QA-Auction decline", 3000.0)
        r1 = requests.post(
            f"{API}/citadelle/admin/transactions/{tx_id}/request-second-chance",
            headers=_h(admin_token), timeout=15)
        assert r1.status_code == 200

        r2 = requests.post(
            f"{API}/citadelle/transactions/{tx_id}/decline-second-chance",
            headers=_h(vendeur_token), timeout=15)
        assert r2.status_code == 200
        tx = mongo.citadelle_transactions.find_one({"id": tx_id})
        assert tx.get("second_chance_declined") is True
        assert tx.get("second_chance_requested") is False
