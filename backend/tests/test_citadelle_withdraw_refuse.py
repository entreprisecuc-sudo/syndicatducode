"""
Tests for new Citadelle transaction endpoints:
- POST /api/citadelle/transactions/{id}/withdraw-offer
- POST /api/citadelle/transactions/{id}/refuse-counter
"""
import os
import subprocess
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.strip().split("=", 1)[1].rstrip("/")

API = f"{BASE_URL}/api/citadelle"

BUYER = ("test.acheteur@citadelle.fr", "DemoAcheteur2026!")
SELLER = ("test.vendeur@citadelle.fr", "DemoVendeur2026!")


def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    tok = r.json().get("access_token")
    assert tok, f"no access_token in login response: {r.json()}"
    return tok


def _reseed():
    subprocess.run(
        ["python3", "scripts/seed_test_transactions.py"],
        cwd="/app/backend", check=True, capture_output=True
    )


def _seed_tx_ids():
    """Returns dict of status->tx_id from seed output."""
    result = subprocess.run(
        ["python3", "scripts/seed_test_transactions.py"],
        cwd="/app/backend", check=True, capture_output=True, text=True
    )
    ids = {}
    for line in result.stdout.splitlines():
        line = line.strip()
        for status in ("offer_sent", "offer_countered", "offer_accepted", "payment_done", "completed"):
            if line.startswith(("1.", "2.", "3.", "4.", "5.")) and status in line:
                # id is the last token
                ids[status] = line.split("→")[-1].strip().split()[0]
                break
    return ids


@pytest.fixture(scope="module")
def buyer_token():
    return _login(*BUYER)


@pytest.fixture(scope="module")
def seller_token():
    return _login(*SELLER)


@pytest.fixture
def seed_ids():
    ids = _seed_tx_ids()
    yield ids
    _reseed()


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


# ── withdraw-offer ────────────────────────────────────────────────────────────

def test_withdraw_from_offer_sent(buyer_token, seed_ids):
    tx_id = seed_ids["offer_sent"]
    r = requests.post(f"{API}/transactions/{tx_id}/withdraw-offer", headers=_auth(buyer_token))
    assert r.status_code == 200, r.text
    # verify persisted
    g = requests.get(f"{API}/transactions/{tx_id}", headers=_auth(buyer_token))
    assert g.status_code == 200
    data = g.json()
    assert data["status"] == "cancelled"
    assert data.get("cancelled_by_buyer") is True


def test_withdraw_from_offer_countered(buyer_token, seed_ids):
    tx_id = seed_ids["offer_countered"]
    r = requests.post(f"{API}/transactions/{tx_id}/withdraw-offer", headers=_auth(buyer_token))
    assert r.status_code == 200, r.text
    g = requests.get(f"{API}/transactions/{tx_id}", headers=_auth(buyer_token)).json()
    assert g["status"] == "cancelled"
    assert g.get("cancelled_by_buyer") is True


def test_withdraw_from_offer_accepted(buyer_token, seed_ids):
    tx_id = seed_ids["offer_accepted"]
    r = requests.post(f"{API}/transactions/{tx_id}/withdraw-offer", headers=_auth(buyer_token))
    assert r.status_code == 200, r.text
    g = requests.get(f"{API}/transactions/{tx_id}", headers=_auth(buyer_token)).json()
    assert g["status"] == "cancelled"
    assert g.get("cancelled_by_buyer") is True


def test_withdraw_forbidden_for_seller(seller_token, seed_ids):
    tx_id = seed_ids["offer_sent"]
    r = requests.post(f"{API}/transactions/{tx_id}/withdraw-offer", headers=_auth(seller_token))
    assert r.status_code == 403, r.text


def test_withdraw_forbidden_after_payment(buyer_token, seed_ids):
    tx_id = seed_ids["payment_done"]
    r = requests.post(f"{API}/transactions/{tx_id}/withdraw-offer", headers=_auth(buyer_token))
    assert r.status_code == 400, r.text


def test_withdraw_forbidden_after_completion(buyer_token, seed_ids):
    tx_id = seed_ids["completed"]
    r = requests.post(f"{API}/transactions/{tx_id}/withdraw-offer", headers=_auth(buyer_token))
    assert r.status_code == 400, r.text


