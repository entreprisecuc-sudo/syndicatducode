"""
Tests modération Citadelle — warn / suspend / ban / reactivate.
Vérifie login autorisé pour suspended/banned, blocage des actions (require_can_transact),
accès conservé aux consultations (invoices/my, transmissions/my, auth/me),
et vue banni (require_citadelle_user bloque banned pour /member/activity).

IMPORTANT: modère UNIQUEMENT arnaudaube@gmail.com. Reactivate à la fin.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://code-syndicate-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api/citadelle"

ADMIN_EMAIL = "bigpapa1981@asar.com"
ADMIN_PASSWORD = "Josiane03@@@!1981"
MEMBER_EMAIL = "arnaudaube@gmail.com"
MEMBER_PASSWORD = "ArnaudTest2026!"
MEMBER_ID = "7bd37587-6ef6-49ff-aa09-cdc4083a8637"


def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=20)
    return r


@pytest.fixture(scope="module")
def admin_token():
    r = _login(ADMIN_EMAIL, ADMIN_PASSWORD)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


def _member_login_token():
    r = _login(MEMBER_EMAIL, MEMBER_PASSWORD)
    assert r.status_code == 200, f"Member login failed: {r.status_code} {r.text}"
    return r.json()["access_token"], r.json()


@pytest.fixture(scope="module", autouse=True)
def _ensure_active_at_end(admin_headers):
    """Reactivate arnaudaube after the whole module runs, no matter what."""
    yield
    try:
        requests.post(f"{API}/admin/members/{MEMBER_ID}/reactivate", headers=admin_headers, timeout=15)
    except Exception:
        pass


def _reactivate(admin_headers):
    r = requests.post(f"{API}/admin/members/{MEMBER_ID}/reactivate", headers=admin_headers, timeout=15)
    assert r.status_code == 200, f"reactivate failed: {r.status_code} {r.text}"


# ─── 1. WARN ──────────────────────────────────────────────────────────────────
def test_warn_member_returns_until_and_keeps_active(admin_headers):
    _reactivate(admin_headers)
    body = {"reason": "QA test avertissement", "note": "test automatisé - ignore"}
    r = requests.post(f"{API}/admin/members/{MEMBER_ID}/warn", headers=admin_headers, json=body, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("success") is True
    assert "until" in data and data["until"], "warn should return an 'until' timestamp"

    # Le membre RESTE active
    token, u = _member_login_token()
    assert u["user"]["status"] == "active"

    # /auth/me montre l'entrée moderation_log avec type warning + until
    me = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"}, timeout=15)
    assert me.status_code == 200, me.text
    log = me.json().get("moderation_log", []) or me.json().get("user", {}).get("moderation_log", [])
    assert any(e.get("type") == "warning" and e.get("until") for e in log), f"moderation_log missing warning entry: {log}"


# ─── 2. SUSPEND ───────────────────────────────────────────────────────────────
def test_suspend_blocks_actions_but_allows_consultation(admin_headers):
    _reactivate(admin_headers)
    body = {"reason": "QA suspension", "note": "test auto", "weeks": 1}
    r = requests.post(f"{API}/admin/members/{MEMBER_ID}/suspend", headers=admin_headers, json=body, timeout=20)
    assert r.status_code == 200, r.text
    assert r.json().get("suspended_until")

    # Le membre suspendu peut se connecter
    token, u = _member_login_token()
    assert u["user"]["status"] == "suspended"
    h = {"Authorization": f"Bearer {token}"}

    # Consultations : 200
    for path in ["/auth/me", "/invoices/my", "/transmissions/my"]:
        rr = requests.get(f"{API}{path}", headers=h, timeout=15)
        assert rr.status_code == 200, f"suspended member GET {path} expected 200, got {rr.status_code}: {rr.text[:200]}"

    # Actions bloquées : 403 sur require_can_transact
    # create listing
    rr = requests.post(f"{API}/listings", headers=h, json={
        "title": "QA", "description": "x" * 30, "category": "site",
        "price": 100.0, "sale_mode": "fixed",
    }, timeout=15)
    assert rr.status_code == 403, f"POST /listings suspended expected 403, got {rr.status_code}: {rr.text[:200]}"

    # place bid
    fake_listing = str(uuid.uuid4())
    rr = requests.post(f"{API}/listings/{fake_listing}/bid", headers=h, json={"amount": 100}, timeout=15)
    assert rr.status_code == 403, f"POST /listings/../bid suspended expected 403, got {rr.status_code}"

    # offer
    rr = requests.post(f"{API}/transactions/offer", headers=h, json={"listing_id": fake_listing, "amount": 100}, timeout=15)
    assert rr.status_code == 403, f"POST /transactions/offer suspended expected 403, got {rr.status_code}"

    # pay
    rr = requests.post(f"{API}/transactions/{uuid.uuid4()}/pay", headers=h, json={}, timeout=15)
    assert rr.status_code == 403, f"POST /transactions/../pay suspended expected 403, got {rr.status_code}"

    _reactivate(admin_headers)


# ─── 3. BAN ───────────────────────────────────────────────────────────────────
def test_ban_blocks_require_citadelle_user_but_allows_invoices_transmissions(admin_headers):
    _reactivate(admin_headers)
    body = {"reason": "QA bannissement", "note": "test auto"}
    r = requests.post(f"{API}/admin/members/{MEMBER_ID}/ban", headers=admin_headers, json=body, timeout=20)
    assert r.status_code == 200, r.text

    # Le membre banni peut se connecter
    token, u = _member_login_token()
    assert u["user"]["status"] == "banned"
    h = {"Authorization": f"Bearer {token}"}

    # Consultations autorisées (n'utilisent PAS require_citadelle_user) : 200
    for path in ["/invoices/my", "/transmissions/my"]:
        rr = requests.get(f"{API}{path}", headers=h, timeout=15)
        assert rr.status_code == 200, f"banned member GET {path} expected 200, got {rr.status_code}: {rr.text[:200]}"

    # /auth/me : accepté (route standard get_current_user)
    rr = requests.get(f"{API}/auth/me", headers=h, timeout=15)
    assert rr.status_code == 200, f"banned /auth/me expected 200 got {rr.status_code}"

    # Endpoints require_citadelle_user → 403
    for path in ["/member/activity", "/listings/my", "/messages/my", "/transactions/my"]:
        rr = requests.get(f"{API}{path}", headers=h, timeout=15)
        assert rr.status_code == 403, f"banned GET {path} expected 403, got {rr.status_code}: {rr.text[:200]}"

    _reactivate(admin_headers)


# ─── 4. REACTIVATE restores actions ───────────────────────────────────────────
def test_reactivate_restores_actions(admin_headers):
    # Suspend then reactivate, then verify /listings/my works (200)
    requests.post(f"{API}/admin/members/{MEMBER_ID}/suspend", headers=admin_headers,
                  json={"reason": "QA", "note": "", "weeks": 1}, timeout=15)
    _reactivate(admin_headers)

    token, u = _member_login_token()
    assert u["user"]["status"] == "active"
    h = {"Authorization": f"Bearer {token}"}
    rr = requests.get(f"{API}/listings/my", headers=h, timeout=15)
    assert rr.status_code == 200, f"active member GET /listings/my expected 200 got {rr.status_code}"


# ─── 5. Login autorisé pour tous les statuts ──────────────────────────────────
def test_login_allowed_for_suspended(admin_headers):
    requests.post(f"{API}/admin/members/{MEMBER_ID}/suspend", headers=admin_headers,
                  json={"reason": "QA login-suspended", "note": "", "weeks": 1}, timeout=15)
    r = _login(MEMBER_EMAIL, MEMBER_PASSWORD)
    assert r.status_code == 200, f"suspended login expected 200 got {r.status_code}: {r.text}"
    assert r.json()["user"]["status"] == "suspended"
    _reactivate(admin_headers)


def test_login_allowed_for_banned(admin_headers):
    requests.post(f"{API}/admin/members/{MEMBER_ID}/ban", headers=admin_headers,
                  json={"reason": "QA login-banned", "note": ""}, timeout=15)
    r = _login(MEMBER_EMAIL, MEMBER_PASSWORD)
    assert r.status_code == 200, f"banned login expected 200 got {r.status_code}: {r.text}"
    assert r.json()["user"]["status"] == "banned"
    _reactivate(admin_headers)
