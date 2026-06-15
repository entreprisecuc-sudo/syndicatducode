"""
Emails Citadelle — Formulaire de contact.
"""

import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from config.settings import (
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASSWORD,
    FRONTEND_URL,
    CITADELLE_URL,
    CITADELLE_FROM_EMAIL,
    CITADELLE_SMTP_USER,
    CITADELLE_SMTP_PASSWORD,
    BACKEND_PUBLIC_URL,
)
from services.email_service.core import _envoyer_email

logger = logging.getLogger(__name__)


def send_citadelle_contact_email(nom: str, email: str, sujet: str, message: str) -> bool:
    """
    Transmet le message du formulaire de contact à l'équipe La Citadelle Numérique.
    L'admin reçoit le contenu complet avec l'email de l'expéditeur pour répondre.
    """
    try:
        from config.settings import CITADELLE_ADMIN_EMAIL

        msg = MIMEMultipart()
        msg['From'] = CITADELLE_FROM_EMAIL
        msg['To'] = CITADELLE_ADMIN_EMAIL
        msg['Reply-To'] = email
        msg['Subject'] = f"[Contact Citadelle] {sujet}"

        body = f"""Nouveau message de contact — La Citadelle Numérique

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
De        : {nom}
Email     : {email}
Sujet     : {sujet}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Message envoyé depuis le formulaire de contact
{CITADELLE_URL}/citadelle/contact
"""

        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        _envoyer_email(msg)

        logger.info(f"[Citadelle Contact] Message reçu de {email} — sujet: {sujet[:50]}")
        return True

    except Exception as e:
        logger.error(f"[Citadelle Contact] Erreur envoi email contact: {e}")
        return False