# ── refuse-counter ────────────────────────────────────────────────────────────

def test_refuse_counter_success(buyer_token, seed_ids):
    tx_id = seed_ids["offer_countered"]
    r = requests.post(f"{API}/transactions/{tx_id}/refuse-counter", headers=_auth(buyer_token))
    assert r.status_code == 200, r.text
    g = requests.get(f"{API}/transactions/{tx_id}", headers=_auth(buyer_token)).json()
    assert g["status"] == "offer_refused"


def test_refuse_counter_wrong_status(buyer_token, seed_ids):
    tx_id = seed_ids["offer_sent"]  # not countered
    r = requests.post(f"{API}/transactions/{tx_id}/refuse-counter", headers=_auth(buyer_token))
    assert r.status_code == 400, r.text


def test_refuse_counter_forbidden_for_seller(seller_token, seed_ids):
    tx_id = seed_ids["offer_countered"]
    r = requests.post(f"{API}/transactions/{tx_id}/refuse-counter", headers=_auth(seller_token))
    assert r.status_code == 403, r.text


# ── End-to-end negotiation flow ───────────────────────────────────────────────

def _get_active_listing_of_seller(buyer_token):
    """Find a listing owned by test seller to create a new offer against."""
    r = requests.get(f"{API}/listings?limit=50", headers=_auth(buyer_token))
    assert r.status_code == 200, r.text
    items = r.json() if isinstance(r.json(), list) else r.json().get("items", [])
    seller_email = SELLER[0]
    for it in items:
        if it.get("seller_email") == seller_email or it.get("owner_email") == seller_email:
            return it["id"]
    # fallback: any listing
    return items[0]["id"] if items else None


def test_full_flow_offer_counter_refuse(buyer_token, seller_token):
    _reseed()
    listing_id = _get_active_listing_of_seller(buyer_token)
    if not listing_id:
        pytest.skip("No listing available for flow test")
    # create offer
    r = requests.post(f"{API}/transactions/offer", headers=_auth(buyer_token), json={
        "listing_id": listing_id,
        "amount": 1234.0,
        "message": "Bonjour, je suis intéressé par votre annonce."
    })
    if r.status_code != 200:
        pytest.skip(f"Cannot create offer (listing constraints): {r.status_code} {r.text}")
    tx_id = r.json().get("id") or r.json().get("transaction_id")
    assert tx_id
    # seller counter
    r = requests.post(f"{API}/transactions/{tx_id}/counter", headers=_auth(seller_token), json={
        "amount": 1500.0, "message": "Contre-proposition à 1500€ merci."
    })
    assert r.status_code == 200, r.text
    # buyer refuses counter
    r = requests.post(f"{API}/transactions/{tx_id}/refuse-counter", headers=_auth(buyer_token))
    assert r.status_code == 200, r.text
    g = requests.get(f"{API}/transactions/{tx_id}", headers=_auth(buyer_token)).json()
    assert g["status"] == "offer_refused"
    _reseed()


def test_full_flow_withdraw_after_accept(buyer_token, seller_token):
    _reseed()
    listing_id = _get_active_listing_of_seller(buyer_token)
    if not listing_id:
        pytest.skip("No listing available for flow test")
    r = requests.post(f"{API}/transactions/offer", headers=_auth(buyer_token), json={
        "listing_id": listing_id,
        "amount": 2222.0,
        "message": "Je propose 2222 euros pour cet actif numérique."
    })
    if r.status_code != 200:
        pytest.skip(f"Cannot create offer: {r.status_code} {r.text}")
    tx_id = r.json().get("id") or r.json().get("transaction_id")
    # seller accepts
    r = requests.post(f"{API}/transactions/{tx_id}/accept", headers=_auth(seller_token))
    assert r.status_code == 200, r.text
    # buyer withdraws
    r = requests.post(f"{API}/transactions/{tx_id}/withdraw-offer", headers=_auth(buyer_token))
    assert r.status_code == 200, r.text
    g = requests.get(f"{API}/transactions/{tx_id}", headers=_auth(buyer_token)).json()
    assert g["status"] == "cancelled"
    assert g.get("cancelled_by_buyer") is True
    _reseed()
