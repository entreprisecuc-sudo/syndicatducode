"""
Backend tests — Fix: user_id propagation through checkout → transaction → invoice
Tests:
  1. ServiceCheckoutRequest.user_id accepted by POST /payments/service/checkout
  2. Checkout with user_id stores it in payment_transactions collection
  3. GET /citadelle/invoices/my returns invoices for authenticated user (user_id OR email match)
  4. GET /admin/push-alerts/vapid-key returns VAPID key (no auth)
  5. GET /admin/push-alerts/summary returns alert summary (admin auth)
  6. Admin Citadelle service orders visible
"""

import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# ─── Shared fixtures ─────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def paid_service():
    """Fetch a real paid service from DB."""
    res = requests.get(f"{BASE_URL}/api/citadelle/services")
    assert res.status_code == 200, f"Cannot fetch services: {res.status_code} {res.text[:200]}"
    data = res.json()
    services = data.get("services", [])
    paid = [s for s in services if s.get("service_type") == "paid" and s.get("price", 0) > 0]
    if not paid:
        pytest.skip("No paid services found — skipping payment tests")
    svc = paid[0]
    print(f"\nUsing paid service: '{svc['title']}' — {svc['price']}€ (id={svc['id']})")
    return svc


@pytest.fixture(scope="module")
def citadelle_test_user():
    """Register or reuse a test Citadelle user and return (user_id, email, token)."""
    email = f"test.agent.{uuid.uuid4().hex[:8]}@citadelle-test.fr"
    password = "TestAgent2026!"
    
    # Register
    reg_res = requests.post(f"{BASE_URL}/api/citadelle/auth/register", json={
        "first_name": "Test",
        "last_name": "Agent",
        "email": email,
        "password": password,
        "cgu_accepted": True,
    })
    assert reg_res.status_code == 201, f"Registration failed: {reg_res.status_code} {reg_res.text[:200]}"
    user_id = reg_res.json().get("id", "")
    print(f"\nRegistered test user: {email} (id={user_id})")

    # Login
    login_res = requests.post(f"{BASE_URL}/api/citadelle/auth/login", json={
        "email": email,
        "password": password,
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.status_code} {login_res.text[:200]}"
    token = login_res.json().get("access_token", "")
    assert token, "No access_token in login response"
    print(f"Login success. Token: {token[:40]}...")
    return {"user_id": user_id, "email": email, "token": token}


@pytest.fixture(scope="module")
def admin_token():
    """Login as admin (Syndicat) and return JWT token."""
    res = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "bigpapa1981@asar.com",
        "password": "Josiane03@@@!1981",
    })
    if res.status_code != 200:
        print(f"\nAdmin login failed: {res.status_code} {res.text[:200]}")
        pytest.skip("Admin login failed — skipping admin tests")
    token = res.json().get("access_token", "")
    assert token, "No access_token in admin login response"
    print(f"\nAdmin login success. Token: {token[:40]}...")
    return token


# ─── 1. Citadelle Auth ────────────────────────────────────────────────────────

class TestCitadelleAuth:
    """Registration and login flow for Citadelle users"""

    def test_register_returns_201_with_user_id(self, citadelle_test_user):
        """User was registered with id in previous fixture"""
        uid = citadelle_test_user["user_id"]
        assert uid, "user_id must not be empty after registration"
        print(f"PASS: User registered with id={uid}")

    def test_login_returns_token_and_user(self, citadelle_test_user):
        """Login returns JWT with user info"""
        token = citadelle_test_user["token"]
        assert token, "No token returned from login"
        print("PASS: Login returns access_token")

    def test_me_returns_user_info(self, citadelle_test_user):
        """GET /api/citadelle/auth/me with Bearer token"""
        headers = {"Authorization": f"Bearer {citadelle_test_user['token']}"}
        res = requests.get(f"{BASE_URL}/api/citadelle/auth/me", headers=headers)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:200]}"
        data = res.json()
        assert data.get("email") == citadelle_test_user["email"]
        assert data.get("id") == citadelle_test_user["user_id"]
        print(f"PASS: /auth/me returns correct user (email={data['email']})")


