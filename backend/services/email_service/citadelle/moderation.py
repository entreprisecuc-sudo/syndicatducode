"""
Emails Citadelle — Modération (avertissement, suspension, bannissement).
"""

import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from config.settings import CITADELLE_FROM_EMAIL, CITADELLE_URL
from services.email_service.core import _envoyer_email

logger = logging.getLogger(__name__)

_SUJETS = {
    "warning": "Avertissement — La Citadelle Numérique",
    "suspension": "Suspension de votre compte — La Citadelle Numérique",
    "ban": "Fermeture de votre compte — La Citadelle Numérique",
}


def _corps(action: str, prenom: str, reason: str, note: str, until: str = None) -> str:
    salut = f"Bonjour {prenom}," if prenom else "Bonjour,"
    if action == "warning":
        intro = ("Vous recevez un avertissement officiel concernant votre activité sur La Citadelle Numérique. "
                 "Tout manquement répété pourra entraîner la suspension ou la fermeture de votre compte.")
    elif action == "suspension":
        fin = f"\nVotre compte sera automatiquement réactivé le : {until[:10]}." if until else ""
        intro = ("Votre compte a été temporairement suspendu suite à un manquement à nos règles d'utilisation. "
                 "Pendant cette période, vous ne pouvez plus vous connecter." + fin)
    else:  # ban
        intro = ("Votre compte a été fermé définitivement suite à un manquement grave ou répété à nos règles d'utilisation. "
                 "Vous ne pouvez plus accéder à la plateforme.")

    details = f"\nMotif : {reason}"
    if note:
        details += f"\nPrécisions : {note}"

    return f"""{salut}

{intro}
{details}

Si vous estimez que cette décision est une erreur, vous pouvez contacter notre équipe.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
L'équipe de La Citadelle Numérique
{CITADELLE_URL}/citadelle/contact
"""


def send_citadelle_moderation_email(user_email: str, first_name: str, action: str,
                                    reason: str, note: str = "", until: str = None) -> bool:
    """Notifie un membre d'une sanction (avertissement / suspension / bannissement)."""
    try:
        msg = MIMEMultipart()
        msg['From'] = CITADELLE_FROM_EMAIL
        msg['To'] = user_email
        msg['Subject'] = _SUJETS.get(action, "Notification — La Citadelle Numérique")
        msg.attach(MIMEText(_corps(action, first_name, reason, note, until), 'plain', 'utf-8'))
        _envoyer_email(msg)
        logger.info(f"[Citadelle Moderation] Email '{action}' envoyé à {user_email}")
        return True
    except Exception as e:
        logger.error(f"[Citadelle Moderation] Erreur envoi email '{action}': {e}")
        return False
