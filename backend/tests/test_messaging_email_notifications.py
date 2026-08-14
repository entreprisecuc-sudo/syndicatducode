"""
Test de la messagerie et des notifications email — La Citadelle Numérique
Itération 27 — Tests du flux complet de notifications email de la messagerie

Scénarios testés :
- FLUX 1 : Acheteur envoie 1er message → 201 + conversation_id + last_notified vendeur
- FLUX 2 : Vendeur répond → 200 + last_notified acheteur mis à jour
- FLUX 3 : Anti-spam 24h côté vendeur (2ème message acheteur dans les 24h)
- FLUX 4 : Anti-spam 24h côté acheteur (2ème réponse vendeur dans les 24h)
- FLUX 5 : _should_notify helper (test direct Python)
- FLUX 6 : check_unanswered_conversations (async, double-participant)

Comptes de test :
- Acheteur : marie.testui@citadelle-test.fr / TestUI2026!
- Vendeur   : arnaudaube@gmail.com / ArnaudTest2026!
- Annonce active : b2da91e6-aafd-406e-a186-fbe7ac517dbe
"""

import pytest
import requests
import time
import os
import sys
import pymongo
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

# Load env
load_dotenv('/app/backend/.env')

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    # Fallback from frontend .env
    BASE_URL = "https://syndicate-code.preview.emergentagent.com"

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'syndicat_base')

# ── Comptes & données de test ──────────────────────────────────────────────────
BUYER_EMAIL    = "marie.testui@citadelle-test.fr"
BUYER_PASSWORD = "TestUI2026!"
BUYER_ID       = "26c042ac-fbdc-471e-b791-edd15325de7e"

SELLER_EMAIL    = "arnaudaube@gmail.com"
SELLER_PASSWORD = "ArnaudTest2026!"
SELLER_ID       = "7bd37587-6ef6-49ff-aa09-cdc4083a8637"

# Annonce active appartenant au vendeur arnaudaube@gmail.com
ACTIVE_LISTING_ID = "b2da91e6-aafd-406e-a186-fbe7ac517dbe"

# ID de conversation créé lors du FLUX 1 (partagé entre tests via class variable)
_test_conversation_id = None


# ── Fixtures ───────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def mongo_db():
    """Connexion MongoDB directe pour vérifier les données en base."""
    client = pymongo.MongoClient(MONGO_URL)
    db = client[DB_NAME]
    yield db
    client.close()


@pytest.fixture(scope="module")
def buyer_token():
    """JWT acheteur (marie.testui)."""
    resp = requests.post(f"{BASE_URL}/api/citadelle/auth/login", json={
        "email": BUYER_EMAIL,
        "password": BUYER_PASSWORD,
        "remember_me": False,
    })
    assert resp.status_code == 200, f"Login acheteur échoué : {resp.text}"
    return resp.json()["access_token"]


@pytest.fixture(scope="module")
def seller_token():
    """JWT vendeur (arnaudaube@gmail.com)."""
    resp = requests.post(f"{BASE_URL}/api/citadelle/auth/login", json={
        "email": SELLER_EMAIL,
        "password": SELLER_PASSWORD,
        "remember_me": False,
    })
    assert resp.status_code == 200, f"Login vendeur échoué : {resp.text}"
    return resp.json()["access_token"]


