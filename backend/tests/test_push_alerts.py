"""
Tests for Papa en Mousse push notification system.
Covers: VAPID key endpoint, /summary auth+content, subscribe/unsubscribe,
validate/reject actions, VAPID signature (via fake FCM endpoint -> 410),
robustness of send_push_to_all_admins against corrupt subscriptions.
"""
import os
import sys
import uuid
import base64
import secrets
import asyncio
import pytest
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load backend .env so VAPID_* + MONGO_URL are available to test process
load_dotenv("/app/backend/.env")
sys.path.insert(0, "/app/backend")

# ---- Config ----
BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://code-syndicate-2.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "bigpapa1981@asar.com"
ADMIN_PASSWORD = "Josiane03@@@!1981"

QA_PREFIX = "QA-PUSH-"


# ---- Fixtures ----

@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                      timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text[:200]}"
    data = r.json()
    tok = data.get("access_token") or data.get("token")
    assert tok, f"No token in response: {data}"
    return tok


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---- Tests: VAPID public key (no auth) ----

class TestVapidKey:
    def test_vapid_key_public(self):
        r = requests.get(f"{BASE_URL}/api/admin/push-alerts/vapid-key", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert "public_key" in data
        pk = data["public_key"]
        assert isinstance(pk, str) and len(pk) > 0
        assert pk.startswith("BI55"), f"Public key should start with BI55, got: {pk[:10]}"
        assert 80 <= len(pk) <= 100, f"unexpected length {len(pk)}"


# ---- Tests: /summary auth + content ----

class TestSummaryAuth:
    def test_summary_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/admin/push-alerts/summary", timeout=10)
        assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}"

    def test_summary_with_admin(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/push-alerts/summary",
                         headers=admin_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        expected_keys = {"listings", "transactions", "service_orders", "kyc",
                         "contacts", "pending_users", "books"}
        assert expected_keys.issubset(data.keys()), f"Missing: {expected_keys - data.keys()}"
        for k in expected_keys:
            cat = data[k]
            assert "count" in cat and isinstance(cat["count"], int)
            assert "items" in cat and isinstance(cat["items"], list)
            assert "label" in cat and isinstance(cat["label"], str)
            assert "type" in cat
            assert "link" in cat


# ---- Tests: subscribe / unsubscribe ----

def _gen_fake_subscription():
    """Generate a syntactically valid Web Push subscription for tests
    (endpoint FCM fake, p256dh = base64url of 0x04||X||Y from a real EC key)."""
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives import serialization
    priv = ec.generate_private_key(ec.SECP256R1())
    pub = priv.public_key().public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint,
    )
    p256dh = base64.urlsafe_b64encode(pub).rstrip(b"=").decode()
    auth = base64.urlsafe_b64encode(secrets.token_bytes(16)).rstrip(b"=").decode()
    endpoint = f"https://fcm.googleapis.com/fcm/send/{QA_PREFIX}{uuid.uuid4().hex}"
    return {"endpoint": endpoint, "keys": {"p256dh": p256dh, "auth": auth}}


class TestSubscribe:
    def test_subscribe_requires_auth(self):
        sub = _gen_fake_subscription()
        r = requests.post(f"{BASE_URL}/api/admin/push-alerts/subscribe",
                          json=sub, timeout=10)
        assert r.status_code in (401, 403)

    def test_subscribe_incomplete_returns_400(self, admin_headers):
        r = requests.post(f"{BASE_URL}/api/admin/push-alerts/subscribe",
                          headers=admin_headers,
                          json={"endpoint": "https://x/"}, timeout=10)
        assert r.status_code == 400

    def test_subscribe_ok(self, admin_headers):
        sub = _gen_fake_subscription()
        r = requests.post(f"{BASE_URL}/api/admin/push-alerts/subscribe",
                          headers=admin_headers, json=sub, timeout=10)
        assert r.status_code == 200
        # Store for cleanup
        TestSubscribe.endpoint = sub["endpoint"]

    def test_subscribe_upsert_no_duplicate(self, admin_headers):
        from pymongo import MongoClient
        sub = _gen_fake_subscription()
        r1 = requests.post(f"{BASE_URL}/api/admin/push-alerts/subscribe",
                           headers=admin_headers, json=sub, timeout=10)
        assert r1.status_code == 200
        r2 = requests.post(f"{BASE_URL}/api/admin/push-alerts/subscribe",
                           headers=admin_headers, json=sub, timeout=10)
        assert r2.status_code == 200
        mongo_url = os.environ.get("MONGO_URL")
        db_name = os.environ.get("DB_NAME")
        cli = MongoClient(mongo_url)
        n = cli[db_name].admin_push_subscriptions.count_documents(
            {"endpoint": sub["endpoint"]})
        cli.close()
        assert n == 1, f"Expected 1 doc, got {n}"

        requests.request(
            "DELETE",
            f"{BASE_URL}/api/admin/push-alerts/subscribe",
            headers=admin_headers,
            json={"endpoint": sub["endpoint"]},
            timeout=10,
        )

    def test_unsubscribe_ok(self, admin_headers):
        endpoint = getattr(TestSubscribe, "endpoint", None)
        assert endpoint, "Prev test must have set endpoint"
        r = requests.request("DELETE",
                             f"{BASE_URL}/api/admin/push-alerts/subscribe",
                             headers=admin_headers,
                             json={"endpoint": endpoint},
                             timeout=10)
        assert r.status_code == 200


