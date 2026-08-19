"""
Service d'envoi d'emails — Cœur (transport SMTP + helpers partagés).
"""

import smtplib
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
    EMAIL_BLOCKED_DOMAINS,
)

logger = logging.getLogger(__name__)


def is_sendable_email(email: str) -> bool:
    """
    Garde-fou anti-bounce : refuse les adresses vides ou dont le domaine figure
    dans EMAIL_BLOCKED_DOMAINS (adresses de test/factices). Évite les NDR quotidiens.
    """
    if not email or "@" not in email:
        return False
    domain = email.rsplit("@", 1)[-1].strip().lower()
    return domain not in EMAIL_BLOCKED_DOMAINS


def _envoyer_email(msg: MIMEMultipart) -> None:
    """
    Envoie un email via le bon compte SMTP selon l'expéditeur du message.
    - expéditeur == CITADELLE_FROM_EMAIL → credentials lagarde@lacitadellenumerique.fr
    - sinon → credentials Syndicat du Code (atelier@syndicatducode.fr)
    Le serveur SMTP est commun (Hostinger), seuls les credentials diffèrent.
    """
    to_email = msg.get("To", "")
    if not is_sendable_email(to_email):
        logger.warning(f"[Email] Envoi ignoré — destinataire de test/factice bloqué : {to_email}")
        return
    from_email = msg.get("From", "")
    if from_email == CITADELLE_FROM_EMAIL:
        user, password = CITADELLE_SMTP_USER, CITADELLE_SMTP_PASSWORD
    else:
        user, password = SMTP_USER, SMTP_PASSWORD
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
        server.login(user, password)
        server.send_message(msg)


def _build_notification_base(title: str, subtitle: str, badge_color: str, body_html: str, cta_url: str, cta_label: str) -> str:
    """
    Construit le squelette HTML commun à toutes les notifications vendeur.
    Design Citadelle : bleu marine #0F2747 / or #C9A45C.
    """
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>{title} — La Citadelle Numérique</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F4F8;font-family:Arial,Helvetica,sans-serif;">

  <table cellpadding="0" cellspacing="0" width="100%" style="background-color:#F0F4F8;padding:32px 16px;">
    <tr><td align="center">

      <table cellpadding="0" cellspacing="0" width="560"
             style="max-width:560px;width:100%;background:#FFFFFF;
                    border-radius:16px;overflow:hidden;
                    box-shadow:0 4px 32px rgba(15,39,71,0.12);">

        <!-- EN-TÊTE -->
        <tr>
          <td style="background:#0F2747;padding:32px 40px;text-align:center;">
            <table cellpadding="0" cellspacing="0" align="center" style="margin-bottom:16px;">
              <tr><td width="40" height="4" style="background:{badge_color};border-radius:2px;"></td></tr>
            </table>
            <p style="color:{badge_color};font-size:11px;font-weight:700;
                       text-transform:uppercase;letter-spacing:1.5px;margin:0 0 10px 0;">
              La Citadelle Num&#233;rique
            </p>
            <h1 style="color:#FFFFFF;font-size:20px;font-weight:700;margin:0;
                        font-family:Georgia,'Times New Roman',serif;line-height:1.3;">
              {title}
            </h1>
            <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:8px 0 0 0;">
              {subtitle}
            </p>
          </td>
        </tr>

        <!-- CORPS -->
        <tr>
          <td style="padding:32px 40px;">
            {body_html}
          </td>
        </tr>

        <!-- BOUTON CTA -->
        <tr>
          <td style="padding:0 40px 32px 40px;text-align:center;">
            <a href="{cta_url}"
               style="display:inline-block;padding:14px 36px;background:#0F2747;
                      color:#FFFFFF;text-decoration:none;border-radius:8px;
                      font-size:14px;font-weight:700;letter-spacing:0.3px;">
              {cta_label} &#8594;
            </a>
          </td>
        </tr>

        <!-- PIED DE PAGE -->
        <tr>
          <td style="background:#081729;padding:20px 40px;text-align:center;">
            <p style="color:rgba(255,255,255,0.35);font-size:11px;margin:0;">
              La Citadelle Num&#233;rique · Marketplace fran&#231;aise d&apos;actifs num&#233;riques
            </p>
          </td>
        </tr>

      </table>

    </td></tr>
  </table>

</body>
</html>"""




async def send_citadelle_email(to: str, subject: str, html_content: str) -> bool:
    """
    Envoie un email HTML générique au branding La Citadelle Numérique.
    Utilisé notamment pour les confirmations de paiement de services (Stripe).
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = CITADELLE_FROM_EMAIL
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(html_content, "html", "utf-8"))
        _envoyer_email(msg)
        logger.info(f"[Citadelle] Email envoyé à {to} — {subject}")
        return True
    except Exception as e:
        logger.error(f"[Citadelle] Erreur envoi email à {to} : {e}")
        return False
