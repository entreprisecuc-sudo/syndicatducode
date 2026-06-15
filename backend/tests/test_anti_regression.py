"""
Anti-regression test suite for the Syndicat / Citadelle bi-site platform.

Covers:
- JWT migration python-jose -> PyJWT (login Syndicat + Citadelle)
- Invalid token => 401 (not 500)
- Security S1: /api/contacts requires admin
- Citadelle access controls (require_admin, require_citadelle_user)
- Password reset endpoints (refactored helpers) return 200
- Email-triggering endpoints (forgot-password, citadelle contact) return 200
- Contact upload validation S6 (html file -> 400)
- Remember-me feature: 24h vs 30d JWT expiry
"""
import io
import os
import time
import base64
import json
from datetime import datetime, timezone

import jwt as pyjwt
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://achat-vente-assets.preview.emergentagent.com").rstrip("/")

ADMIN_EMAIL = "admin@syndicatducode.fr"
ADMIN_PASSWORD = "AdminSyndicat2025!"
CITADELLE_EMAIL = "becamarnaud@yahoo.fr"
CITADELLE_PASSWORD = "Test1234"


# ---------- Fixtures ----------

@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(api):
    r = api.post(f"{BASE_URL}/api/auth/login",
                 json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data
    return data["access_token"]


@pytest.fixture(scope="session")
def citadelle_token(api):
    r = api.post(f"{BASE_URL}/api/citadelle/auth/login",
                 json={"email": CITADELLE_EMAIL, "password": CITADELLE_PASSWORD})
    assert r.status_code == 200, f"Citadelle login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data
    return data["access_token"]


def _decode_unverified(token):
    """Decode JWT without verifying signature to check claims (exp)."""
    return pyjwt.decode(token, options={"verify_signature": False})


# ---------- JWT migration tests ----------

class TestJwtMigration:
    def test_login_syndicat_returns_token(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200, r.text
        body = r.json()
        assert "access_token" in body and len(body["access_token"]) > 20
        # Token must be parseable (PyJWT standard JWT format)
        claims = _decode_unverified(body["access_token"])
        assert "exp" in claims
        assert "sub" in claims or "user_id" in claims or "email" in claims

    def test_login_citadelle_returns_token(self, api):
        r = api.post(f"{BASE_URL}/api/citadelle/auth/login",
                     json={"email": CITADELLE_EMAIL, "password": CITADELLE_PASSWORD})
        assert r.status_code == 200, r.text
        body = r.json()
        assert "access_token" in body and len(body["access_token"]) > 20
        claims = _decode_unverified(body["access_token"])
        assert "exp" in claims


# ---------- Invalid token handling (must be 401, not 500) ----------

class TestInvalidToken:
    def test_citadelle_me_with_bogus_token_401(self, api):
        h = {"Authorization": "Bearer not-a-real-token"}
        r = requests.get(f"{BASE_URL}/api/citadelle/auth/me", headers=h)
        assert r.status_code == 401, f"Expected 401, got {r.status_code}: {r.text}"

    def test_citadelle_me_no_auth_header(self, api):
        r = requests.get(f"{BASE_URL}/api/citadelle/auth/me")
        assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}"

    def test_citadelle_accept_cgu_with_bogus_token_401(self, api):
        h = {"Authorization": "Bearer total.garbage.token"}
        r = requests.patch(f"{BASE_URL}/api/citadelle/auth/accept-cgu", headers=h)
        assert r.status_code == 401, f"Expected 401, got {r.status_code}: {r.text}"

    def test_citadelle_accept_cgu_no_auth(self, api):
        r = requests.patch(f"{BASE_URL}/api/citadelle/auth/accept-cgu")
        assert r.status_code in (401, 403)


# ---------- Security S1: /api/contacts admin protection ----------

class TestContactsSecurity:
    def test_contacts_without_token_forbidden(self, api):
        r = requests.get(f"{BASE_URL}/api/contacts")
        assert r.status_code in (401, 403), f"Should be protected: got {r.status_code}"

    def test_contacts_with_admin_ok(self, admin_token):
        h = {"Authorization": f"Bearer {admin_token}"}
        r = requests.get(f"{BASE_URL}/api/contacts", headers=h)
        assert r.status_code == 200, f"Expected 200 with admin token, got {r.status_code}: {r.text[:200]}"
        # Response should be a JSON list or object containing contacts
        data = r.json()
        assert isinstance(data, (list, dict))


# ---------- Citadelle access controls (refactor ②) ----------

class TestCitadelleAccessControl:
    def test_admin_services_route_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/citadelle/admin/services")
        assert r.status_code in (401, 403), f"Got {r.status_code}"

    def test_admin_services_route_with_admin_ok(self, admin_token):
        h = {"Authorization": f"Bearer {admin_token}"}
        r = requests.get(f"{BASE_URL}/api/citadelle/admin/services", headers=h)
        assert r.status_code == 200, f"Got {r.status_code}: {r.text[:200]}"

    def test_member_my_orders_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/citadelle/services/my-orders")
        assert r.status_code in (401, 403), f"Got {r.status_code}"


# ---------- Password reset (refactor ①) ----------

class TestPasswordReset:
    def test_syndicat_forgot_password_ok(self, api):
        r = api.post(f"{BASE_URL}/api/auth/forgot-password",
                     json={"email": "nonexistent-anti-regression@example.com"})
        assert r.status_code == 200, f"Got {r.status_code}: {r.text}"

    def test_citadelle_forgot_password_ok(self, api):
        r = api.post(f"{BASE_URL}/api/citadelle/auth/forgot-password",
                     json={"email": "nonexistent-anti-regression@example.com"})
        assert r.status_code == 200, f"Got {r.status_code}: {r.text}"


# ---------- Emails (refactor ③) ----------

class TestEmailEndpoints:
    def test_citadelle_contact_form_ok(self, api):
        payload = {
            "nom": "TEST Anti-Regression",
            "email": "test-anti-regression@example.com",
            "sujet": "Test anti-régression",
            "message": "Ceci est un test automatisé d'anti-régression.",
        }
        r = api.post(f"{BASE_URL}/api/citadelle/contact", json=payload)
        assert r.status_code == 200, f"Got {r.status_code}: {r.text}"


# ---------- Contact upload validation S6 ----------

class TestContactUploadValidation:
    def test_contact_with_html_attachment_rejected(self):
        files = [
            ("files", ("malicious.html", b"<html><script>alert(1)</script></html>", "text/html")),
        ]
        data = {
            "name": "TEST",
            "email": "test-s6@example.com",
            "message": "Test upload validation",
        }
        r = requests.post(f"{BASE_URL}/api/contact", data=data, files=files)
        assert r.status_code == 400, f"Expected 400 for HTML file, got {r.status_code}: {r.text[:300]}"

    def test_contact_without_attachment_ok(self):
        data = {
            "name": "TEST",
            "email": "test-s6-noattach@example.com",
            "message": "Test sans pièce jointe",
        }
        r = requests.post(f"{BASE_URL}/api/contact", data=data)
        assert r.status_code == 200, f"Expected 200 without attachment, got {r.status_code}: {r.text[:300]}"


# ---------- Remember-me feature ----------

class TestRememberMe:
    def _exp_delta_hours(self, token):
        claims = _decode_unverified(token)
        exp = claims["exp"]
        now = int(time.time())
        return (exp - now) / 3600.0

    def test_citadelle_login_remember_false_24h(self, api):
        r = api.post(f"{BASE_URL}/api/citadelle/auth/login",
                     json={"email": CITADELLE_EMAIL, "password": CITADELLE_PASSWORD,
                           "remember_me": False})
        assert r.status_code == 200, r.text
        token = r.json()["access_token"]
        hours = self._exp_delta_hours(token)
        # ~24h, allow 22-26h to account for skew
        assert 22 <= hours <= 26, f"Expected ~24h, got {hours}h"

    def test_citadelle_login_remember_true_30d(self, api):
        r = api.post(f"{BASE_URL}/api/citadelle/auth/login",
                     json={"email": CITADELLE_EMAIL, "password": CITADELLE_PASSWORD,
                           "remember_me": True})
        assert r.status_code == 200, r.text
        token = r.json()["access_token"]
        hours = self._exp_delta_hours(token)
        # ~30 days = 720h
        assert 24 * 28 <= hours <= 24 * 32, f"Expected ~30 days, got {hours}h"

    def test_syndicat_login_remember_false_24h(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD,
                           "remember_me": False})
        assert r.status_code == 200, r.text
        token = r.json()["access_token"]
        hours = self._exp_delta_hours(token)
        assert 22 <= hours <= 26, f"Expected ~24h, got {hours}h"

    def test_syndicat_login_remember_true_30d(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD,
                           "remember_me": True})
        assert r.status_code == 200, r.text
        token = r.json()["access_token"]
        hours = self._exp_delta_hours(token)
        assert 24 * 28 <= hours <= 24 * 32, f"Expected ~30 days, got {hours}h"