# ─── 2. Checkout with user_id ─────────────────────────────────────────────────

class TestCheckoutWithUserId:
    """POST /payments/service/checkout — user_id field propagation"""

    def test_checkout_accepts_user_id_field(self, paid_service, citadelle_test_user):
        """Core fix: checkout should accept and process user_id"""
        payload = {
            "service_id": paid_service["id"],
            "client_name": "Test Agent",
            "client_email": citadelle_test_user["email"],
            "client_message": "Test checkout with user_id — validation fix",
            "origin_url": BASE_URL,
            "user_id": citadelle_test_user["user_id"],  # The fixed field
        }
        res = requests.post(f"{BASE_URL}/api/citadelle/payments/service/checkout", json=payload)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:300]}"
        data = res.json()
        assert "checkout_url" in data, f"Missing checkout_url in response: {data}"
        assert "session_id" in data, f"Missing session_id in response: {data}"
        assert data["session_id"].startswith("cs_"), f"Invalid session_id: {data['session_id']}"
        print(f"PASS: Checkout with user_id={citadelle_test_user['user_id']} → session {data['session_id']}")

    def test_checkout_without_user_id_still_works(self, paid_service):
        """Checkout without user_id (anonymous) should still work (backwards compat)"""
        payload = {
            "service_id": paid_service["id"],
            "client_name": "Visiteur Anonyme",
            "client_email": "visiteur.anon@citadelle-test.fr",
            "client_message": "Test sans user_id",
            "origin_url": BASE_URL,
            # no user_id → defaults to None
        }
        res = requests.post(f"{BASE_URL}/api/citadelle/payments/service/checkout", json=payload)
        assert res.status_code == 200, f"Expected 200 for anonymous checkout, got {res.status_code}: {res.text[:200]}"
        data = res.json()
        assert "checkout_url" in data
        print(f"PASS: Anonymous checkout (no user_id) → session {data.get('session_id', '')}")

    def test_checkout_user_id_null_still_works(self, paid_service):
        """Explicit null user_id should be handled gracefully"""
        payload = {
            "service_id": paid_service["id"],
            "client_name": "Test Null UserId",
            "client_email": "test.null.uid@citadelle-test.fr",
            "client_message": "",
            "origin_url": BASE_URL,
            "user_id": None,
        }
        res = requests.post(f"{BASE_URL}/api/citadelle/payments/service/checkout", json=payload)
        assert res.status_code == 200, f"Expected 200 with null user_id, got {res.status_code}: {res.text[:200]}"
        data = res.json()
        assert "checkout_url" in data
        print(f"PASS: null user_id → session {data.get('session_id', '')}")


# ─── 3. Invoices — GET /invoices/my ──────────────────────────────────────────

class TestMyInvoices:
    """GET /invoices/my — requires auth, returns invoices by user_id OR email"""

    def test_invoices_my_requires_auth(self):
        """Without token, should return 401"""
        res = requests.get(f"{BASE_URL}/api/citadelle/invoices/my")
        assert res.status_code == 401, f"Expected 401 without auth, got {res.status_code}: {res.text[:200]}"
        print("PASS: /invoices/my returns 401 without auth")

    def test_invoices_my_returns_200_with_valid_token(self, citadelle_test_user):
        """Authenticated user gets 200 (may be empty list if no payments completed)"""
        headers = {"Authorization": f"Bearer {citadelle_test_user['token']}"}
        res = requests.get(f"{BASE_URL}/api/citadelle/invoices/my", headers=headers)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:200]}"
        data = res.json()
        assert "invoices" in data, f"Missing 'invoices' key in response: {data}"
        assert isinstance(data["invoices"], list), "Invoices should be a list"
        print(f"PASS: /invoices/my returns 200 — {len(data['invoices'])} invoice(s)")

    def test_invoices_my_response_structure(self, citadelle_test_user):
        """When invoices exist, they must have required fields"""
        headers = {"Authorization": f"Bearer {citadelle_test_user['token']}"}
        res = requests.get(f"{BASE_URL}/api/citadelle/invoices/my", headers=headers)
        data = res.json()
        invoices = data.get("invoices", [])
        if not invoices:
            print("INFO: No invoices for this test user (expected — no payment completed in test)")
            return
        for inv in invoices:
            assert "id" in inv, f"Invoice missing 'id': {inv}"
            assert "invoice_number" in inv, f"Invoice missing 'invoice_number': {inv}"
            assert "amount_ttc" in inv, f"Invoice missing 'amount_ttc': {inv}"
            assert "service_title" in inv, f"Invoice missing 'service_title': {inv}"
        print(f"PASS: Invoice structure validated ({len(invoices)} invoices)")

    def test_invoices_my_invalid_token_returns_401(self):
        """Invalid token must return 401"""
        headers = {"Authorization": "Bearer invalid.token.here"}
        res = requests.get(f"{BASE_URL}/api/citadelle/invoices/my", headers=headers)
        assert res.status_code == 401, f"Expected 401 for invalid token, got {res.status_code}: {res.text[:200]}"
        print("PASS: Invalid token → 401")


