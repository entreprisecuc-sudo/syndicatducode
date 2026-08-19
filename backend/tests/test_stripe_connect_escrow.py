"""
Tests iteration 13 — Stripe Connect ESCROW, commission max(5%, 49€),
webhooks sécurisés, doublon /connect/* supprimé, garde-fous statut.

Aucun paiement Stripe réel. Aucune création de compte Connect Express réelle.
Seed direct MongoDB (préfixe TESTESC_) + nettoyage à la fin.
"""

import os
import uuid
import asyncio
from datetime import datetime, timezone

import pytest
import requests
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://code-syndicate-2.preview.emergentagent.com").rstrip("/")
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")

ADMIN_EMAIL = "bigpapa1981@asar.com"
ADMIN_PASSWORD = "Josiane03@@@!1981"
MEMBER_EMAIL = "marie.testui@citadelle-test.fr"
MEMBER_PASSWORD = "TestUI2026!"
MEMBER_ID = "26c042ac-fbdc-471e-b791-edd15325de7e"

FAKE_ACCT = "acct_FAKE_TEST"


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    return r.json().get("access_token") or r.json().get("token")


@pytest.fixture(scope="module")
def member_token(api):
    r = api.post(f"{BASE_URL}/api/citadelle/auth/login",
                 json={"email": MEMBER_EMAIL, "password": MEMBER_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Member login failed: {r.status_code} {r.text}")
    return r.json().get("access_token")


@pytest.fixture
def mongo():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]


def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro) if not asyncio.get_event_loop().is_running() else asyncio.run(coro)


# ── 1. Webhooks signature ─────────────────────────────────────────────────────

class TestWebhookSignatures:
    def test_webhook_connect_rejects_invalid_signature(self, api):
        r = api.post(
            f"{BASE_URL}/api/citadelle/payments/webhook/stripe-connect",
            data=b'{"type":"account.updated","data":{"object":{"id":"acct_x"}}}',
            headers={"Content-Type": "application/json", "Stripe-Signature": "t=1,v1=invalid"},
        )
        assert r.status_code == 400, f"Attendu 400, reçu {r.status_code}: {r.text}"
        assert "invalide" in r.text.lower() or "signature" in r.text.lower()

    def test_webhook_connect_rejects_missing_signature(self, api):
        r = api.post(
            f"{BASE_URL}/api/citadelle/payments/webhook/stripe-connect",
            data=b'{"type":"account.updated","data":{"object":{"id":"acct_x"}}}',
            headers={"Content-Type": "application/json"},
        )
        assert r.status_code == 400

    def test_webhook_payments_rejects_invalid_signature(self, api):
        r = api.post(
            f"{BASE_URL}/api/citadelle/payments/webhook/stripe",
            data=b'{"type":"checkout.session.completed","data":{"object":{"id":"cs_x"}}}',
            headers={"Content-Type": "application/json", "Stripe-Signature": "t=1,v1=invalid"},
        )
        assert r.status_code == 400

    def test_webhook_payments_rejects_missing_signature(self, api):
        r = api.post(
            f"{BASE_URL}/api/citadelle/payments/webhook/stripe",
            data=b'{"type":"checkout.session.completed","data":{"object":{"id":"cs_x"}}}',
            headers={"Content-Type": "application/json"},
        )
        assert r.status_code == 400


# ── 2. Doublon /connect/* supprimé ────────────────────────────────────────────

class TestConnectDuplicateRemoved:
    def test_old_connect_onboard_404(self, api, member_token):
        r = api.post(
            f"{BASE_URL}/api/citadelle/connect/onboard",
            json={"return_url": "https://x", "refresh_url": "https://x"},
            headers={"Authorization": f"Bearer {member_token}"},
        )
        assert r.status_code == 404, f"Route obsolète, attendu 404 — reçu {r.status_code}"

    def test_old_connect_status_404(self, api, member_token):
        r = api.get(
            f"{BASE_URL}/api/citadelle/connect/status",
            headers={"Authorization": f"Bearer {member_token}"},
        )
        assert r.status_code == 404

    def test_old_connect_relink_404(self, api, member_token):
        r = api.post(
            f"{BASE_URL}/api/citadelle/connect/relink",
            json={},
            headers={"Authorization": f"Bearer {member_token}"},
        )
        assert r.status_code == 404


