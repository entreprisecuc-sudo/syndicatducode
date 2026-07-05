"""
Tests for Citadelle transaction negotiation ping-pong:
- POST /api/citadelle/transactions/{id}/buyer-counter  (NEW)
- POST /api/citadelle/transactions/{id}/refuse-counter (REMOVED -> 404)
- Regression: withdraw-offer, accept-counter, refuse
"""
import os
import subprocess
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.strip().split("=", 1)[1].rstrip("/")

API = f"{BASE_URL}/api/citadelle"
BUYER = ("test.acheteur@citadelle.fr", "DemoAcheteur2026!")
SELLER = ("test.vendeur@citadelle.fr", "DemoVendeur2026!")


def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def _reseed():
    r = subprocess.run(
        ["python3", "scripts/seed_test_transactions.py"],
        cwd="/app/backend", check=True, capture_output=True, text=True
    )
    ids = {}
    for line in r.stdout.splitlines():
        line = line.strip()
        for status in ("offer_sent", "offer_countered", "offer_accepted", "payment_done", "completed"):
            if line.startswith(("1.", "2.", "3.", "4.", "5.")) and status in line:
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
    ids = _reseed()
    yield ids
    _reseed()


def _auth(t):
    return {"Authorization": f"Bearer {t}"}


# ── buyer-counter (new) ───────────────────────────────────────────────────────

def test_buyer_counter_success_countered_to_offer_sent(buyer_token, seed_ids):
    tx_id = seed_ids["offer_countered"]
    payload = {"amount": 1777.0, "message": "Je vous propose 1777 euros, merci."}
    r = requests.post(f"{API}/transactions/{tx_id}/buyer-counter",
                      headers=_auth(buyer_token), json=payload)
    assert r.status_code == 200, r.text
    g = requests.get(f"{API}/transactions/{tx_id}", headers=_auth(buyer_token)).json()
    assert g["status"] == "offer_sent"
    assert g["offer_amount"] == 1777.0
    assert g.get("counter_amount") in (None, 0)
    assert g.get("counter_message") in (None, "")
    # 2 messages appended: system + buyer message (at least)
    contents = [m.get("content", "") for m in g.get("messages", [])]
    assert any("Nouvelle proposition" in c for c in contents)
    assert any("1777" in c for c in contents)


def test_buyer_counter_wrong_status_offer_sent(buyer_token, seed_ids):
    tx_id = seed_ids["offer_sent"]
    r = requests.post(f"{API}/transactions/{tx_id}/buyer-counter",
                      headers=_auth(buyer_token),
                      json={"amount": 100.0, "message": "un message assez long"})
    assert r.status_code == 400, r.text


def test_buyer_counter_wrong_status_offer_accepted(buyer_token, seed_ids):
    tx_id = seed_ids["offer_accepted"]
    r = requests.post(f"{API}/transactions/{tx_id}/buyer-counter",
                      headers=_auth(buyer_token),
                      json={"amount": 100.0, "message": "un message assez long"})
    assert r.status_code == 400, r.text


def test_buyer_counter_wrong_status_payment_done(buyer_token, seed_ids):
    tx_id = seed_ids["payment_done"]
    r = requests.post(f"{API}/transactions/{tx_id}/buyer-counter",
                      headers=_auth(buyer_token),
                      json={"amount": 100.0, "message": "un message assez long"})
    assert r.status_code == 400, r.text


def test_buyer_counter_forbidden_for_seller(seller_token, seed_ids):
    tx_id = seed_ids["offer_countered"]
    r = requests.post(f"{API}/transactions/{tx_id}/buyer-counter",
                      headers=_auth(seller_token),
                      json={"amount": 100.0, "message": "un message assez long"})
    assert r.status_code == 403, r.text


# ── refuse-counter removed ────────────────────────────────────────────────────

def test_refuse_counter_removed(buyer_token, seed_ids):
    tx_id = seed_ids["offer_countered"]
    r = requests.post(f"{API}/transactions/{tx_id}/refuse-counter",
                      headers=_auth(buyer_token))
    assert r.status_code == 404, f"expected 404, got {r.status_code} {r.text}"


# ── Ping-pong flow ────────────────────────────────────────────────────────────

