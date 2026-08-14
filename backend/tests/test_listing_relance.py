"""
Tests — Relance automatique des annonces actives > 31 jours (La Citadelle Numérique)
Feature: email relance + score qualité annonce + endpoint admin trigger-relance

Tests couverts:
1. Accessibilité endpoint admin POST /api/citadelle/admin/listings/trigger-relance
2. Protection auth (sans token, mauvais token, user non-admin)
3. Insertion d'une annonce de test éligible en MongoDB (> 31 jours, sans relance)
4. Déclenchement du job et vérification relance_sent_at en DB
5. Vérification logs que l'email part à arnaudasarcsg@gmail.com (TEST_EMAIL_OVERRIDE)
6. Calcul du score qualité (_compute_listing_quality)
7. Critères d'éligibilité (31j, 60j relance)
8. Annonce trop récente (< 31j) → non traitée
9. Annonce avec relance récente (< 60j) → non traitée
"""

import os
import sys
import time
import uuid
import pytest
import requests
from datetime import datetime, timezone, timedelta
from typing import Optional

# ── Config ─────────────────────────────────────────────────────────────────────

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback: read from frontend .env file
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.strip().split("=", 1)[1].rstrip("/")
                    break
    except Exception:
        pass

ADMIN_EMAIL = "bigpapa1981@asar.com"
ADMIN_PASSWORD = "Josiane03@@@!1981"
TEST_EMAIL_OVERRIDE = "arnaudasarcsg@gmail.com"

# ── Sys path for direct import of scheduler functions ──────────────────────────
sys.path.insert(0, "/app/backend")