# ── 3. Endpoint statut Connect ────────────────────────────────────────────────

class TestStripeConnectStatus:
    def test_status_requires_auth(self, api):
        r = api.get(f"{BASE_URL}/api/citadelle/stripe-connect/status")
        assert r.status_code in (401, 403)

    def test_status_not_connected_for_member_without_account(self, api, member_token):
        # Marie n'a pas de compte Connect en base (le test seed/nettoie proprement)
        # Vérifier au préalable et nettoyer si des données de test résiduelles existent
        r = api.get(
            f"{BASE_URL}/api/citadelle/stripe-connect/status",
            headers={"Authorization": f"Bearer {member_token}"},
        )
        assert r.status_code == 200, f"Statut attendu 200: {r.status_code} {r.text}"
        data = r.json()
        # Structure attendue
        assert "status" in data
        assert "account_id" in data
        assert "details_submitted" in data
        assert "payouts_enabled" in data
        # Pour un membre sans compte : status='not_connected'
        if data.get("account_id") is None:
            assert data["status"] == "not_connected"
            assert data["details_submitted"] is False
            assert data["payouts_enabled"] is False


# ── 4. Commission & escrow finalisation ───────────────────────────────────────

class TestCommissionEscrow:
    """Seed direct BDD -> POST /admin/transactions/{id}/complete -> vérif commission."""

    async def _ensure_seller_connect(self, mongo):
        """Ajoute stripe_connect_account_id sur Marie (backup si présent)."""
        prev = await mongo.users.find_one({"id": MEMBER_ID}, {"_id": 0, "stripe_connect_account_id": 1, "stripe_connect_status": 1})
        await mongo.users.update_one(
            {"id": MEMBER_ID},
            {"$set": {
                "stripe_connect_account_id": FAKE_ACCT,
                "stripe_connect_status": "active",
            }}
        )
        return prev

    async def _restore_seller_connect(self, mongo, prev):
        unset = {}
        set_ = {}
        if prev is None or "stripe_connect_account_id" not in prev:
            unset["stripe_connect_account_id"] = ""
        else:
            set_["stripe_connect_account_id"] = prev["stripe_connect_account_id"]
        if prev is None or "stripe_connect_status" not in prev:
            unset["stripe_connect_status"] = ""
        else:
            set_["stripe_connect_status"] = prev["stripe_connect_status"]
        op = {}
        if set_:
            op["$set"] = set_
        if unset:
            op["$unset"] = unset
        if op:
            await mongo.users.update_one({"id": MEMBER_ID}, op)

    async def _seed_tx(self, mongo, payment_amount: float, status: str = "admin_verified") -> str:
        tx_id = f"TESTESC_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        doc = {
            "id": tx_id,
            "listing_id": f"TESTESC_L_{uuid.uuid4().hex[:8]}",
            "listing_title": "TESTESC — Site fictif",
            "listing_slug": "testesc",
            "buyer_id": "TESTESC_BUYER",
            "buyer_email": "buyer@testesc.fr",
            "seller_id": MEMBER_ID,
            "seller_email": MEMBER_EMAIL,
            "status": status,
            "offer_amount": payment_amount,
            "counter_amount": None,
            "payment_amount": payment_amount,
            "payment_id": "pi_TESTESC_FAKE",
            "credentials": {
                "data": "TESTESC credentials",
                "submitted_at": now,
                "verified_by_admin": True if status == "admin_verified" else False,
                "verified_at": now if status == "admin_verified" else None,
                "admin_notes": None,
            },
            "credentials_transmitted": False,
            "messages": [],
            "created_at": now,
            "updated_at": now,
            "paid_at": now,
        }
        await mongo.citadelle_transactions.insert_one(doc)
        return tx_id

    async def _cleanup(self, mongo):
        await mongo.citadelle_transactions.delete_many({"id": {"$regex": "^TESTESC_"}})

    def _complete(self, api, tx_id, admin_token):
        return api.post(
            f"{BASE_URL}/api/citadelle/admin/transactions/{tx_id}/complete",
            headers={"Authorization": f"Bearer {admin_token}"},
        )

    @pytest.mark.asyncio
    async def test_commission_percentage_rule_5000eur(self, api, admin_token, mongo):
        """payment_amount=5000 -> commission=250 (5%), net=4750"""
        prev = await self._ensure_seller_connect(mongo)
        try:
            tx_id = await self._seed_tx(mongo, 5000.0)
            r = self._complete(api, tx_id, admin_token)
            assert r.status_code == 200, f"Complete failed: {r.status_code} {r.text}"
            data = r.json()
            assert data["commission"] == 250.0, f"Attendu 250, reçu {data['commission']}"
            assert data["net_seller_amount"] == 4750.0
            # Vérifier persistance + statut completed
            tx = await mongo.citadelle_transactions.find_one({"id": tx_id}, {"_id": 0})
            assert tx["status"] == "completed"
            assert tx["commission_amount"] == 250.0
            assert tx["net_seller_amount"] == 4750.0
            # Le transfer Stripe échoue (acct_FAKE_TEST) => stripe_transfer_id None, note 'virement manuel requis'
            assert tx.get("stripe_transfer_id") is None
        finally:
            await self._cleanup(mongo)
            await self._restore_seller_connect(mongo, prev)

    @pytest.mark.asyncio
    async def test_commission_minimum_rule_150eur(self, api, admin_token, mongo):
        """payment_amount=150 -> commission=49 (min), net=101"""
        prev = await self._ensure_seller_connect(mongo)
        try:
            tx_id = await self._seed_tx(mongo, 150.0)
            r = self._complete(api, tx_id, admin_token)
            assert r.status_code == 200, f"Complete failed: {r.status_code} {r.text}"
            data = r.json()
            assert data["commission"] == 49.0, f"Attendu 49, reçu {data['commission']}"
            assert data["net_seller_amount"] == 101.0
            tx = await mongo.citadelle_transactions.find_one({"id": tx_id}, {"_id": 0})
            assert tx["status"] == "completed"
            assert tx["commission_amount"] == 49.0
            assert tx["net_seller_amount"] == 101.0
        finally:
            await self._cleanup(mongo)
            await self._restore_seller_connect(mongo, prev)

    @pytest.mark.asyncio
    async def test_finalize_refuses_if_not_admin_verified(self, api, admin_token, mongo):
        """Le virement ne doit JAMAIS partir avant statut admin_verified."""
        prev = await self._ensure_seller_connect(mongo)
        try:
            for bad_status in ("offer_accepted", "credentials_submitted", "payment_done"):
                tx_id = await self._seed_tx(mongo, 500.0, status=bad_status)
                r = self._complete(api, tx_id, admin_token)
                assert r.status_code == 400, f"Statut {bad_status} devrait refuser (attendu 400, reçu {r.status_code})"
        finally:
            await self._cleanup(mongo)
            await self._restore_seller_connect(mongo, prev)


# ── 5. Sécurité admin endpoints ───────────────────────────────────────────────

class TestSecurity:
    def test_admin_complete_requires_admin_no_token(self, api):
        r = api.post(f"{BASE_URL}/api/citadelle/admin/transactions/xxx/complete")
        assert r.status_code in (401, 403)

    def test_admin_complete_requires_admin_member_token(self, api, member_token):
        r = api.post(
            f"{BASE_URL}/api/citadelle/admin/transactions/xxx/complete",
            headers={"Authorization": f"Bearer {member_token}"},
        )
        assert r.status_code in (401, 403)

    def test_admin_verify_requires_admin_member_token(self, api, member_token):
        r = api.post(
            f"{BASE_URL}/api/citadelle/admin/transactions/xxx/verify",
            json={"notes": "x"},
            headers={"Authorization": f"Bearer {member_token}"},
        )
        assert r.status_code in (401, 403)
