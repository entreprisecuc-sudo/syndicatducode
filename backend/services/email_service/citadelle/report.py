"""
Emails Citadelle — Signalement de conversation.
"""

import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from config.settings import CITADELLE_FROM_EMAIL, CITADELLE_URL
from services.email_service.core import _envoyer_email

logger = logging.getLogger(__name__)


def send_citadelle_report_email(report: dict) -> bool:
    """Notifie l'admin qu'une conversation a été signalée par un utilisateur."""
    try:
        from config.settings import CITADELLE_ADMIN_EMAIL

        type_label = "Transaction" if report.get("conversation_type") == "transaction" else "Pré-vente"

        msg = MIMEMultipart()
        msg['From'] = CITADELLE_FROM_EMAIL
        msg['To'] = CITADELLE_ADMIN_EMAIL
        msg['Reply-To'] = report.get("reporter_email", CITADELLE_FROM_EMAIL)
        msg['Subject'] = f"[Signalement Citadelle] {report.get('reason_label', 'Conversation signalée')}"

        body = f"""Nouveau signalement de conversation — La Citadelle Numérique

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Motif        : {report.get('reason_label')}
Type         : {type_label}
Signalé par  : {report.get('reporter_email')} ({report.get('reporter_role')})
Annonce      : {report.get('listing_title') or '—'}
Acheteur     : {report.get('buyer_email') or '—'}
Vendeur      : {report.get('seller_email') or '—'}
Conversation : {report.get('conversation_type')} / {report.get('conversation_id')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Message de l'utilisateur :
{report.get('message')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
À traiter depuis le back-office :
{CITADELLE_URL}/syndicat-admin/citadelle/signalements
"""

        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        _envoyer_email(msg)

        logger.info(f"[Citadelle Report] Email admin envoyé pour le signalement {report.get('id')}")
        return True

    except Exception as e:
        logger.error(f"[Citadelle Report] Erreur envoi email signalement: {e}")
        return False
