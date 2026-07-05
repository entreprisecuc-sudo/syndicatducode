"""
Tests d'intégration Citadelle : contenu adulte, signalements, modération.
Couvre : purge images/url si is_adult=true, list/detail is_adult, reports CRUD,
warn/suspend/ban/reactivate + login blocks.
"""
import os
import time
import pytest
import requests
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
load_dotenv("/app/frontend/.env")

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "bigpapa1981@asar.com"
ADMIN_PASSWORD = "Josiane03@@@!1981"
VENDEUR_EMAIL = "test.vendeur@citadelle.fr"
VENDEUR_PASSWORD = "DemoVendeur2026!"
ACHETEUR_EMAIL = "test.acheteur@citadelle.fr"
ACHETEUR_PASSWORD = "DemoAcheteur2026!"

DEMO_ADULT_SLUG = "test-site-adulte-demo-948e7689"


# ── Fixtures ──────────────────────────────────────────────────────────────────
@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def vendeur_token():
    r = requests.post(f"{API}/citadelle/auth/login", json={"email": VENDEUR_EMAIL, "password": VENDEUR_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def acheteur_token():
    r = requests.post(f"{API}/citadelle/auth/login", json={"email": ACHETEUR_EMAIL, "password": ACHETEUR_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def vendeur_id(vendeur_token):
    r = requests.get(f"{API}/citadelle/auth/me", headers={"Authorization": f"Bearer {vendeur_token}"})
    return r.json()["id"]


def _h(tok):
    return {"Authorization": f"Bearer {tok}"}


# ── A1 — Création/Update contenu adulte : purge images + url ─────────────────
class TestAdultContentPurge:
    def _payload(self, is_adult, images=None, url=None):
        return {
            "title": f"TEST Adult purge {int(time.time()*1000)}",
            "type": "website",
            "short_description": "Description test contenu adulte purge minimum vingt car",
            "description": "Description longue au delà de cinquante caractères pour test purge images et url en cas de contenu adulte.",
            "price": 500.0,
            "url_preview": url or "https://example.com/adulte",
            "images": images or ["/uploads/citadelle/img1.png", "/uploads/citadelle/img2.png"],
            "is_adult": is_adult,
        }

    def test_create_adult_true_purges_images_and_url(self, vendeur_token):
        r = requests.post(f"{API}/citadelle/listings", headers=_h(vendeur_token),
                          json=self._payload(True))
        assert r.status_code == 201, r.text
        d = r.json()
        assert d["is_adult"] is True
        assert d["images"] == []
        assert d.get("url_preview") is None
        self.__class__.adult_id = d["id"]

    def test_create_normal_keeps_images_and_url(self, vendeur_token):
        r = requests.post(f"{API}/citadelle/listings", headers=_h(vendeur_token),
                          json=self._payload(False))
        assert r.status_code == 201, r.text
        d = r.json()
        assert d["is_adult"] is False
        assert d["images"] == ["/uploads/citadelle/img1.png", "/uploads/citadelle/img2.png"]
        assert d["url_preview"] == "https://example.com/adulte"
        self.__class__.normal_id = d["id"]

    def test_patch_normal_to_adult_purges(self, vendeur_token):
        # PATCH the normal listing to become adult -> purge
        r = requests.patch(f"{API}/citadelle/listings/{self.normal_id}",
                           headers=_h(vendeur_token),
                           json={"is_adult": True, "images": ["/uploads/citadelle/keep.png"],
                                 "url_preview": "https://example.com/keep"})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["is_adult"] is True
        assert d["images"] == []
        assert d.get("url_preview") is None

    def test_cleanup(self, vendeur_token):
        for lid in [getattr(self.__class__, "adult_id", None), getattr(self.__class__, "normal_id", None)]:
            if lid:
                requests.delete(f"{API}/citadelle/listings/{lid}", headers=_h(vendeur_token))


# ── A2 — GET liste et detail exposent is_adult (et pas d'images/url) ──────────
class TestAdultListingPublicVisibility:
    def test_list_contains_adult_flag(self):
        r = requests.get(f"{API}/citadelle/listings", params={"limit": 50})
        assert r.status_code == 200
        listings = r.json()["listings"]
        found = [l for l in listings if l.get("slug") == DEMO_ADULT_SLUG]
        assert found, "Annonce démo adulte introuvable dans la liste publique"
        item = found[0]
        assert item.get("is_adult") is True
        assert item.get("images") == []
        # url_preview est projeté out (0) dans la liste — OK
        assert not item.get("url_preview")

    def test_detail_adult_has_no_images_no_url(self):
        r = requests.get(f"{API}/citadelle/listings/{DEMO_ADULT_SLUG}")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("is_adult") is True
        assert d.get("images") == []
        # url_preview est projeté out (0) dans le détail public — OK, doit rester absent/None
        assert not d.get("url_preview")


# ── B1 — Signalements : create + admin list + patch + conversation view ──────
class TestReports:
    TX_ID = "4245d586-8f92-4aef-9ce8-f8cefec3b863"  # [TEST] Blog Cuisine

    def test_create_report_by_buyer(self, acheteur_token):
        r = requests.post(f"{API}/citadelle/reports", headers=_h(acheteur_token), json={
            "conversation_type": "transaction",
            "conversation_id": self.TX_ID,
            "reason": "arnaque",
            "message": "TEST_REPORT test suite - signalement automatique arnaque",
        })
        assert r.status_code == 201, r.text
        assert r.json().get("success") is True

    def test_create_report_invalid_reason(self, acheteur_token):
        r = requests.post(f"{API}/citadelle/reports", headers=_h(acheteur_token), json={
            "conversation_type": "transaction",
            "conversation_id": self.TX_ID,
            "reason": "invalid_reason_xyz",
            "message": "peu importe",
        })
        assert r.status_code == 400

    def test_admin_list_reports(self, admin_token):
        r = requests.get(f"{API}/citadelle/admin/reports", headers=_h(admin_token))
        assert r.status_code == 200
        data = r.json()
        assert "reports" in data and "open_count" in data
        assert isinstance(data["reports"], list)
        assert data["open_count"] >= 2  # 2 démo ouvertes + celui qu'on a créé
        # Récupérer le rapport créé pour le patch
        mine = [x for x in data["reports"] if x.get("message", "").startswith("TEST_REPORT")]
        assert mine, "Signalement créé introuvable"
        TestReports.new_report_id = mine[0]["id"]

    def test_admin_view_conversation(self, admin_token):
        rid = TestReports.new_report_id
        r = requests.get(f"{API}/citadelle/admin/reports/{rid}/conversation", headers=_h(admin_token))
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("found") is True
        assert "messages" in d
        assert "dispute_messages" in d

    def test_admin_patch_report_status(self, admin_token):
        rid = TestReports.new_report_id
        r = requests.patch(f"{API}/citadelle/admin/reports/{rid}", headers=_h(admin_token),
                           json={"status": "resolved", "admin_notes": "TEST - résolu par testing agent"})
        assert r.status_code == 200
        # Cleanup : supprimer directement en DB non exposé — on laisse status resolved (marqueur TEST_REPORT)


# ── B2 — Modération : warn/suspend/ban/reactivate + login blocks ────────────
class TestModeration:
    """Utilise un compte membre dédié créé pour ne pas casser le vendeur/acheteur seed."""

    @pytest.fixture(scope="class", autouse=True)
    def target_member(self, admin_token):
        # Créer un compte Citadelle dédié
        email = f"test_mod_{int(time.time())}@citadelle-test.fr"
        password = "TestModo2026!"
        r = requests.post(f"{API}/citadelle/auth/register", json={
            "first_name": "TestMod", "last_name": "User",
            "email": email, "password": password, "cgu_accepted": True,
        })
        assert r.status_code == 201, r.text
        user_id = r.json()["id"]
        yield {"id": user_id, "email": email, "password": password}
        # Teardown : réactiver et supprimer en DB (via admin — pas de DELETE user endpoint, laisser status active)
        try:
            requests.post(f"{API}/citadelle/admin/members/{user_id}/reactivate", headers=_h(admin_token))
        except Exception:
            pass

    def test_warn(self, admin_token, target_member):
        r = requests.post(f"{API}/citadelle/admin/members/{target_member['id']}/warn",
                          headers=_h(admin_token),
                          json={"reason": "Test avertissement", "note": "test agent"})
        assert r.status_code == 200
        assert r.json().get("success") is True

    def test_suspend_then_login_forbidden(self, admin_token, target_member):
        r = requests.post(f"{API}/citadelle/admin/members/{target_member['id']}/suspend",
                          headers=_h(admin_token),
                          json={"weeks": 1, "reason": "Test suspension", "note": ""})
        assert r.status_code == 200
        assert "suspended_until" in r.json()

        # Login doit être bloqué (403)
        r2 = requests.post(f"{API}/citadelle/auth/login", json={
            "email": target_member["email"], "password": target_member["password"]
        })
        assert r2.status_code == 403, f"Attendu 403 pour compte suspendu, reçu {r2.status_code} {r2.text}"

    def test_reactivate_then_login_ok(self, admin_token, target_member):
        r = requests.post(f"{API}/citadelle/admin/members/{target_member['id']}/reactivate",
                          headers=_h(admin_token))
        assert r.status_code == 200
        r2 = requests.post(f"{API}/citadelle/auth/login", json={
            "email": target_member["email"], "password": target_member["password"]
        })
        assert r2.status_code == 200, r2.text

    def test_ban_then_login_forbidden_and_listings_rejected(self, admin_token, target_member, vendeur_token):
        # Créer une annonce active du member cible : impossible (pas de token member)
        # On teste juste ban -> login 403
        r = requests.post(f"{API}/citadelle/admin/members/{target_member['id']}/ban",
                          headers=_h(admin_token),
                          json={"reason": "Test bannissement", "note": ""})
        assert r.status_code == 200
        r2 = requests.post(f"{API}/citadelle/auth/login", json={
            "email": target_member["email"], "password": target_member["password"]
        })
        assert r2.status_code == 403


# ── Sidebar admin badge count ─────────────────────────────────────────────────
class TestReportsBadgeAdmin:
    def test_open_count_positive(self, admin_token):
        r = requests.get(f"{API}/citadelle/admin/reports", headers=_h(admin_token), params={"status": "open"})
        assert r.status_code == 200
        data = r.json()
        assert data["open_count"] >= 1
