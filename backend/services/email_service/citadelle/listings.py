"""
Emails Citadelle — Annonces (validation, rejet, notification admin).
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


def send_citadelle_listing_approved_email(to_email: str, listing_title: str, listing_slug: str) -> bool:
    """
    Notifie le vendeur que son annonce a été validée et est en ligne.

    Args:
        to_email: Email du vendeur
        listing_title: Titre de l'annonce
        listing_slug: Slug pour construire le lien public
    """
    try:
        msg = MIMEMultipart()
        msg['From'] = CITADELLE_FROM_EMAIL
        msg['To'] = to_email
        msg['Subject'] = f"Votre annonce est en ligne — La Citadelle Numérique"

        listing_url = f"{CITADELLE_URL}/citadelle/annonces/{listing_slug}"

        body = f"""
Bonjour,

Bonne nouvelle ! Votre annonce a été validée par notre équipe et est maintenant visible sur La Citadelle Numérique.

📋 Annonce : {listing_title}
🔗 Lien public : {listing_url}

Les acheteurs peuvent désormais la découvrir et vous contacter directement.

Bon courage pour votre vente !

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

La Citadelle Numérique
Marketplace française d'actifs numériques
{CITADELLE_URL}
        """

        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        _envoyer_email(msg)

        logger.info(f"[Citadelle] Email validation envoyé à {to_email} pour annonce: {listing_title[:40]}")
        return True

    except Exception as e:
        logger.error(f"[Citadelle] Erreur email validation annonce: {e}")
        return False


def send_citadelle_listing_rejected_email(to_email: str, listing_title: str, reason: str) -> bool:
    """
    Notifie le vendeur que son annonce a été refusée avec le motif détaillé.

    Args:
        to_email: Email du vendeur
        listing_title: Titre de l'annonce
        reason: Motif du refus saisi par l'admin
    """
    try:
        msg = MIMEMultipart()
        msg['From'] = CITADELLE_FROM_EMAIL
        msg['To'] = to_email
        msg['Subject'] = f"Votre annonce nécessite des modifications — La Citadelle Numérique"

        dashboard_url = f"{CITADELLE_URL}/citadelle/espace-membre/mes-annonces"

        body = f"""
Bonjour,

Nous avons examiné votre annonce et elle ne peut pas être publiée en l'état.

📋 Annonce : {listing_title}

❌ Motif du refus / modifications demandées :
{reason}

Vous pouvez modifier votre annonce depuis votre espace membre et la soumettre à nouveau :
{dashboard_url}

Notre équipe la réexaminera dans les plus brefs délais.

N'hésitez pas à nous contacter si vous avez des questions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

La Citadelle Numérique
Marketplace française d'actifs numériques
{CITADELLE_URL}
        """

        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        _envoyer_email(msg)

        logger.info(f"[Citadelle] Email refus annonce envoyé à {to_email}: {listing_title[:40]}")
        return True

    except Exception as e:
        logger.error(f"[Citadelle] Erreur email refus annonce: {e}")
        return False


def send_citadelle_admin_new_listing_email(
    seller_email: str,
    listing_title: str,
    listing_type: str,
    listing_price: float,
    is_auction: bool = False,
) -> bool:
    """Notifie l'admin qu'une nouvelle annonce vient d'être soumise et attend modération."""
    try:
        from config.settings import CITADELLE_ADMIN_EMAIL, CITADELLE_URL
        admin_url = f"{CITADELLE_URL}/syndicat-admin/citadelle/listings"
        mode = "ENCHÈRE" if is_auction else "Vente directe"

        msg = MIMEMultipart("alternative")
        msg['From']    = CITADELLE_FROM_EMAIL
        msg['To']      = CITADELLE_ADMIN_EMAIL
        msg['Subject'] = f"[Nouvelle annonce] {listing_title}"

        html = f"""<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#0f2747;padding:24px 32px;">
            <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#c9a45c;">La Garde · Modération</p>
            <h1 style="margin:0;font-size:20px;font-weight:900;color:#ffffff;">Nouvelle annonce à valider</h1>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
              <tr><td style="padding:18px 22px;">
                <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c9a45c;">Annonce soumise</p>
                <p style="margin:0 0 12px;font-size:16px;font-weight:800;color:#0f2747;">{listing_title}</p>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:24px;">
                      <p style="margin:0;font-size:10px;color:#718096;text-transform:uppercase;letter-spacing:1px;">Type</p>
                      <p style="margin:2px 0 0;font-size:14px;font-weight:700;color:#0f2747;">{listing_type}</p>
                    </td>
                    <td style="padding-right:24px;">
                      <p style="margin:0;font-size:10px;color:#718096;text-transform:uppercase;letter-spacing:1px;">Prix</p>
                      <p style="margin:2px 0 0;font-size:14px;font-weight:700;color:#0f2747;">{listing_price:,.0f} €</p>
                    </td>
                    <td>
                      <p style="margin:0;font-size:10px;color:#718096;text-transform:uppercase;letter-spacing:1px;">Mode</p>
                      <p style="margin:2px 0 0;font-size:14px;font-weight:700;color:{'#c9a45c' if is_auction else '#0f2747'};">{mode}</p>
                    </td>
                  </tr>
                </table>
                <p style="margin:12px 0 0;font-size:12px;color:#718096;">Vendeur : {seller_email}</p>
              </td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="{admin_url}" style="display:inline-block;background:#c9a45c;color:#0f2747;font-size:14px;font-weight:800;text-decoration:none;padding:14px 36px;border-radius:8px;">
                  Modérer l'annonce →
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
        logger.info(f"[Citadelle Admin] Notif nouvelle annonce envoyée à {CITADELLE_ADMIN_EMAIL}")
        return True
    except Exception as e:
        logger.error(f"[Citadelle Admin] Erreur notif nouvelle annonce: {e}")
        return False


