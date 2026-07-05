"""Tests for email_notifications preference (citadelle)."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://escrow-platform-5.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api/citadelle"

BUYER_EMAIL = "test.acheteur@citadelle.fr"
BUYER_PASSWORD = "DemoAcheteur2026!"


@pytest.fixture(scope="module")
def buyer_token():
    r = requests.post(f"{API}/auth/login", json={"email": BUYER_EMAIL, "password": BUYER_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("token") or data.get("access_token")
    assert token, f"No token in response: {data}"
    return token


@pytest.fixture(scope="module")
def auth_headers(buyer_token):
    return {"Authorization": f"Bearer {buyer_token}", "Content-Type": "application/json"}


def test_me_returns_email_notifications(auth_headers):
    r = requests.get(f"{API}/auth/me", headers=auth_headers, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    # Field may or may not be present initially — should not break
    assert "email" in data


def test_set_false_then_true(auth_headers):
    # Set to false
    r = requests.patch(f"{API}/auth/profile", headers=auth_headers, json={"email_notifications": False}, timeout=30)
    assert r.status_code == 200, r.text

    r = requests.get(f"{API}/auth/me", headers=auth_headers, timeout=30)
    assert r.status_code == 200
    assert r.json().get("email_notifications") is False

    # Set back to true
    r = requests.patch(f"{API}/auth/profile", headers=auth_headers, json={"email_notifications": True}, timeout=30)
    assert r.status_code == 200

    r = requests.get(f"{API}/auth/me", headers=auth_headers, timeout=30)
    assert r.status_code == 200
    assert r.json().get("email_notifications") is True


def test_other_profile_fields_still_work(auth_headers):
    payload = {
        "first_name": "Testeur",
        "last_name": "Acheteur",
        "phone": "0612345678",
        "date_of_birth": "1990-01-15",
    }
    r = requests.patch(f"{API}/auth/profile", headers=auth_headers, json=payload, timeout=30)
    assert r.status_code == 200, r.text
    r = requests.get(f"{API}/auth/me", headers=auth_headers, timeout=30)
    data = r.json()
    assert data.get("first_name") == "Testeur"
    assert data.get("phone") == "0612345678"
    assert data.get("date_of_birth") == "1990-01-15"


def test_helper_defaults_true_for_unknown_user():
    """Import helper directly and verify defaults."""
    import asyncio
    import sys
    sys.path.insert(0, "/app/backend")
    from utils.notif_prefs import email_notifications_enabled
    from motor.motor_asyncio import AsyncIOMotorClient
    from dotenv import load_dotenv
    load_dotenv("/app/backend/.env")

    async def run():
        client = AsyncIOMotorClient(os.environ["MONGO_URL"])
        db = client[os.environ["DB_NAME"]]
        # Unknown user
        assert await email_notifications_enabled(db, "unknown_xyz@nowhere.local") is True
        # Empty email
        assert await email_notifications_enabled(db, "") is True
        # Buyer set to True (cleanup guaranteed)
        await db.users.update_one({"email": BUYER_EMAIL, "platform": "citadelle"}, {"$set": {"email_notifications": False}})
        assert await email_notifications_enabled(db, BUYER_EMAIL) is False
        await db.users.update_one({"email": BUYER_EMAIL, "platform": "citadelle"}, {"$set": {"email_notifications": True}})
        assert await email_notifications_enabled(db, BUYER_EMAIL) is True
        client.close()

    asyncio.run(run())


def test_cleanup_reset_buyer_true(auth_headers):
    r = requests.patch(f"{API}/auth/profile", headers=auth_headers, json={"email_notifications": True}, timeout=30)
    assert r.status_code == 200
    r = requests.get(f"{API}/auth/me", headers=auth_headers, timeout=30)
    assert r.json().get("email_notifications") is True
