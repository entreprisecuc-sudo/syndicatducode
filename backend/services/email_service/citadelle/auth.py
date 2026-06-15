"""
Emails Citadelle — Authentification (reset mot de passe, nouveau compte).
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


def send_citadelle_reset_password_email(to_email: str, reset_token: str) -> bool:
    """
    Envoie un email de réinitialisation de mot de passe avec le branding Citadelle.
    Utilise CITADELLE_FROM_EMAIL comme expéditeur (configurable séparément du Syndicat).

    Args:
        to_email: Email du destinataire
        reset_token: Token de réinitialisation (brut)

    Returns:
        True si l'envoi a réussi
    """
    try:
        msg = MIMEMultipart()
        msg['From'] = CITADELLE_FROM_EMAIL
        msg['To'] = to_email
        msg['Subject'] = "Réinitialisation de votre mot de passe — La Citadelle Numérique"

        reset_link = f"{CITADELLE_URL}/citadelle/reinitialiser-mot-de-passe?token={reset_token}"

        body = f"""
Bonjour,

Vous avez demandé la réinitialisation de votre mot de passe sur La Citadelle Numérique.

Cliquez sur le lien suivant pour définir un nouveau mot de passe :

{reset_link}

⚠️ Ce lien est valable pendant 1 heure et ne peut être utilisé qu'une seule fois.

Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

La Citadelle Numérique
Marketplace française d'actifs numériques
{CITADELLE_URL}
        """

        msg.attach(MIMEText(body, 'plain', 'utf-8'))

        _envoyer_email(msg)

        logger.info(f"[Citadelle] Email de réinitialisation envoyé à {to_email}")
        return True

    except Exception as e:
        logger.error(f"[Citadelle] Erreur envoi email de réinitialisation: {e}")
        return False


def send_citadelle_admin_new_user_email(
    prenom: str,
    nom: str,
    email: str,
) -> bool:
    """Notifie l'admin qu'un nouvel utilisateur vient de créer un compte."""
    try:
        from config.settings import CITADELLE_ADMIN_EMAIL, CITADELLE_URL
        admin_url = f"{CITADELLE_URL}/syndicat-admin/citadelle/users"

        msg = MIMEMultipart("alternative")
        msg['From']    = CITADELLE_FROM_EMAIL
        msg['To']      = CITADELLE_ADMIN_EMAIL
        msg['Subject'] = f"[Nouveau membre] {prenom} {nom}"

        html = f"""<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#0f2747;padding:24px 32px;">
            <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#c9a45c;">La Garde · Membres</p>
            <h1 style="margin:0;font-size:20px;font-weight:900;color:#ffffff;">Nouveau membre inscrit</h1>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
              <tr><td style="padding:18px 22px;">
                <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c9a45c;">Profil</p>
                <p style="margin:0 0 10px;font-size:18px;font-weight:800;color:#0f2747;">{prenom} {nom}</p>
                <p style="margin:0;font-size:13px;color:#718096;">{email}</p>
              </td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="{admin_url}" style="display:inline-block;background:#c9a45c;color:#0f2747;font-size:14px;font-weight:800;text-decoration:none;padding:14px 36px;border-radius:8px;">
                  Voir les membres →
                </a>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#0f2747;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);">La Citadelle Numérique — Notification automatique</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""
        msg.attach(MIMEText(html, "html", "utf-8"))
        _envoyer_email(msg)
        logger.info(f"[Citadelle Admin] Notif nouveau membre envoyée à {CITADELLE_ADMIN_EMAIL}")
        return True
    except Exception as e:
        logger.error(f"[Citadelle Admin] Erreur notif nouveau membre: {e}")
        return False