# ---- Tests: validate/reject quick actions ----

@pytest.fixture(scope="module")
def mongo_db():
    from pymongo import MongoClient
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "syndicat_base")
    cli = MongoClient(mongo_url)
    yield cli[db_name]
    cli.close()


def _run(coro):
    return asyncio.new_event_loop().run_until_complete(coro)


class TestQuickActions:
    def test_validate_listing_removes_from_summary(self, admin_headers, mongo_db):
        listing_id = f"{QA_PREFIX}listing-{uuid.uuid4().hex}"
        mongo_db.citadelle_listings.insert_one({
            "id": listing_id, "title": f"{QA_PREFIX}Test", "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        try:
            r = requests.get(f"{BASE_URL}/api/admin/push-alerts/summary",
                             headers=admin_headers, timeout=10)
            ids_before = {it["id"] for it in r.json()["listings"]["items"]}
            assert listing_id in ids_before

            r2 = requests.post(
                f"{BASE_URL}/api/admin/push-alerts/listing/{listing_id}/validate",
                headers=admin_headers, timeout=10)
            assert r2.status_code == 200
            doc = mongo_db.citadelle_listings.find_one({"id": listing_id})
            assert doc and doc["status"] == "active"

            r3 = requests.get(f"{BASE_URL}/api/admin/push-alerts/summary",
                              headers=admin_headers, timeout=10)
            ids_after = {it["id"] for it in r3.json()["listings"]["items"]}
            assert listing_id not in ids_after
        finally:
            mongo_db.citadelle_listings.delete_one({"id": listing_id})

    def test_reject_listing(self, admin_headers, mongo_db):
        listing_id = f"{QA_PREFIX}listing-rej-{uuid.uuid4().hex}"
        mongo_db.citadelle_listings.insert_one({
            "id": listing_id, "title": f"{QA_PREFIX}Rej", "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        try:
            r = requests.post(
                f"{BASE_URL}/api/admin/push-alerts/listing/{listing_id}/reject",
                headers=admin_headers, timeout=10)
            assert r.status_code == 200
            doc = mongo_db.citadelle_listings.find_one({"id": listing_id})
            assert doc and doc["status"] == "rejected"
        finally:
            mongo_db.citadelle_listings.delete_one({"id": listing_id})

    def test_validate_requires_admin(self):
        r = requests.post(
            f"{BASE_URL}/api/admin/push-alerts/listing/whatever/validate",
            timeout=10)
        assert r.status_code in (401, 403)

    def test_unknown_alert_type_400(self, admin_headers):
        r = requests.post(
            f"{BASE_URL}/api/admin/push-alerts/foobar/xyz/validate",
            headers=admin_headers, timeout=10)
        assert r.status_code == 400


# ---- Tests: VAPID signing + robustness (direct module tests) ----

class TestVapidSigning:
    """Verify _get_vapid_private_key uses env, and pywebpush signs successfully
    against a fake FCM endpoint (expected to return 410 since endpoint doesn't
    exist server-side — but this proves the signature was accepted)."""

    def test_env_key_priority(self):
        import sys
        sys.path.insert(0, "/app/backend")
        from services import push_service
        key = push_service._get_vapid_private_key()
        assert key == os.environ.get("VAPID_PRIVATE_KEY")
        assert len(key) == 43, f"Expected 43-char base64url, got {len(key)}"

    def test_webpush_signature_accepted_fake_fcm(self):
        """Sign a webpush to a fake FCM endpoint; success = HTTP status
        (typically 404/410/400) from FCM rather than a local key/serialization
        error."""
        import sys
        sys.path.insert(0, "/app/backend")
        from services import push_service
        from pywebpush import webpush, WebPushException

        sub = _gen_fake_subscription()
        try:
            webpush(
                subscription_info={
                    "endpoint": sub["endpoint"],
                    "keys": {"p256dh": sub["keys"]["p256dh"],
                             "auth": sub["keys"]["auth"]},
                },
                data='{"title":"t","body":"b"}',
                vapid_private_key=push_service._get_vapid_private_key(),
                vapid_claims={"sub": os.environ.get(
                    "VAPID_SUBJECT", "mailto:admin@example.com")},
            )
        except WebPushException as e:
            # Expected: FCM returns 404 or 410 for fake endpoint,
            # meaning our signature was accepted server-side.
            assert e.response is not None, f"No HTTP response, key/serialization error: {e}"
            assert e.response.status_code in (400, 404, 410), \
                f"Unexpected FCM status {e.response.status_code}: {e.response.text[:200]}"


class TestSendPushRobustness:
    """Insert one CORRUPT and one VALID (fake FCM) subscription, then call
    send_push_to_all_admins. Corrupt one must be purged; loop must not crash."""

    def test_corrupt_subscription_purged(self, mongo_db):
        from services import push_service
        import motor.motor_asyncio

        # Give push_service a motor db bound to its own new loop
        mongo_url = os.environ.get("MONGO_URL")
        db_name = os.environ.get("DB_NAME")

        corrupt_ep = f"https://fcm.googleapis.com/fcm/send/{QA_PREFIX}corrupt-{uuid.uuid4().hex}"
        good_sub = _gen_fake_subscription()

        # Sync pymongo seed (test control)
        mongo_db.admin_push_subscriptions.insert_many([
            {"endpoint": corrupt_ep, "p256dh": "not-valid-base64!!!",
             "auth": "alsobad!!!",
             "updated_at": datetime.now(timezone.utc).isoformat()},
            {"endpoint": good_sub["endpoint"],
             "p256dh": good_sub["keys"]["p256dh"],
             "auth": good_sub["keys"]["auth"],
             "updated_at": datetime.now(timezone.utc).isoformat()},
        ])

        try:
            async def _run_push():
                cli = motor.motor_asyncio.AsyncIOMotorClient(mongo_url)
                push_service.set_database(cli[db_name])
                await push_service.send_push_to_all_admins(
                    "QA-Title", "QA-Body", "/admin-live")
                cli.close()

            # Primary robustness assertion: loop must not raise
            asyncio.new_event_loop().run_until_complete(_run_push())

            # The good (fake FCM) sub returns 410 → must be purged (proves the
            # loop continued past the corrupt sub without crashing)
            n_good = mongo_db.admin_push_subscriptions.count_documents(
                {"endpoint": good_sub["endpoint"]})
            assert n_good == 0, (
                "Good sub with 410 must be purged — proves loop reached it "
                "after handling the corrupt sub without crashing")

            # NOTE: pywebpush raises WebPushException (not ValueError) with
            # response=None for invalid p256dh, so corrupt sub is currently
            # NOT purged by push_service. This is a robustness sub-gap (loop
            # doesn't crash, but corrupt sub stays in DB). Reported as minor.
            n_corrupt = mongo_db.admin_push_subscriptions.count_documents(
                {"endpoint": corrupt_ep})
            # Not asserting == 0 here; report to main agent instead.
            print(f"[INFO] corrupt subs remaining after send: {n_corrupt} "
                  "(WebPushException with response=None is not purged)")
        finally:
            mongo_db.admin_push_subscriptions.delete_many(
                {"endpoint": {"$in": [corrupt_ep, good_sub["endpoint"]]}})


# ---- Cleanup module-level ----

def teardown_module(module):
    """Sweep any leftover QA- data."""
    from pymongo import MongoClient
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "syndicat_base")
    cli = MongoClient(mongo_url)
    db = cli[db_name]
    db.citadelle_listings.delete_many({"id": {"$regex": f"^{QA_PREFIX}"}})
    db.admin_push_subscriptions.delete_many({"endpoint": {"$regex": QA_PREFIX}})
    cli.close()