def test_full_ping_pong_negotiation(buyer_token, seller_token, seed_ids):
    """offer_sent -> counter -> buyer-counter -> counter -> accept-counter."""
    tx_id = seed_ids["offer_sent"]

    # 1. seller counter (offer_sent -> offer_countered)
    r = requests.post(f"{API}/transactions/{tx_id}/counter",
                      headers=_auth(seller_token),
                      json={"amount": 1500.0, "message": "Ma contre-proposition initiale à 1500."})
    assert r.status_code == 200, r.text
    g = requests.get(f"{API}/transactions/{tx_id}", headers=_auth(buyer_token)).json()
    assert g["status"] == "offer_countered"
    assert g["counter_amount"] == 1500.0

    # 2. buyer counter (offer_countered -> offer_sent)
    r = requests.post(f"{API}/transactions/{tx_id}/buyer-counter",
                      headers=_auth(buyer_token),
                      json={"amount": 1300.0, "message": "Je remonte a 1300 euros svp."})
    assert r.status_code == 200, r.text
    g = requests.get(f"{API}/transactions/{tx_id}", headers=_auth(buyer_token)).json()
    assert g["status"] == "offer_sent"
    assert g["offer_amount"] == 1300.0
    assert g.get("counter_amount") in (None, 0)

    # 3. seller counter again (offer_sent -> offer_countered)
    r = requests.post(f"{API}/transactions/{tx_id}/counter",
                      headers=_auth(seller_token),
                      json={"amount": 1400.0, "message": "Ma nouvelle contre-offre à 1400."})
    assert r.status_code == 200, r.text
    g = requests.get(f"{API}/transactions/{tx_id}", headers=_auth(buyer_token)).json()
    assert g["status"] == "offer_countered"
    assert g["counter_amount"] == 1400.0

    # 4. buyer accepts counter (offer_countered -> offer_accepted)
    r = requests.post(f"{API}/transactions/{tx_id}/accept-counter",
                      headers=_auth(buyer_token))
    assert r.status_code == 200, r.text
    g = requests.get(f"{API}/transactions/{tx_id}", headers=_auth(buyer_token)).json()
    assert g["status"] == "offer_accepted"
    assert g["payment_amount"] == 1400.0


# ── Regression: existing endpoints still work ─────────────────────────────────

def test_regression_withdraw_from_offer_sent(buyer_token, seed_ids):
    tx_id = seed_ids["offer_sent"]
    r = requests.post(f"{API}/transactions/{tx_id}/withdraw-offer",
                      headers=_auth(buyer_token))
    assert r.status_code == 200, r.text
    g = requests.get(f"{API}/transactions/{tx_id}", headers=_auth(buyer_token)).json()
    assert g["status"] == "cancelled"
    assert g.get("cancelled_by_buyer") is True


def test_regression_withdraw_from_offer_countered(buyer_token, seed_ids):
    tx_id = seed_ids["offer_countered"]
    r = requests.post(f"{API}/transactions/{tx_id}/withdraw-offer",
                      headers=_auth(buyer_token))
    assert r.status_code == 200, r.text


def test_regression_withdraw_from_offer_accepted(buyer_token, seed_ids):
    tx_id = seed_ids["offer_accepted"]
    r = requests.post(f"{API}/transactions/{tx_id}/withdraw-offer",
                      headers=_auth(buyer_token))
    assert r.status_code == 200, r.text


def test_regression_accept_counter(buyer_token, seed_ids):
    tx_id = seed_ids["offer_countered"]
    r = requests.post(f"{API}/transactions/{tx_id}/accept-counter",
                      headers=_auth(buyer_token))
    assert r.status_code == 200, r.text
    g = requests.get(f"{API}/transactions/{tx_id}", headers=_auth(buyer_token)).json()
    assert g["status"] == "offer_accepted"


def test_regression_seller_refuse_from_offer_sent(seller_token, seed_ids):
    tx_id = seed_ids["offer_sent"]
    r = requests.post(f"{API}/transactions/{tx_id}/refuse",
                      headers=_auth(seller_token))
    assert r.status_code == 200, r.text
    g = requests.get(f"{API}/transactions/{tx_id}", headers=_auth(seller_token)).json()
    assert g["status"] == "offer_refused"


def test_regression_seller_refuse_from_offer_countered(seller_token, seed_ids):
    tx_id = seed_ids["offer_countered"]
    r = requests.post(f"{API}/transactions/{tx_id}/refuse",
                      headers=_auth(seller_token))
    assert r.status_code == 200, r.text
    g = requests.get(f"{API}/transactions/{tx_id}", headers=_auth(seller_token)).json()
    assert g["status"] == "offer_refused"