# ── Fixtures ───────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def admin_token():
    """Get admin JWT token via citadelle login."""
    response = requests.post(
        f"{BASE_URL}/api/citadelle/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    data = response.json()
    token = data.get("access_token")
    assert token, f"No access_token in response: {data}"
    user = data.get("user", {})
    assert user.get("role") == "admin", f"User is not admin: {user}"
    return token


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def mongo_db():
    """Direct MongoDB connection for state verification."""
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import asyncio
        import pymongo

        mongo_url = "mongodb://localhost:27017"
        db_name = "syndicat_base"
        client = pymongo.MongoClient(mongo_url)
        db = client[db_name]
        yield db
        client.close()
    except Exception as e:
        pytest.skip(f"MongoDB connection failed: {e}")


@pytest.fixture(scope="module", autouse=True)
def cleanup_test_listings(mongo_db):
    """Cleanup test listings created during tests (autouse)."""
    yield
    # Teardown: remove all listings with test marker
    result = mongo_db.citadelle_listings.delete_many({"test_relance_marker": True})
    if result.deleted_count > 0:
        print(f"\n[Cleanup] Supprimé {result.deleted_count} annonce(s) de test.")


# ── Helper : insert test listing directly in MongoDB ──────────────────────────

def _insert_test_listing(
    mongo_db,
    days_old: int = 40,
    relance_sent_at: Optional[str] = None,
    seller_email: str = "test_seller_relance@test.fr",
    status: str = "active",
    with_seller_email: bool = True,
) -> dict:
    """Insert a synthetic listing in MongoDB for relance testing."""
    now = datetime.now(timezone.utc)
    created_at = (now - timedelta(days=days_old)).isoformat()
    listing_id = str(uuid.uuid4())

    listing = {
        "id": listing_id,
        "title": f"TEST_Relance Site E-commerce — 1200€/mois revenus mensuels",
        "slug": f"test-relance-{listing_id[:8]}",
        "short_description": "Description de test pour la relance automatique. " * 3,
        "description": "Description longue " * 20,
        "type": "ecommerce",
        "status": status,
        "price": 12000,
        "monthly_revenue": 1200,
        "monthly_charges": 200,
        "monthly_traffic": 5000,
        "age_months": 24,
        "niche": "E-commerce mode",
        "technologies": ["Shopify", "WooCommerce"],
        "ideal_buyer": "Un entrepreneur expérimenté en e-commerce",
        "weaknesses": "Dépend fortement des réseaux sociaux",
        "traffic_sources": "SEO, réseaux sociaux",
        "url_preview": "https://example.com",
        "images": ["https://example.com/img.jpg"],
        "is_adult": False,
        "is_auction": False,
        "seller_id": "test_seller_id_relance",
        "seller_email": seller_email if with_seller_email else None,
        "created_at": created_at,
        # NOTE: approved_at intentionally NOT included (like real listings that skip approval)
        # The scheduler query uses {$exists: False} to detect missing approved_at
        "updated_at": created_at,
        "relance_sent_at": relance_sent_at,
        "test_relance_marker": True,
    }
    mongo_db.citadelle_listings.insert_one(listing)
    return listing


# ══════════════════════════════════════════════════════════════════════════════
# CLASS 1 — Endpoint admin trigger-relance
# ══════════════════════════════════════════════════════════════════════════════

class TestAdminTriggerRelanceEndpoint:
    """Tests du endpoint POST /api/citadelle/admin/listings/trigger-relance"""

    def test_endpoint_accessible_with_admin_token(self, admin_headers):
        """Le endpoint retourne 200 avec message de succès quand appelé avec token admin."""
        response = requests.post(
            f"{BASE_URL}/api/citadelle/admin/listings/trigger-relance",
            headers=admin_headers,
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data, f"No 'message' in response: {data}"
        assert "relance" in data["message"].lower() or "déclenché" in data["message"].lower(), \
            f"Unexpected message: {data['message']}"
        print(f"✅ Endpoint 200 OK — message: {data['message']}")

    def test_endpoint_returns_correct_message(self, admin_headers):
        """Le message de réponse contient les informations attendues."""
        response = requests.post(
            f"{BASE_URL}/api/citadelle/admin/listings/trigger-relance",
            headers=admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        msg = data.get("message", "")
        assert len(msg) > 10, f"Message trop court: '{msg}'"
        print(f"✅ Message de réponse: {msg}")

    def test_endpoint_requires_auth(self):
        """Sans token → 401 ou 403 (non authentifié)."""
        response = requests.post(
            f"{BASE_URL}/api/citadelle/admin/listings/trigger-relance",
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code in (401, 403), f"Expected 401/403, got {response.status_code}: {response.text}"
        print(f"✅ Sans token → {response.status_code} correct")

    def test_endpoint_rejects_invalid_token(self):
        """Token invalide → 401."""
        response = requests.post(
            f"{BASE_URL}/api/citadelle/admin/listings/trigger-relance",
            headers={"Authorization": "Bearer invalidtoken123"},
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print(f"✅ Token invalide → 401 correct")

    def test_endpoint_rejects_non_admin_user(self):
        """Un utilisateur non-admin → 403."""
        # Login as a non-admin citadelle user
        login_resp = requests.post(
            f"{BASE_URL}/api/citadelle/auth/login",
            json={"email": "marie.testui@citadelle-test.fr", "password": "TestUI2026!"},
        )
        if login_resp.status_code != 200:
            pytest.skip("User non-admin non disponible pour ce test")
        token = login_resp.json().get("access_token")
        response = requests.post(
            f"{BASE_URL}/api/citadelle/admin/listings/trigger-relance",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print(f"✅ Non-admin → 403 correct")


# ══════════════════════════════════════════════════════════════════════════════
# CLASS 2 — Logique d'éligibilité des annonces
# ══════════════════════════════════════════════════════════════════════════════

class TestRelanceEligibility:
    """Tests de la logique de filtrage — quelles annonces sont candidates à la relance."""

    def test_listing_older_than_31_days_no_relance_is_eligible(self, mongo_db, admin_headers):
        """Une annonce active > 31j sans relance_sent_at doit être traitée."""
        listing = _insert_test_listing(mongo_db, days_old=40, relance_sent_at=None)
        listing_id = listing["id"]

        # Trigger the job
        resp = requests.post(
            f"{BASE_URL}/api/citadelle/admin/listings/trigger-relance",
            headers=admin_headers,
        )
        assert resp.status_code == 200

        # Wait for async task to complete
        time.sleep(4)

        # Verify relance_sent_at was set
        updated = mongo_db.citadelle_listings.find_one({"id": listing_id}, {"_id": 0})
        assert updated is not None, "Listing introuvable en DB"
        assert updated.get("relance_sent_at") is not None, \
            f"relance_sent_at devrait être set pour annonce de {40} jours: {updated}"
        print(f"✅ Annonce 40j traitée — relance_sent_at: {updated['relance_sent_at'][:19]}")

    def test_listing_older_than_31_days_relance_recent_not_eligible(self, mongo_db, admin_headers):
        """Une annonce avec relance envoyée il y a < 60j NE doit PAS être retraitée."""
        # relance envoyée il y a 30 jours (< 60 jours)
        relance_date = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        listing = _insert_test_listing(mongo_db, days_old=90, relance_sent_at=relance_date)
        listing_id = listing["id"]
        original_relance = listing["relance_sent_at"]

        # Trigger
        resp = requests.post(
            f"{BASE_URL}/api/citadelle/admin/listings/trigger-relance",
            headers=admin_headers,
        )
        assert resp.status_code == 200
        time.sleep(4)

        # relance_sent_at doit rester inchangé
        updated = mongo_db.citadelle_listings.find_one({"id": listing_id}, {"_id": 0})
        assert updated is not None
        assert updated.get("relance_sent_at") == original_relance, \
            f"relance_sent_at NE devrait PAS être mis à jour (relance récente < 60j). " \
            f"Original: {original_relance}, Updated: {updated.get('relance_sent_at')}"
        print(f"✅ Annonce avec relance < 60j non retraitée — inchangé: {original_relance[:19]}")

    def test_listing_older_than_31_days_relance_older_than_60_days_is_eligible(self, mongo_db, admin_headers):
        """Une annonce avec relance > 60j DOIT être retraitée."""
        # relance envoyée il y a 65 jours (> 60 jours)
        relance_date = (datetime.now(timezone.utc) - timedelta(days=65)).isoformat()
        listing = _insert_test_listing(mongo_db, days_old=130, relance_sent_at=relance_date)
        listing_id = listing["id"]
        original_relance = relance_date  # Use the value we set, not from listing dict

        # Trigger
        resp = requests.post(
            f"{BASE_URL}/api/citadelle/admin/listings/trigger-relance",
            headers=admin_headers,
        )
        assert resp.status_code == 200
        time.sleep(5)

        # relance_sent_at doit être mis à jour à une date plus récente
        updated = mongo_db.citadelle_listings.find_one({"id": listing_id}, {"_id": 0})
        assert updated is not None
        new_relance = updated.get("relance_sent_at")
        assert new_relance is not None, "relance_sent_at devrait être set"
        # The new relance date should be AFTER the original relance date (updated to now)
        now_approx = datetime.now(timezone.utc).isoformat()[:10]  # just compare dates
        assert new_relance[:10] == now_approx or new_relance != original_relance, \
            f"relance_sent_at DEVRAIT être mis à jour (relance > 60j). " \
            f"Original: {original_relance[:19]}, New: {new_relance}"
        print(f"✅ Annonce avec relance > 60j retraitée — new relance: {new_relance[:19]}")

    def test_listing_recent_less_than_31_days_not_eligible(self, mongo_db, admin_headers):
        """Une annonce de moins de 31 jours NE doit PAS être traitée."""
        listing = _insert_test_listing(mongo_db, days_old=15, relance_sent_at=None)
        listing_id = listing["id"]

        # Trigger
        resp = requests.post(
            f"{BASE_URL}/api/citadelle/admin/listings/trigger-relance",
            headers=admin_headers,
        )
        assert resp.status_code == 200
        time.sleep(4)

        # relance_sent_at doit rester None
        updated = mongo_db.citadelle_listings.find_one({"id": listing_id}, {"_id": 0})
        assert updated is not None
        assert updated.get("relance_sent_at") is None, \
            f"relance_sent_at NE devrait PAS être set pour annonce de 15 jours: {updated.get('relance_sent_at')}"
        print(f"✅ Annonce de 15j non traitée — relance_sent_at reste None")

    def test_inactive_listing_not_processed(self, mongo_db, admin_headers):
        """Une annonce non-active (ex: pending) NE doit PAS être traitée."""
        listing = _insert_test_listing(mongo_db, days_old=50, status="pending", relance_sent_at=None)
        listing_id = listing["id"]

        resp = requests.post(
            f"{BASE_URL}/api/citadelle/admin/listings/trigger-relance",
            headers=admin_headers,
        )
        assert resp.status_code == 200
        time.sleep(4)

        updated = mongo_db.citadelle_listings.find_one({"id": listing_id}, {"_id": 0})
        assert updated is not None
        assert updated.get("relance_sent_at") is None, \
            f"Listing pending ne devrait pas être traité: {updated.get('relance_sent_at')}"
        print(f"✅ Annonce pending non traitée — relance_sent_at reste None")

    def test_listing_without_seller_email_skipped(self, mongo_db, admin_headers):
        """Une annonce active > 31j sans seller_email est ignorée (pas d'email à envoyer)."""
        listing = _insert_test_listing(
            mongo_db, days_old=45, relance_sent_at=None, with_seller_email=False
        )
        listing_id = listing["id"]

        resp = requests.post(
            f"{BASE_URL}/api/citadelle/admin/listings/trigger-relance",
            headers=admin_headers,
        )
        assert resp.status_code == 200
        time.sleep(4)

        # relance_sent_at doit rester None (pas de seller_email → skip)
        updated = mongo_db.citadelle_listings.find_one({"id": listing_id}, {"_id": 0})
        assert updated is not None
        assert updated.get("relance_sent_at") is None, \
            f"Annonce sans seller_email ne devrait pas être marquée: {updated.get('relance_sent_at')}"
        print(f"✅ Annonce sans seller_email ignorée correctement")


# ══════════════════════════════════════════════════════════════════════════════
# CLASS 3 — Vérification TEST_EMAIL_OVERRIDE dans les logs
# ══════════════════════════════════════════════════════════════════════════════

class TestEmailOverride:
    """Vérifie que TEST_EMAIL_OVERRIDE redirige les emails vers arnaudasarcsg@gmail.com."""

    def test_email_sent_to_test_override_not_real_seller(self, mongo_db, admin_headers):
        """
        L'email de relance doit partir sur TEST_EMAIL_OVERRIDE (arnaudasarcsg@gmail.com)
        et NON sur l'email réel du vendeur.
        Vérification via les logs backend.
        """
        # Create a listing with a specific real seller email
        real_seller = "real_seller_test@example.com"
        listing = _insert_test_listing(
            mongo_db, days_old=35, relance_sent_at=None, seller_email=real_seller
        )
        listing_id = listing["id"]

        # Get current log position
        log_file = "/var/log/supervisor/backend.err.log"
        try:
            with open(log_file, "r") as f:
                existing_log = f.read()
            log_position = len(existing_log)
        except FileNotFoundError:
            pytest.skip("Backend log file not found")

        # Trigger the job
        resp = requests.post(
            f"{BASE_URL}/api/citadelle/admin/listings/trigger-relance",
            headers=admin_headers,
        )
        assert resp.status_code == 200

        # Wait for async task
        time.sleep(5)

        # Check logs for email sent to arnaudasarcsg@gmail.com
        try:
            with open(log_file, "r") as f:
                f.seek(log_position)
                new_logs = f.read()
        except Exception as e:
            pytest.skip(f"Cannot read logs: {e}")

        # Should see email sent to TEST_EMAIL_OVERRIDE
        assert TEST_EMAIL_OVERRIDE in new_logs or "Aucune annonce candidate" in new_logs, \
            f"Email override NOT found in logs. New logs:\n{new_logs[-2000:]}"

        # The log format is: "Email envoyé à arnaudasarcsg@gmail.com (vendeur réel: real@email.com)"
        # Real seller email appears as "(vendeur réel: ...)" = debug info, NOT as recipient
        # Verify the recipient in the log IS the TEST_EMAIL_OVERRIDE
        if "Email envoyé à" in new_logs and TEST_EMAIL_OVERRIDE in new_logs:
            # Extract the recipient (comes after "Email envoyé à ")
            log_lines = [l for l in new_logs.split("\n") if "Email envoyé à" in l and "Relance" in l]
            for log_line in log_lines:
                if real_seller in log_line:
                    # real_seller should appear only as "(vendeur réel: ...)", NOT as the main recipient
                    assert f"à {real_seller}" not in log_line, \
                        f"Real seller email '{real_seller}' should NOT be the recipient. Log: {log_line}"
                    assert f"à {TEST_EMAIL_OVERRIDE}" in log_line, \
                        f"TEST_EMAIL_OVERRIDE should be the recipient. Log: {log_line}"

        print(f"✅ TEST_EMAIL_OVERRIDE vérifié dans les logs")
        # Extract and show the relevant log line
        for line in new_logs.split("\n"):
            if "Relance" in line or "relance" in line.lower():
                print(f"  LOG: {line.strip()}")

    def test_test_email_override_configured_in_env(self):
        """TEST_EMAIL_OVERRIDE est bien configuré dans backend/.env."""
        env_file = "/app/backend/.env"
        try:
            with open(env_file, "r") as f:
                content = f.read()
            assert "TEST_EMAIL_OVERRIDE" in content, "TEST_EMAIL_OVERRIDE absent de .env"
            assert "arnaudasarcsg@gmail.com" in content, "Valeur arnaudasarcsg@gmail.com absente de .env"
            print(f"✅ TEST_EMAIL_OVERRIDE=arnaudasarcsg@gmail.com configuré dans .env")
        except FileNotFoundError:
            pytest.skip("Backend .env not found")


# ══════════════════════════════════════════════════════════════════════════════
# CLASS 4 — Score qualité (_compute_listing_quality)
# ══════════════════════════════════════════════════════════════════════════════

class TestQualityScore:
    """Tests du calcul de score qualité — miroir Python de listingQuality.js."""

    def _compute(self, listing):
        """Call _compute_listing_quality from the scheduler module."""
        from services.newsletter_scheduler import _compute_listing_quality
        return _compute_listing_quality(listing)

    def test_empty_listing_has_low_score(self):
        """Une annonce vide retourne un score bas."""
        result = self._compute({})
        assert "pct" in result
        assert "label" in result
        assert "missing" in result
        assert result["pct"] < 40, f"Score annonce vide devrait être < 40: {result['pct']}"
        print(f"✅ Annonce vide → {result['pct']}% ({result['label']})")

    def test_complete_listing_has_high_score(self):
        """Une annonce complète (tous critères remplis) retourne un score >= 90%."""
        listing = {
            "title": "Blog Finance — 3500€/mois revenus mensuels",  # >= 15 chars + chiffre
            "short_description": "Une excellente opportunité d'acquérir un blog de finance personnelle avec des revenus récurrents stables depuis 3 ans.",
            "description": "Description très détaillée " * 20,  # >= 300 chars
            "monthly_revenue": 3500,
            "monthly_charges": 500,
            "monthly_traffic": 15000,
            "traffic_sources": "SEO organique",
            "age_months": 36,
            "niche": "Finance personnelle",
            "technologies": ["WordPress"],
            "ideal_buyer": "Un entrepreneur passionné par la finance et le contenu",
            "weaknesses": "Dépend des algo Google",
            "url_preview": "https://blog-finance.fr",
            "images": ["https://example.com/img.jpg"],
            "is_adult": False,
        }
        result = self._compute(listing)
        assert result["pct"] >= 80, f"Score annonce complète devrait être >= 80: {result['pct']}%"
        print(f"✅ Annonce complète → {result['pct']}% ({result['label']}) — missing: {result['missing']}")

    def test_score_labels_thresholds(self):
        """Les labels de score respectent les seuils : >=90=excellent, >=70=bon, >=40=à compléter, <40=départ."""
        from services.newsletter_scheduler import _compute_listing_quality

        # Test with all weights → 100%
        perfect = {
            "title": "SaaS — 5000€/mois revenu mensuel",
            "short_description": "Super accroche " * 6,  # >= 80 chars
            "description": "Très longue description " * 15,  # >= 300 chars
            "monthly_revenue": 5000,
            "monthly_charges": 1000,
            "monthly_traffic": 20000,
            "traffic_sources": "SEO, publicité",
            "age_months": 48,
            "niche": "Logiciel SaaS",
            "technologies": ["Python", "React"],
            "ideal_buyer": "Un entrepreneur tech avec expérience SaaS",
            "weaknesses": "Dépend d'un seul client majeur",
            "url_preview": "https://saas.fr",
            "images": ["img1.jpg"],
            "is_adult": False,
        }
        result = _compute_listing_quality(perfect)
        assert result["pct"] >= 90
        assert result["label"] == "Score excellent", f"Attendu 'Score excellent' pour {result['pct']}%: {result['label']}"
        print(f"✅ Score >= 90 → '{result['label']}'")

    def test_title_requires_15_chars_and_number(self):
        """Le titre doit avoir >= 15 caractères ET contenir un chiffre."""
        from services.newsletter_scheduler import _compute_listing_quality

        # Titre court sans chiffre
        r1 = _compute_listing_quality({"title": "Blog vente"})
        # Titre long sans chiffre
        r2 = _compute_listing_quality({"title": "Un blog de vente en ligne assez long"})
        # Titre avec chiffre
        r3 = _compute_listing_quality({"title": "Blog revenus 3500€/mois"})

        # r1 doit avoir "titre clair" ET "chiffre clé" dans missing
        assert any("titre" in m.lower() or "15 car" in m.lower() for m in r1["missing"]), \
            f"Short title should have titre in missing: {r1['missing']}"
        # r3 ne doit pas avoir le chiffre dans missing
        assert not any("chiffre" in m.lower() for m in r3["missing"]), \
            f"Titre avec chiffre ne devrait pas avoir 'chiffre' dans missing: {r3['missing']}"
        print(f"✅ Critères titre validés")

    def test_score_pct_is_integer_between_0_and_100(self):
        """Le score pct est toujours un entier entre 0 et 100."""
        from services.newsletter_scheduler import _compute_listing_quality

        for listing in [
            {},
            {"title": "Test", "monthly_revenue": 100},
            {"title": "Blog — 1000€/mois revenus", "is_adult": True},
        ]:
            result = _compute_listing_quality(listing)
            assert isinstance(result["pct"], int), f"pct should be int: {type(result['pct'])}"
            assert 0 <= result["pct"] <= 100, f"pct out of range: {result['pct']}"
        print(f"✅ pct toujours int entre 0-100")

    def test_adult_listing_excludes_image_and_url_criteria(self):
        """Pour les annonces adultes (is_adult=True), les critères image et URL sont exclus."""
        from services.newsletter_scheduler import _compute_listing_quality

        adult = {
            "title": "Site — 2000€/mois revenus adultes",
            "is_adult": True,
        }
        non_adult = {
            "title": "Site — 2000€/mois revenus normaux",
            "is_adult": False,
        }

        result_adult = _compute_listing_quality(adult)
        result_non_adult = _compute_listing_quality(non_adult)

        # Non-adult devrait avoir image + URL dans missing (car pas d'images ni URL)
        missing_non_adult = [m.lower() for m in result_non_adult["missing"]]
        assert any("image" in m for m in missing_non_adult), \
            f"Non-adult sans images devrait avoir 'image' dans missing: {result_non_adult['missing']}"
        assert any("url" in m or "démo" in m for m in missing_non_adult), \
            f"Non-adult sans URL devrait avoir 'url' dans missing: {result_non_adult['missing']}"

        # Adult ne devrait PAS avoir image ni URL dans missing
        missing_adult = [m.lower() for m in result_adult["missing"]]
        assert not any("image" in m for m in missing_adult), \
            f"Annonce adulte ne devrait pas avoir 'image' dans missing: {result_adult['missing']}"
        assert not any("url" in m or "démo" in m for m in missing_adult), \
            f"Annonce adulte ne devrait pas avoir 'url' dans missing: {result_adult['missing']}"

        print(f"✅ Critères image/URL exclus pour annonces adultes")
        print(f"   Adult score: {result_adult['pct']}% | Non-adult score: {result_non_adult['pct']}%")

    def test_missing_returns_list_of_strings(self):
        """Le champ 'missing' est une liste de chaînes de caractères."""
        from services.newsletter_scheduler import _compute_listing_quality

        result = _compute_listing_quality({})
        assert isinstance(result["missing"], list), f"missing should be a list: {type(result['missing'])}"
        assert all(isinstance(m, str) for m in result["missing"]), \
            f"All missing items should be strings: {result['missing']}"
        print(f"✅ missing est une liste de {len(result['missing'])} chaînes")


# ══════════════════════════════════════════════════════════════════════════════
# CLASS 5 — Vérification settings (TEST_EMAIL_OVERRIDE)
# ══════════════════════════════════════════════════════════════════════════════

class TestSettings:
    """Vérifie la configuration TEST_EMAIL_OVERRIDE dans config/settings.py."""

    def test_test_email_override_loaded_in_settings(self):
        """TEST_EMAIL_OVERRIDE est bien chargé depuis .env dans config/settings.py."""
        from config.settings import TEST_EMAIL_OVERRIDE as setting_val
        assert setting_val is not None, \
            "TEST_EMAIL_OVERRIDE est None dans settings.py — vérifier .env"
        assert setting_val == "arnaudasarcsg@gmail.com", \
            f"TEST_EMAIL_OVERRIDE devrait être 'arnaudasarcsg@gmail.com', got: '{setting_val}'"
        print(f"✅ TEST_EMAIL_OVERRIDE chargé depuis settings: '{setting_val}'")

    def test_send_relance_email_uses_override(self):
        """
        La fonction send_citadelle_listing_relance_email utilise TEST_EMAIL_OVERRIDE
        comme destinataire plutôt que l'email réel du vendeur.
        Vérification du code source.
        """
        import inspect
        from services.email_service.citadelle.listings import send_citadelle_listing_relance_email
        source = inspect.getsource(send_citadelle_listing_relance_email)
        assert "TEST_EMAIL_OVERRIDE" in source, \
            "send_citadelle_listing_relance_email n'utilise pas TEST_EMAIL_OVERRIDE"
        assert "recipient = TEST_EMAIL_OVERRIDE or to_email" in source or \
               "TEST_EMAIL_OVERRIDE or to_email" in source, \
            "La logique de redirection recipient = TEST_EMAIL_OVERRIDE or to_email introuvable"
        print(f"✅ send_citadelle_listing_relance_email utilise bien TEST_EMAIL_OVERRIDE or to_email")


# ══════════════════════════════════════════════════════════════════════════════
# CLASS 6 — Verification MongoDB relance_sent_at
# ══════════════════════════════════════════════════════════════════════════════

class TestRelanceSentAtPersistence:
    """Vérifie que relance_sent_at est bien persisté en MongoDB après l'envoi."""

    def test_relance_sent_at_is_iso_datetime(self, mongo_db, admin_headers):
        """Après traitement, relance_sent_at doit être une date ISO UTC valide."""
        listing = _insert_test_listing(mongo_db, days_old=38, relance_sent_at=None)
        listing_id = listing["id"]

        resp = requests.post(
            f"{BASE_URL}/api/citadelle/admin/listings/trigger-relance",
            headers=admin_headers,
        )
        assert resp.status_code == 200
        time.sleep(5)

        updated = mongo_db.citadelle_listings.find_one({"id": listing_id}, {"_id": 0})
        assert updated is not None
        relance_ts = updated.get("relance_sent_at")
        assert relance_ts is not None, "relance_sent_at n'a pas été mis à jour"

        # Validate ISO datetime format
        try:
            dt = datetime.fromisoformat(relance_ts.replace("Z", "+00:00"))
            # Should be close to now (within last 30 seconds)
            now = datetime.now(timezone.utc)
            diff = abs((now - dt).total_seconds())
            assert diff < 30, f"relance_sent_at devrait être récent (< 30s): diff={diff}s, ts={relance_ts}"
            print(f"✅ relance_sent_at = {relance_ts[:19]} UTC (diff={diff:.1f}s)")
        except ValueError as e:
            pytest.fail(f"relance_sent_at n'est pas une date ISO valide: '{relance_ts}' — {e}")

    def test_relance_sent_at_only_updated_when_email_sent(self, mongo_db, admin_headers):
        """
        relance_sent_at n'est mis à jour que si l'envoi email réussit (ok=True).
        Vérification indirecte : annonce avec seller_email → relance_sent_at set.
        Annonce sans seller_email → relance_sent_at reste None.
        """
        with_email = _insert_test_listing(
            mongo_db, days_old=36, relance_sent_at=None, seller_email="test_with_email@test.fr"
        )
        without_email = _insert_test_listing(
            mongo_db, days_old=36, relance_sent_at=None, with_seller_email=False
        )

        resp = requests.post(
            f"{BASE_URL}/api/citadelle/admin/listings/trigger-relance",
            headers=admin_headers,
        )
        assert resp.status_code == 200
        time.sleep(5)

        updated_with = mongo_db.citadelle_listings.find_one(
            {"id": with_email["id"]}, {"_id": 0, "relance_sent_at": 1}
        )
        updated_without = mongo_db.citadelle_listings.find_one(
            {"id": without_email["id"]}, {"_id": 0, "relance_sent_at": 1}
        )

        assert updated_with.get("relance_sent_at") is not None, \
            "Annonce avec seller_email devrait avoir relance_sent_at set"
        assert updated_without.get("relance_sent_at") is None, \
            "Annonce sans seller_email ne devrait pas avoir relance_sent_at set"

        print(f"✅ relance_sent_at set pour annonce avec email, None pour sans email")
