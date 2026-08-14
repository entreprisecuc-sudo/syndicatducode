"""
Tests for GET /api/citadelle/member/activity
Feature: Panneau "À traiter" - vue directe des interactions membre Citadelle
"""
import os
import pytest
import requests
from datetime import datetime, timezone
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://syndicat-code-hub.preview.emergentagent.com").rstrip("/")
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")

MEMBER_EMAIL = "marie.testui@citadelle-test.fr"
MEMBER_PASSWORD = "TestUI2026!"
MEMBER_ID = "26c042ac-fbdc-471e-b791-edd15325de7e"

client = MongoClient(MONGO_URL)
db = client[DB_NAME]


@pytest.fixture(scope="module")
def member_token():
    r = requests.post(f"{BASE_URL}/api/citadelle/auth/login",
                      json={"email": MEMBER_EMAIL, "password": MEMBER_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def headers(member_token):
    return {"Authorization": f"Bearer {member_token}"}


@pytest.fixture(autouse=True)
def cleanup_test_docs():
    """Cleanup any TESTACT_ documents before and after each test"""
    db.citadelle_conversations.delete_many({"id": {"$regex": "^TESTACT_"}})
    db.citadelle_transactions.delete_many({"id": {"$regex": "^TESTACT_"}})
    yield
    db.citadelle_conversations.delete_many({"id": {"$regex": "^TESTACT_"}})
    db.citadelle_transactions.delete_many({"id": {"$regex": "^TESTACT_"}})


# ── Security ─────────────────────────────────────────────────────────────────

class TestSecurity:
    def test_no_token_rejected(self):
        r = requests.get(f"{BASE_URL}/api/citadelle/member/activity")
        assert r.status_code in (401, 403)

    def test_invalid_token_rejected(self):
        r = requests.get(f"{BASE_URL}/api/citadelle/member/activity",
                         headers={"Authorization": "Bearer invalid.token.here"})
        assert r.status_code in (401, 403)


# ── Empty state ──────────────────────────────────────────────────────────────

class TestEmpty:
    def test_no_interactions_returns_empty(self, headers):
        r = requests.get(f"{BASE_URL}/api/citadelle/member/activity", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert "items" in data and "count" in data
        assert isinstance(data["items"], list)
        # Note: marie.testui may have real data; we only assert structure.
        assert data["count"] == len(data["items"])


# ── Scenarios ────────────────────────────────────────────────────────────────

def _now():
    return datetime.now(timezone.utc).isoformat()


class TestMessageScenario:
    def test_unread_message_appears(self, headers):
        now = _now()
        conv = {
            "id": "TESTACT_conv1",
            "listing_id": "TESTACT_listing1",
            "listing_title": "Site TESTACT à vendre",
            "buyer_id": MEMBER_ID,
            "buyer_email": MEMBER_EMAIL,
            "seller_id": "other-seller-id",
            "seller_email": "seller@test.fr",
            "messages": [{
                "id": "msg1",
                "sender_id": "other-seller-id",
                "sender_email": "seller@test.fr",
                "content": "Bonjour, je réponds à votre message concernant l'annonce.",
                "sent_at": now,
            }],
            "last_read": {},
            "created_at": now,
            "updated_at": now,
        }
        db.citadelle_conversations.insert_one(conv)

        r = requests.get(f"{BASE_URL}/api/citadelle/member/activity", headers=headers)
        assert r.status_code == 200
        items = r.json()["items"]
        msg_items = [i for i in items if i["type"] == "message" and i.get("title") == "Site TESTACT à vendre"]
        assert len(msg_items) == 1
        item = msg_items[0]
        assert item["route"] == "/citadelle/espace-membre/messages/TESTACT_conv1"
        assert "Bonjour" in item["preview"]
        assert item["count"] == 1

    def test_read_message_disappears(self, headers):
        now = _now()
        conv = {
            "id": "TESTACT_conv2",
            "listing_id": "TESTACT_listing2",
            "listing_title": "Site TESTACT read",
            "buyer_id": MEMBER_ID,
            "seller_id": "other-seller-id",
            "messages": [{
                "id": "msg1",
                "sender_id": "other-seller-id",
                "content": "Message déjà lu",
                "sent_at": "2020-01-01T00:00:00+00:00",
            }],
            "last_read": {MEMBER_ID: now},
            "created_at": now,
            "updated_at": now,
        }
        db.citadelle_conversations.insert_one(conv)
        r = requests.get(f"{BASE_URL}/api/citadelle/member/activity", headers=headers)
        items = r.json()["items"]
        assert not any(i.get("title") == "Site TESTACT read" for i in items)


class TestTransactionScenarios:
    def _insert_tx(self, tx_id, **overrides):
        now = _now()
        base = {
            "id": tx_id,
            "listing_id": "TESTACT_listing",
            "listing_title": f"TX {tx_id}",
            "buyer_id": "other-buyer",
            "seller_id": MEMBER_ID,
            "offer_amount": 1000,
            "status": "offer_sent",
            "created_at": now,
            "updated_at": now,
        }
        base.update(overrides)
        db.citadelle_transactions.insert_one(base)

    def test_offer_received_as_seller(self, headers):
        self._insert_tx("TESTACT_tx_offer", status="offer_sent", offer_amount=1500,
                        seller_id=MEMBER_ID, buyer_id="other")
        r = requests.get(f"{BASE_URL}/api/citadelle/member/activity", headers=headers)
        items = r.json()["items"]
        matched = [i for i in items if i["type"] == "offer" and i.get("title") == "TX TESTACT_tx_offer"]
        assert len(matched) == 1
        assert matched[0]["level"] == "urgent"
        assert "1500" in matched[0]["preview"]
        assert matched[0]["route"] == "/citadelle/espace-membre/transactions/TESTACT_tx_offer"

    def test_counter_offer_as_buyer(self, headers):
        self._insert_tx("TESTACT_tx_counter", status="offer_sent", offer_amount=1000,
                        counter_amount=800, buyer_id=MEMBER_ID, seller_id="other")
        r = requests.get(f"{BASE_URL}/api/citadelle/member/activity", headers=headers)
        items = r.json()["items"]
        matched = [i for i in items if i["type"] == "offer" and i.get("title") == "TX TESTACT_tx_counter"]
        assert len(matched) == 1
        assert matched[0]["level"] == "warning"
        assert "800" in matched[0]["preview"]

    def test_payment_needed_as_buyer(self, headers):
        self._insert_tx("TESTACT_tx_pay", status="offer_accepted",
                        buyer_id=MEMBER_ID, seller_id="other")
        r = requests.get(f"{BASE_URL}/api/citadelle/member/activity", headers=headers)
        items = r.json()["items"]
        matched = [i for i in items if i["type"] == "payment" and i.get("title") == "TX TESTACT_tx_pay"]
        assert len(matched) == 1
        assert matched[0]["level"] == "urgent"
        assert "paiement" in matched[0]["preview"].lower()

    def test_delivery_needed_as_seller(self, headers):
        self._insert_tx("TESTACT_tx_del", status="offer_accepted",
                        payment_id="pay_TESTACT", credentials_transmitted=False,
                        seller_id=MEMBER_ID, buyer_id="other")
        r = requests.get(f"{BASE_URL}/api/citadelle/member/activity", headers=headers)
        items = r.json()["items"]
        matched = [i for i in items if i["type"] == "delivery" and i.get("title") == "TX TESTACT_tx_del"]
        assert len(matched) == 1
        assert "accès" in matched[0]["preview"].lower() or "acces" in matched[0]["preview"].lower()

    def test_dispute(self, headers):
        self._insert_tx("TESTACT_tx_disp", status="disputed",
                        buyer_id=MEMBER_ID, seller_id="other")
        r = requests.get(f"{BASE_URL}/api/citadelle/member/activity", headers=headers)
        items = r.json()["items"]
        matched = [i for i in items if i["type"] == "dispute" and i.get("title") == "TX TESTACT_tx_disp"]
        assert len(matched) == 1
        assert matched[0]["level"] == "urgent"


class TestSorting:
    def test_items_sorted_desc(self, headers):
        # Insert an old and a new tx
        db.citadelle_transactions.insert_one({
            "id": "TESTACT_old", "listing_title": "Old TX",
            "seller_id": MEMBER_ID, "buyer_id": "o", "offer_amount": 100,
            "status": "offer_sent",
            "created_at": "2020-01-01T00:00:00+00:00",
            "updated_at": "2020-01-01T00:00:00+00:00",
        })
        db.citadelle_transactions.insert_one({
            "id": "TESTACT_new", "listing_title": "New TX",
            "seller_id": MEMBER_ID, "buyer_id": "o", "offer_amount": 200,
            "status": "offer_sent",
            "created_at": _now(),
            "updated_at": _now(),
        })
        r = requests.get(f"{BASE_URL}/api/citadelle/member/activity", headers=headers)
        items = r.json()["items"]
        titles = [i["title"] for i in items if i["title"] in ("Old TX", "New TX")]
        assert titles.index("New TX") < titles.index("Old TX")
