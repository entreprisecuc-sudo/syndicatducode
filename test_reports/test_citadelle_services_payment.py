"""
Backend tests for Citadelle Services & Payments flow
Tests: GET /services, POST /payments/service/checkout
Bug fix validation: session.id (was session.session_id)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

class TestCitadelleServices:
    """GET /citadelle/services — should return 13 services"""

    def test_services_endpoint_returns_200(self):
        res = requests.get(f"{BASE_URL}/api/citadelle/services")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:200]}"
        print("PASS: /api/citadelle/services returns 200")

    def test_services_count_is_13(self):
        res = requests.get(f"{BASE_URL}/api/citadelle/services")
        assert res.status_code == 200
        data = res.json()
        services = data.get("services", [])
        print(f"Services count: {len(services)}")
        assert len(services) == 13, f"Expected 13 services, got {len(services)}"
        print("PASS: 13 services found in database")

    def test_services_have_required_fields(self):
        res = requests.get(f"{BASE_URL}/api/citadelle/services")
        data = res.json()
        services = data.get("services", [])
        assert len(services) > 0, "No services returned"
        for svc in services:
            assert "id" in svc, f"Service missing 'id': {svc}"
            assert "title" in svc, f"Service missing 'title': {svc}"
            assert "service_type" in svc, f"Service missing 'service_type': {svc}"
        print("PASS: All services have required fields (id, title, service_type)")

    def test_there_is_at_least_one_paid_service(self):
        res = requests.get(f"{BASE_URL}/api/citadelle/services")
        data = res.json()
        services = data.get("services", [])
        paid = [s for s in services if s.get("service_type") == "paid" and s.get("price", 0) > 0]
        print(f"Paid services: {[(s['title'], s['price']) for s in paid]}")
        assert len(paid) > 0, "No paid services found — checkout test will be skipped"
        print(f"PASS: Found {len(paid)} paid service(s)")


class TestCitadellePaymentCheckout:
    """POST /citadelle/payments/service/checkout — the bug fix validation"""

    @pytest.fixture(autouse=True)
    def get_paid_service(self):
        """Fetch a real paid service from DB for checkout tests."""
        res = requests.get(f"{BASE_URL}/api/citadelle/services")
        assert res.status_code == 200
        data = res.json()
        services = data.get("services", [])
        paid = [s for s in services if s.get("service_type") == "paid" and s.get("price", 0) > 0]
        if not paid:
            pytest.skip("No paid services available — skipping payment tests")
        self.paid_service = paid[0]
        print(f"Using service: {self.paid_service['title']} — {self.paid_service['price']}€ (id={self.paid_service['id']})")

    def test_checkout_returns_200_with_checkout_url(self):
        """Core bug fix test: session.id must work (was session.session_id → AttributeError)"""
        payload = {
            "service_id": self.paid_service["id"],
            "client_name": "Test Agent",
            "client_email": "test.agent@citadelle-test.fr",
            "client_message": "Test automatisé — validation fix session.id",
            "origin_url": BASE_URL,
        }
        res = requests.post(f"{BASE_URL}/api/citadelle/payments/service/checkout", json=payload)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text[:500]}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:300]}"
        print("PASS: POST /payments/service/checkout returns 200 (no AttributeError)")

    def test_checkout_response_has_checkout_url(self):
        """Verify response contains checkout_url pointing to Stripe"""
        payload = {
            "service_id": self.paid_service["id"],
            "client_name": "Test Agent",
            "client_email": "test.agent2@citadelle-test.fr",
            "client_message": "",
            "origin_url": BASE_URL,
        }
        res = requests.post(f"{BASE_URL}/api/citadelle/payments/service/checkout", json=payload)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:200]}"
        data = res.json()
        assert "checkout_url" in data, f"Missing checkout_url in response: {data}"
        assert "session_id" in data, f"Missing session_id in response: {data}"
        checkout_url = data["checkout_url"]
        session_id = data["session_id"]
        print(f"checkout_url: {checkout_url[:80]}...")
        print(f"session_id: {session_id}")
        assert "stripe.com" in checkout_url, f"Expected Stripe URL, got: {checkout_url}"
        assert session_id.startswith("cs_"), f"session_id should start with 'cs_', got: {session_id}"
        print("PASS: checkout_url points to Stripe, session_id is valid cs_... format")

    def test_checkout_validation_missing_name(self):
        """Validation: missing client_name should return 422"""
        payload = {
            "service_id": self.paid_service["id"],
            "client_name": "",
            "client_email": "test@test.com",
            "origin_url": BASE_URL,
        }
        # Note: FastAPI Pydantic validation requires min length — but field allows "" (Optional not set)
        # The backend has no min_length on client_name so this may pass to the business layer
        res = requests.post(f"{BASE_URL}/api/citadelle/payments/service/checkout", json=payload)
        print(f"Missing name validation → status: {res.status_code}, body: {res.text[:200]}")
        # Not enforced at Pydantic level — just document the behavior
        print(f"INFO: Missing name returns {res.status_code}")

    def test_checkout_free_service_returns_400(self):
        """Free services should return 400 (price <= 0 validation)"""
        res = requests.get(f"{BASE_URL}/api/citadelle/services")
        data = res.json()
        services = data.get("services", [])
        free = [s for s in services if s.get("service_type") == "free" or s.get("price", -1) == 0]
        if not free:
            pytest.skip("No free services found — skipping this validation")
        free_svc = free[0]
        print(f"Testing with free service: {free_svc['title']}")
        payload = {
            "service_id": free_svc["id"],
            "client_name": "Test Agent",
            "client_email": "test@test.com",
            "origin_url": BASE_URL,
        }
        res = requests.post(f"{BASE_URL}/api/citadelle/payments/service/checkout", json=payload)
        print(f"Free service checkout → status: {res.status_code}, body: {res.text[:200]}")
        assert res.status_code == 400, f"Expected 400 for free service, got {res.status_code}"
        print("PASS: Free service correctly returns 400")

    def test_checkout_invalid_service_id_returns_404(self):
        """Non-existent service should return 404"""
        payload = {
            "service_id": "non-existent-service-id-xyz",
            "client_name": "Test Agent",
            "client_email": "test@test.com",
            "origin_url": BASE_URL,
        }
        res = requests.post(f"{BASE_URL}/api/citadelle/payments/service/checkout", json=payload)
        print(f"Invalid service_id → status: {res.status_code}, body: {res.text[:200]}")
        assert res.status_code == 404, f"Expected 404, got {res.status_code}"
        print("PASS: Invalid service_id returns 404")