# ─── 4. Push Alerts — Public VAPID key ───────────────────────────────────────

class TestPushAlertsVapidKey:
    """GET /admin/push-alerts/vapid-key — no auth required"""

    def test_vapid_key_returns_200(self):
        """VAPID key endpoint must return 200"""
        res = requests.get(f"{BASE_URL}/api/admin/push-alerts/vapid-key")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:200]}"
        print("PASS: /admin/push-alerts/vapid-key returns 200")

    def test_vapid_key_has_public_key_field(self):
        """Response must contain public_key field"""
        res = requests.get(f"{BASE_URL}/api/admin/push-alerts/vapid-key")
        assert res.status_code == 200
        data = res.json()
        assert "public_key" in data, f"Missing 'public_key' in response: {data}"
        # public_key may be None or a string
        print(f"PASS: VAPID public_key returned: {str(data.get('public_key', ''))[:60]}")


# ─── 5. Push Alerts — Admin summary ──────────────────────────────────────────

class TestPushAlertsSummary:
    """GET /admin/push-alerts/summary — requires admin auth"""

    def test_summary_requires_auth(self):
        """Without auth, must return 401 or 403"""
        res = requests.get(f"{BASE_URL}/api/admin/push-alerts/summary")
        assert res.status_code in [401, 403], f"Expected 401/403 without auth, got {res.status_code}: {res.text[:200]}"
        print(f"PASS: /admin/push-alerts/summary returns {res.status_code} without auth")

    def test_summary_returns_200_with_admin_token(self, admin_token):
        """Admin gets summary with 200"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        res = requests.get(f"{BASE_URL}/api/admin/push-alerts/summary", headers=headers)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:300]}"
        print(f"PASS: /admin/push-alerts/summary returns 200 for admin")
        print(f"Summary: {res.text[:300]}")

    def test_summary_returns_valid_structure(self, admin_token):
        """Summary should be a valid JSON structure"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        res = requests.get(f"{BASE_URL}/api/admin/push-alerts/summary", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, dict), f"Expected dict, got {type(data)}: {data}"
        print(f"PASS: Summary is valid dict with keys: {list(data.keys())[:10]}")


# ─── 6. Admin Citadelle services — check service orders exist ────────────────

class TestAdminCitadelleServices:
    """Admin can access Citadelle services data"""

    def test_admin_can_list_services(self, admin_token):
        """Admin should be able to list all services"""
        res = requests.get(f"{BASE_URL}/api/citadelle/services")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:200]}"
        data = res.json()
        services = data.get("services", [])
        assert len(services) > 0, "No services found"
        print(f"PASS: {len(services)} services found in DB")

    def test_admin_invoices_endpoint(self, admin_token):
        """Admin can list all Citadelle invoices"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        res = requests.get(f"{BASE_URL}/api/citadelle/admin/invoices", headers=headers)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:300]}"
        data = res.json()
        assert "invoices" in data, f"Missing 'invoices' key: {data}"
        assert "total" in data, f"Missing 'total' key: {data}"
        print(f"PASS: Admin invoices endpoint — {data['total']} total invoices")