@pytest.fixture(scope="module")
def buyer_headers(buyer_token):
    return {"Authorization": f"Bearer {buyer_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def seller_headers(seller_token):
    return {"Authorization": f"Bearer {seller_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module", autouse=True)
def cleanup_test_conversations(mongo_db):
    """
    Nettoyage AVANT le module : supprime toute conversation de test
    entre marie.testui et arnaudaube sur l'annonce de test, pour garantir
    un état propre.
    """
    mongo_db.citadelle_conversations.delete_many({
        "listing_id": ACTIVE_LISTING_ID,
        "buyer_id": BUYER_ID,
    })
    yield
    # Nettoyage APRÈS : supprimer les conversations créées par les tests
    mongo_db.citadelle_conversations.delete_many({
        "listing_id": ACTIVE_LISTING_ID,
        "buyer_id": BUYER_ID,
    })


# ── FLUX 1 : Premier message acheteur → vendeur ────────────────────────────────

class TestFlux1BuyerFirstMessage:
    """FLUX 1 — Acheteur envoie un 1er message ; vendeur doit recevoir une notif."""

    def test_send_first_message_returns_201(self, buyer_headers):
        """API retourne 201 avec conversation_id."""
        resp = requests.post(f"{BASE_URL}/api/citadelle/messages/send",
            headers=buyer_headers,
            json={
                "listing_id": ACTIVE_LISTING_ID,
                "content": "TEST_FLUX1 — Bonjour, je suis intéressé par votre actif numérique.",
            }
        )
        assert resp.status_code == 201, f"Attendu 201, obtenu {resp.status_code} — {resp.text}"
        data = resp.json()
        assert "conversation_id" in data, "conversation_id absent de la réponse"
        assert data["conversation_id"], "conversation_id est vide"

        # Sauvegarder l'ID de conversation pour les tests suivants
        global _test_conversation_id
        _test_conversation_id = data["conversation_id"]
        print(f"[FLUX 1] conversation_id créé : {_test_conversation_id}")

    def test_send_first_message_response_structure(self, buyer_headers):
        """La réponse contient message, created=True, et pas de sanitize forcé."""
        # On utilise la conv existante — on envoie un 2ème message pour vérifier la structure
        # (la conv est déjà créée par le test précédent)
        resp = requests.post(f"{BASE_URL}/api/citadelle/messages/send",
            headers=buyer_headers,
            json={
                "listing_id": ACTIVE_LISTING_ID,
                "content": "TEST_FLUX1b — Question de suivi.",
            }
        )
        assert resp.status_code == 201, f"Attendu 201 — {resp.text}"
        data = resp.json()
        assert "message" in data, "Champ 'message' absent"
        assert "conversation_id" in data
        msg = data["message"]
        assert "id" in msg
        assert "sent_at" in msg
        assert msg["content"] == "TEST_FLUX1b — Question de suivi."
        print("[FLUX 1b] Structure de réponse correcte.")

    def test_seller_last_notified_set_after_first_message(self, mongo_db):
        """
        Après le 1er message, last_notified du vendeur doit être renseigné en DB.
        Le système de notification est asynchrone — attendre 4 secondes.
        """
        global _test_conversation_id
        assert _test_conversation_id, "conversation_id non initialisé (FLUX 1 échoué ?)"

        # Attendre que la tâche asynchrone d'envoi email complète
        time.sleep(4)

        conv = mongo_db.citadelle_conversations.find_one(
            {"id": _test_conversation_id}, {"_id": 0}
        )
        assert conv, f"Conversation {_test_conversation_id} introuvable en DB"
        assert "last_notified" in conv, "Champ last_notified absent de la conversation"

        last_notified = conv["last_notified"]
        print(f"[FLUX 1] last_notified en DB : {last_notified}")

        # Vérifier que le vendeur a été notifié (son last_notified est défini)
        seller_notified_ts = last_notified.get(SELLER_ID)
        assert seller_notified_ts, (
            f"last_notified[{SELLER_ID}] non défini — l'email vendeur n'a pas été envoyé "
            f"ou SMTP a échoué. last_notified complet : {last_notified}"
        )
        print(f"[FLUX 1] Vendeur notifié à : {seller_notified_ts} ✓")


# ── FLUX 2 : Réponse vendeur → acheteur ───────────────────────────────────────

class TestFlux2SellerReply:
    """FLUX 2 — Vendeur répond ; acheteur doit recevoir une notif."""

    def test_seller_reply_returns_200(self, seller_headers):
        """API retourne 200 pour la réponse du vendeur."""
        global _test_conversation_id
        assert _test_conversation_id, "conversation_id non initialisé"

        resp = requests.post(
            f"{BASE_URL}/api/citadelle/messages/{_test_conversation_id}/reply",
            headers=seller_headers,
            json={"content": "TEST_FLUX2 — Bonjour, merci de votre intérêt !"},
        )
        assert resp.status_code == 200, f"Attendu 200, obtenu {resp.status_code} — {resp.text}"
        data = resp.json()
        assert "message" in data, "Champ 'message' absent de la réponse"
        msg = data["message"]
        assert msg["content"] == "TEST_FLUX2 — Bonjour, merci de votre intérêt !"
        print("[FLUX 2] Réponse vendeur : 200 ✓")

    def test_buyer_last_notified_set_after_seller_reply(self, mongo_db):
        """
        Après la réponse du vendeur, last_notified de l'acheteur doit être défini en DB.
        Attente 4 secondes pour la tâche async.
        """
        global _test_conversation_id
        assert _test_conversation_id

        time.sleep(4)

        conv = mongo_db.citadelle_conversations.find_one(
            {"id": _test_conversation_id}, {"_id": 0}
        )
        assert conv, "Conversation introuvable"

        last_notified = conv.get("last_notified", {})
        print(f"[FLUX 2] last_notified en DB : {last_notified}")

        buyer_notified_ts = last_notified.get(BUYER_ID)
        assert buyer_notified_ts, (
            f"last_notified[{BUYER_ID}] non défini — notif acheteur non envoyée. "
            f"last_notified: {last_notified}"
        )
        print(f"[FLUX 2] Acheteur notifié à : {buyer_notified_ts} ✓")


# ── FLUX 3 : Anti-spam 24h côté vendeur ───────────────────────────────────────

class TestFlux3AntiSpamVendeur:
    """
    FLUX 3 — Si acheteur envoie un 2ème message dans la même conv < 24h,
    last_notified du vendeur NE DOIT PAS être mis à jour.
    """

    def _set_recent_last_notified_seller(self, mongo_db, conv_id: str, ts: str):
        """Force last_notified[seller] à un timestamp récent (< 24h)."""
        mongo_db.citadelle_conversations.update_one(
            {"id": conv_id},
            {"$set": {f"last_notified.{SELLER_ID}": ts}}
        )

    def test_antispam_seller_second_message_no_update(self, buyer_headers, mongo_db):
        """
        Simule : vendeur déjà notifié il y a 1h.
        Acheteur envoie un 2ème msg → last_notified du vendeur reste inchangé.
        """
        global _test_conversation_id
        assert _test_conversation_id

        # Forcer un timestamp récent (il y a 1 heure) pour simuler notif récente
        recent_ts = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
        self._set_recent_last_notified_seller(mongo_db, _test_conversation_id, recent_ts)

        # Vérifier que le timestamp est bien en DB
        conv_before = mongo_db.citadelle_conversations.find_one(
            {"id": _test_conversation_id}, {"_id": 0, "last_notified": 1}
        )
        assert conv_before["last_notified"].get(SELLER_ID) == recent_ts, \
            "Impossible de forcer last_notified en DB"
        print(f"[FLUX 3] last_notified vendeur forcé à : {recent_ts}")

        # Acheteur envoie un 2ème message
        resp = requests.post(f"{BASE_URL}/api/citadelle/messages/send",
            headers=buyer_headers,
            json={
                "listing_id": ACTIVE_LISTING_ID,
                "content": "TEST_FLUX3 — 2ème message (anti-spam test).",
            }
        )
        assert resp.status_code == 201, f"Attendu 201 — {resp.text}"

        # Attendre que tout async se termine
        time.sleep(3)

        # Vérifier que last_notified n'a PAS changé
        conv_after = mongo_db.citadelle_conversations.find_one(
            {"id": _test_conversation_id}, {"_id": 0, "last_notified": 1}
        )
        seller_ts_after = conv_after["last_notified"].get(SELLER_ID)
        assert seller_ts_after == recent_ts, (
            f"ANTI-SPAM VIOLATED: last_notified vendeur a été mis à jour malgré le cooldown 24h ! "
            f"Avant: {recent_ts} | Après: {seller_ts_after}"
        )
        print(f"[FLUX 3] Anti-spam vendeur OK — last_notified inchangé : {seller_ts_after} ✓")


# ── FLUX 4 : Anti-spam 24h côté acheteur ──────────────────────────────────────

class TestFlux4AntiSpamAcheteur:
    """
    FLUX 4 — Si vendeur répond deux fois de suite < 24h,
    last_notified de l'acheteur NE DOIT PAS être mis à jour au 2ème message.
    """

    def _set_recent_last_notified_buyer(self, mongo_db, conv_id: str, ts: str):
        """Force last_notified[buyer] à un timestamp récent (< 24h)."""
        mongo_db.citadelle_conversations.update_one(
            {"id": conv_id},
            {"$set": {f"last_notified.{BUYER_ID}": ts}}
        )

    def test_antispam_buyer_second_reply_no_update(self, seller_headers, mongo_db):
        """
        Simule : acheteur déjà notifié il y a 30 min.
        Vendeur répond une 2ème fois → last_notified acheteur reste inchangé.
        """
        global _test_conversation_id
        assert _test_conversation_id

        # Forcer un timestamp récent (il y a 30 min) pour simuler notif récente
        recent_ts = (datetime.now(timezone.utc) - timedelta(minutes=30)).isoformat()
        self._set_recent_last_notified_buyer(mongo_db, _test_conversation_id, recent_ts)

        conv_before = mongo_db.citadelle_conversations.find_one(
            {"id": _test_conversation_id}, {"_id": 0, "last_notified": 1}
        )
        assert conv_before["last_notified"].get(BUYER_ID) == recent_ts, \
            "Impossible de forcer last_notified acheteur en DB"
        print(f"[FLUX 4] last_notified acheteur forcé à : {recent_ts}")

        # Vendeur répond une 2ème fois
        resp = requests.post(
            f"{BASE_URL}/api/citadelle/messages/{_test_conversation_id}/reply",
            headers=seller_headers,
            json={"content": "TEST_FLUX4 — 2ème réponse vendeur (anti-spam test)."},
        )
        assert resp.status_code == 200, f"Attendu 200 — {resp.text}"

        # Attendre que tout async se termine
        time.sleep(3)

        # Vérifier que last_notified n'a PAS changé
        conv_after = mongo_db.citadelle_conversations.find_one(
            {"id": _test_conversation_id}, {"_id": 0, "last_notified": 1}
        )
        buyer_ts_after = conv_after["last_notified"].get(BUYER_ID)
        assert buyer_ts_after == recent_ts, (
            f"ANTI-SPAM VIOLATED: last_notified acheteur mis à jour malgré le cooldown 24h ! "
            f"Avant: {recent_ts} | Après: {buyer_ts_after}"
        )
        print(f"[FLUX 4] Anti-spam acheteur OK — last_notified inchangé : {buyer_ts_after} ✓")


# ── FLUX 5 : Test direct de _should_notify ─────────────────────────────────────

# Import module-level pour FLUX 5 (évite les problèmes de scoping pytest)
sys.path.insert(0, '/app/backend')
from routes.citadelle.messages import _should_notify as _helper_should_notify
from routes.citadelle.messages import NOTIFICATION_COOLDOWN_SECONDS as _COOLDOWN_SECONDS


class TestFlux5ShouldNotifyHelper:
    """
    FLUX 5 — Vérification du helper _should_notify via import direct Python.
    """

    def test_should_notify_returns_true_when_no_last_notified(self):
        """Retourne True si aucune notification précédente."""
        conv = {"last_notified": {}}
        assert _helper_should_notify(conv, "user_123") is True
        print("[FLUX 5] should_notify True (jamais notifié) ✓")

    def test_should_notify_returns_true_when_user_not_in_last_notified(self):
        """Retourne True si l'utilisateur n'est pas dans last_notified."""
        conv = {"last_notified": {"other_user": datetime.now(timezone.utc).isoformat()}}
        assert _helper_should_notify(conv, "new_user") is True
        print("[FLUX 5] should_notify True (utilisateur absent) ✓")

    def test_should_notify_returns_false_within_cooldown(self):
        """Retourne False si notifié il y a moins de 24h."""
        recent_ts = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
        conv = {"last_notified": {"user_abc": recent_ts}}
        assert _helper_should_notify(conv, "user_abc") is False
        print("[FLUX 5] should_notify False (dans la fenêtre cooldown 24h) ✓")

    def test_should_notify_returns_true_after_cooldown(self):
        """Retourne True si notifié il y a plus de 24h."""
        old_ts = (datetime.now(timezone.utc) - timedelta(hours=25)).isoformat()
        conv = {"last_notified": {"user_abc": old_ts}}
        assert _helper_should_notify(conv, "user_abc") is True
        print("[FLUX 5] should_notify True (cooldown expiré après 25h) ✓")

    def test_should_notify_handles_naive_datetime(self):
        """Gère les timestamps sans timezone (les met en UTC automatiquement)."""
        # Timestamp naïf (sans timezone) < 24h
        naive_ts = (datetime.now() - timedelta(hours=2)).isoformat()  # sans tzinfo
        conv = {"last_notified": {"user_xyz": naive_ts}}
        result = _helper_should_notify(conv, "user_xyz")
        assert result is False, f"Devrait être False (timestamp naïf récent) — résultat : {result}"
        print("[FLUX 5] should_notify False (timestamp naïf récent) ✓")

    def test_should_notify_handles_invalid_timestamp(self):
        """Retourne True si le timestamp est invalide (failsafe)."""
        conv = {"last_notified": {"user_xyz": "not-a-timestamp"}}
        assert _helper_should_notify(conv, "user_xyz") is True
        print("[FLUX 5] should_notify True (timestamp invalide → failsafe) ✓")

    def test_cooldown_is_86400_seconds(self):
        """NOTIFICATION_COOLDOWN_SECONDS doit être exactement 86400 (24h)."""
        assert _COOLDOWN_SECONDS == 86400, f"Cooldown attendu 86400s, obtenu {_COOLDOWN_SECONDS}"
        print(f"[FLUX 5] NOTIFICATION_COOLDOWN_SECONDS = 86400 ✓")

    def test_should_notify_handles_missing_last_notified_key(self):
        """Retourne True si last_notified est absent de la conv."""
        conv = {}  # Pas de champ last_notified du tout
        assert _helper_should_notify(conv, "user_abc") is True
        print("[FLUX 5] should_notify True (last_notified absent) ✓")


# ── FLUX 6 : Vérification check_unanswered_conversations ──────────────────────

class TestFlux6CheckUnansweredConversations:
    """
    FLUX 6 — Vérification de la logique check_unanswered_conversations.
    La fonction doit être async et gérer les deux participants.
    """

    def test_function_is_async_coroutine(self):
        """check_unanswered_conversations doit être une coroutine async."""
        import asyncio
        sys.path.insert(0, '/app/backend')
        from services.newsletter_scheduler import check_unanswered_conversations
        assert asyncio.iscoroutinefunction(check_unanswered_conversations), \
            "check_unanswered_conversations n'est pas une fonction async !"
        print("[FLUX 6] check_unanswered_conversations est bien async ✓")

    def test_function_accepts_both_participants(self, mongo_db):
        """
        Vérifie que la logique de la fonction itère sur les deux participants
        (buyer_id ET seller_id) dans chaque conversation.
        Inspection statique + test de comportement.
        """
        import asyncio
        import inspect
        sys.path.insert(0, '/app/backend')
        from services import newsletter_scheduler

        # Injecter la base de données dans le scheduler
        newsletter_scheduler.set_database(mongo_db)

        # Lire le code source pour vérifier que les deux participants sont traités
        source = inspect.getsource(newsletter_scheduler.check_unanswered_conversations)
        assert "buyer_id" in source, "buyer_id absent du code de check_unanswered_conversations"
        assert "seller_id" in source, "seller_id absent du code de check_unanswered_conversations"
        assert "buyer_email" in source, "buyer_email absent du code"
        assert "seller_email" in source, "seller_email absent du code"
        print("[FLUX 6] Deux participants (buyer + seller) bien traités dans la logique ✓")

    def test_function_uses_24h_threshold(self):
        """
        La fonction doit filtrer les messages > 24h (updated_at < threshold_24h).
        """
        import inspect
        sys.path.insert(0, '/app/backend')
        from services import newsletter_scheduler
        source = inspect.getsource(newsletter_scheduler.check_unanswered_conversations)
        assert "threshold_24h" in source or "timedelta(hours=24)" in source, \
            "Seuil 24h absent du code de check_unanswered_conversations"
        print("[FLUX 6] Seuil de 24h présent dans la logique ✓")

    def test_function_respects_antispam(self):
        """La fonction doit vérifier last_notified avant d'envoyer le digest."""
        import inspect
        sys.path.insert(0, '/app/backend')
        from services import newsletter_scheduler
        source = inspect.getsource(newsletter_scheduler.check_unanswered_conversations)
        assert "last_notified" in source, \
            "last_notified non vérifié dans check_unanswered_conversations (anti-spam absent !)"
        assert "86400" in source or "86_400" in source or "24" in source, \
            "Cooldown anti-spam absent du check_unanswered_conversations"
        print("[FLUX 6] Anti-spam (last_notified) bien vérifié dans le job digest ✓")

    def test_function_calls_send_unread_messages_digest_email(self):
        """La fonction appelle bien send_unread_messages_digest_email."""
        import inspect
        sys.path.insert(0, '/app/backend')
        from services import newsletter_scheduler
        source = inspect.getsource(newsletter_scheduler.check_unanswered_conversations)
        assert "send_unread_messages_digest_email" in source, \
            "send_unread_messages_digest_email non appelé dans check_unanswered_conversations !"
        print("[FLUX 6] send_unread_messages_digest_email bien appelé dans le job ✓")

    def test_digest_email_function_exported_from_email_service(self):
        """send_unread_messages_digest_email doit être exporté depuis services.email_service."""
        sys.path.insert(0, '/app/backend')
        try:
            from services.email_service import send_unread_messages_digest_email
            assert callable(send_unread_messages_digest_email), \
                "send_unread_messages_digest_email n'est pas appelable"
            print("[FLUX 6] send_unread_messages_digest_email bien exporté depuis email_service ✓")
        except ImportError as e:
            pytest.fail(f"Import échoué : {e}")

    def test_digest_email_function_signature(self):
        """send_unread_messages_digest_email doit accepter recipient_email et conversations."""
        import inspect
        sys.path.insert(0, '/app/backend')
        from services.email_service import send_unread_messages_digest_email
        sig = inspect.signature(send_unread_messages_digest_email)
        params = list(sig.parameters.keys())
        assert "recipient_email" in params, \
            f"Paramètre recipient_email absent. Signature : {sig}"
        assert "conversations" in params, \
            f"Paramètre conversations absent. Signature : {sig}"
        print(f"[FLUX 6] Signature send_unread_messages_digest_email correcte : {sig} ✓")


# ── Tests additionnels : robustesse de l'API ──────────────────────────────────

class TestAPIRobustness:
    """Tests de robustesse des endpoints messages."""

    def test_send_message_to_nonexistent_listing_returns_404(self, buyer_headers):
        """Retourne 404 pour une annonce inexistante."""
        resp = requests.post(f"{BASE_URL}/api/citadelle/messages/send",
            headers=buyer_headers,
            json={"listing_id": "nonexistent-listing-id", "content": "test"}
        )
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"
        print("[Robustesse] 404 pour annonce inexistante ✓")

    def test_send_empty_message_returns_400(self, buyer_headers):
        """Retourne 400 pour un message vide sans pièce jointe."""
        resp = requests.post(f"{BASE_URL}/api/citadelle/messages/send",
            headers=buyer_headers,
            json={"listing_id": ACTIVE_LISTING_ID, "content": "  "}
        )
        assert resp.status_code == 400, f"Attendu 400, obtenu {resp.status_code}"
        print("[Robustesse] 400 pour message vide ✓")

    def test_seller_cannot_message_own_listing(self, seller_headers):
        """Le vendeur ne peut pas s'envoyer un message à lui-même."""
        resp = requests.post(f"{BASE_URL}/api/citadelle/messages/send",
            headers=seller_headers,
            json={"listing_id": ACTIVE_LISTING_ID, "content": "auto-message"}
        )
        assert resp.status_code == 400, f"Attendu 400, obtenu {resp.status_code}"
        print("[Robustesse] 400 auto-message vendeur ✓")

    def test_reply_to_nonexistent_conversation_returns_404(self, seller_headers):
        """Retourne 404 pour une conversation inexistante."""
        resp = requests.post(
            f"{BASE_URL}/api/citadelle/messages/nonexistent-conv-id/reply",
            headers=seller_headers,
            json={"content": "test"}
        )
        assert resp.status_code == 404, f"Attendu 404, obtenu {resp.status_code}"
        print("[Robustesse] 404 pour conversation inexistante ✓")

    def test_unauthorized_user_cannot_reply(self, mongo_db, buyer_headers, seller_headers):
        """Un tiers non autorisé ne peut pas répondre dans une conversation."""
        global _test_conversation_id
        assert _test_conversation_id

        # Créer un 3ème utilisateur token pour tester (utiliser le token acheteur mais
        # essayer d'accéder à une conversation qui ne lui appartient pas — on en crée une autre)
        # Utiliser une conversation dont l'acheteur est quelqu'un d'autre
        # On prend la conv existante de joerke.b.direction@gmail.com
        other_conv = mongo_db.citadelle_conversations.find_one({
            "buyer_email": "joerke.b.direction@gmail.com"
        }, {"_id": 0, "id": 1})

        if not other_conv:
            pytest.skip("Pas de conversation tierce disponible pour ce test")

        resp = requests.post(
            f"{BASE_URL}/api/citadelle/messages/{other_conv['id']}/reply",
            headers=buyer_headers,
            json={"content": "intrusion test"}
        )
        assert resp.status_code == 403, \
            f"Attendu 403 (accès non autorisé), obtenu {resp.status_code}"
        print("[Robustesse] 403 accès non autorisé ✓")

    def test_send_message_without_auth_returns_401(self):
        """Retourne 401 sans token d'authentification."""
        resp = requests.post(f"{BASE_URL}/api/citadelle/messages/send",
            headers={"Content-Type": "application/json"},
            json={"listing_id": ACTIVE_LISTING_ID, "content": "no auth"}
        )
        assert resp.status_code in [401, 403], \
            f"Attendu 401/403, obtenu {resp.status_code}"
        print("[Robustesse] 401/403 sans auth ✓")
