"""
Tests API — Offre promo globale (La Citadelle Numérique)
Vérifie :
- Admin GET/PATCH /api/citadelle/admin/promo
- Public GET /api/citadelle/promo
- Checkout Stripe applique bien la promo (amount + original_amount + promo_percent)
- Désactivation via enabled=false
- Expiration (ends_at passée)
- État final : promo DÉSACTIVÉE
"""
import os
import pytest
import requests
from dotenv import load_dotenv
load_dotenv("/app/backend/.env")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://code-union.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "bigpapa1981@asar.com"
ADMIN_PWD = "Josiane03@@@!1981"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PWD}, timeout=30)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("access_token") or data.get("token")
    assert token, f"No token in response: {data}"
    return token


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def estimation_standard_id():
    r = requests.get(f"{API}/citadelle/services", timeout=15)
    assert r.status_code == 200
    for s in r.json()["services"]:
        if s["title"] == "Estimation Standard":
            return s["id"]
    pytest.fail("Estimation Standard introuvable")


@pytest.fixture(scope="module", autouse=True)
def cleanup_promo(admin_headers):
    """Toujours désactiver la promo à la fin."""
    yield
    requests.patch(f"{API}/citadelle/admin/promo",
                   json={"enabled": False, "discount_percent": 0, "ends_at": None},
                   headers=admin_headers, timeout=15)


class TestPromoAdmin:
    def test_admin_get_promo_requires_auth(self):
        r = requests.get(f"{API}/citadelle/admin/promo", timeout=10)
        assert r.status_code in (401, 403)

    def test_admin_get_promo_default(self, admin_headers):
        r = requests.get(f"{API}/citadelle/admin/promo", headers=admin_headers, timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert "enabled" in data
        assert "discount_percent" in data
        assert "label" in data

    def test_admin_patch_activate_promo(self, admin_headers):
        payload = {
            "enabled": True,
            "discount_percent": 20,
            "label": "Offre de lancement",
            "ends_at": "2026-12-31",
        }
        r = requests.patch(f"{API}/citadelle/admin/promo", json=payload, headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["enabled"] is True
        assert d["discount_percent"] == 20
        assert d["label"] == "Offre de lancement"
        assert d["ends_at"] == "2026-12-31"

    def test_admin_get_promo_after_patch(self, admin_headers):
        r = requests.get(f"{API}/citadelle/admin/promo", headers=admin_headers, timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["enabled"] is True
        assert d["discount_percent"] == 20


class TestPromoPublic:
    def test_public_promo_active(self):
        r = requests.get(f"{API}/citadelle/promo", timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["active"] is True
        assert d["discount_percent"] == 20
        assert d["label"] == "Offre de lancement"
        assert d["ends_at"] == "2026-12-31"


class TestCheckoutAppliesPromo:
    def test_checkout_uses_reduced_price(self, estimation_standard_id):
        """Vérifie que le checkout crée une session Stripe avec le prix réduit."""
        payload = {
            "service_id": estimation_standard_id,
            "client_name": "TEST_Promo Client",
            "client_email": "test_promo@example.com",
            "origin_url": BASE_URL,
        }
        r = requests.post(f"{API}/citadelle/payments/service/checkout", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "checkout_url" in d
        assert "session_id" in d
        session_id = d["session_id"]

        # Vérifier la transaction en BDD via requête Mongo directe
        import pymongo
        mongo_url = os.environ.get("MONGO_URL")
        db_name = os.environ.get("DB_NAME")
        client = pymongo.MongoClient(mongo_url)
        db = client[db_name]
        tx = db.payment_transactions.find_one({"session_id": session_id})
        assert tx is not None, "Transaction non enregistrée"
        assert tx["amount"] == 39.2, f"amount attendu 39.2, obtenu {tx['amount']}"
        assert tx["original_amount"] == 49.0, f"original_amount attendu 49, obtenu {tx.get('original_amount')}"
        assert tx["promo_percent"] == 20, f"promo_percent attendu 20, obtenu {tx.get('promo_percent')}"
        client.close()


class TestPromoDeactivation:
    def test_deactivate_promo(self, admin_headers):
        r = requests.patch(f"{API}/citadelle/admin/promo",
                           json={"enabled": False}, headers=admin_headers, timeout=15)
        assert r.status_code == 200
        assert r.json()["enabled"] is False

    def test_public_promo_inactive_after_disable(self):
        r = requests.get(f"{API}/citadelle/promo", timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["active"] is False
        assert d["discount_percent"] == 0

    def test_checkout_uses_full_price_when_disabled(self, estimation_standard_id):
        payload = {
            "service_id": estimation_standard_id,
            "client_name": "TEST_Full Price",
            "client_email": "test_full@example.com",
            "origin_url": BASE_URL,
        }
        r = requests.post(f"{API}/citadelle/payments/service/checkout", json=payload, timeout=30)
        assert r.status_code == 200
        session_id = r.json()["session_id"]
        import pymongo
        client = pymongo.MongoClient(os.environ.get("MONGO_URL"))
        db = client[os.environ.get("DB_NAME")]
        tx = db.payment_transactions.find_one({"session_id": session_id})
        assert tx["amount"] == 49.0
        assert tx.get("promo_percent", 0) == 0
        client.close()


class TestPromoExpiration:
    def test_expired_promo_is_inactive(self, admin_headers):
        # Activer avec date passée
        payload = {"enabled": True, "discount_percent": 20, "ends_at": "2020-01-01"}
        r = requests.patch(f"{API}/citadelle/admin/promo", json=payload, headers=admin_headers, timeout=15)
        assert r.status_code == 200
        # Public doit renvoyer active:false
        r2 = requests.get(f"{API}/citadelle/promo", timeout=10)
        assert r2.status_code == 200
        d = r2.json()
        assert d["active"] is False, f"Promo expirée devrait être inactive: {d}"
        assert d["discount_percent"] == 0
        # Remettre enabled=false
        requests.patch(f"{API}/citadelle/admin/promo",
                       json={"enabled": False, "ends_at": None},
                       headers=admin_headers, timeout=15)
