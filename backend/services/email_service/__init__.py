"""
Service d'envoi d'emails — package rangé par site (Syndicat / Citadelle).
Ré-exporte toutes les fonctions publiques pour conserver les imports existants
(`from services.email_service import X`).
"""

from services.email_service.core import send_citadelle_email
from services.email_service.syndicat import (
    send_reset_password_email,
    send_welcome_email,
    send_suspension_email,
    send_reactivation_email,
    send_application_decision_email,
    send_backup_notification_email,
)
from services.email_service.citadelle.auth import (
    send_citadelle_reset_password_email,
    send_citadelle_admin_new_user_email,
)
from services.email_service.citadelle.listings import (
    send_citadelle_listing_approved_email,
    send_citadelle_listing_rejected_email,
    send_citadelle_admin_new_listing_email,
    send_citadelle_garde_verified_email,
)
from services.email_service.citadelle.transactions import (
    send_citadelle_credentials_email,
    send_new_message_notification_email,
    send_new_offer_notification_email,
    send_conversation_reminder_email,
)
from services.email_service.citadelle.services import (
    send_service_order_confirmation_email,
    send_service_order_admin_notification_email,
    send_invoice_confirmation_email,
)
from services.email_service.citadelle.contact import send_citadelle_contact_email
from services.email_service.citadelle.report import send_citadelle_report_email
from services.email_service.citadelle.moderation import send_citadelle_moderation_email
from services.email_service.citadelle.newsletter import (
    build_newsletter_html,
    send_newsletter_digest_email,
)
from services.email_service.citadelle.auctions import (
    send_citadelle_auction_new_listing_email,
    send_citadelle_auction_bid_email,
    send_citadelle_auction_winner_email,
    send_citadelle_auction_bid_removed_email,
    send_citadelle_auction_daily_digest_email,
)
