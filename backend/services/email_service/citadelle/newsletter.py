"""
Emails Citadelle — Newsletter (digest + builders).
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


_LISTING_TYPE_LABELS = {
    "website": "Site internet",
    "ecommerce": "E-commerce",
    "saas": "SaaS",
    "webapp": "Application web",
    "social_account": "Réseau social",
    "domain": "Nom de domaine",
}

# Libellés de période pour le sous-titre de l'email
_PERIOD_LABELS = {
    7: "Digest hebdomadaire",
    14: "Digest bi-hebdomadaire",
    30: "Digest mensuel",
}


def _get_listing_image_url_for_email(listing: dict) -> str | None:
    """
    Construit l'URL absolue de la première image d'une annonce pour les emails.
    Les chemins relatifs (/uploads/...) sont préfixés avec BACKEND_PUBLIC_URL/api.
    """
    images = listing.get("images") or []
    if not images:
        return None
    path = images[0]
    if not path:
        return None
    if path.startswith("http://") or path.startswith("https://"):
        return path
    if path.startswith("/uploads/"):
        return f"{BACKEND_PUBLIC_URL}/api{path}"
    return f"{BACKEND_PUBLIC_URL}/{path.lstrip('/')}"


def _build_listing_row(listing: dict, history_id: str = None) -> str:
    """Génère les lignes HTML (table rows) pour une annonce dans l'email.

    Args:
        listing: Données de l'annonce
        history_id: Si fourni, les liens sont wrappés via le tracker de clics
    """
    type_label = _LISTING_TYPE_LABELS.get(listing.get("type", ""), "Actif numérique")
    price = listing.get("price")
    price_str = f"{price:,.0f}&nbsp;€".replace(",", "\u202f") if price else "Prix sur demande"
    title = listing.get("title", "")
    slug = listing.get("slug") or listing.get("id", "")
    listing_url = f"{CITADELLE_URL}/citadelle/annonces/{slug}"

    # Wrapper de clic si tracking activé
    if history_id:
        from urllib.parse import quote
        tracked_url = f"{BACKEND_PUBLIC_URL}/api/citadelle/newsletter/click/{history_id}?url={quote(listing_url, safe='')}"
    else:
        tracked_url = listing_url

    image_url = _get_listing_image_url_for_email(listing)
    short_desc = (listing.get("short_description") or "")[:120]
    if len(listing.get("short_description") or "") > 120:
        short_desc += "…"

    # Cellule image ou placeholder coloré
    if image_url:
        img_cell = (
            f'<img src="{image_url}" width="96" height="72" '
            f'style="border-radius:8px;object-fit:cover;display:block;border:0;" alt="">'
        )
    else:
        img_cell = (
            '<table cellpadding="0" cellspacing="0" width="96" height="72" '
            'style="background:#0F2747;border-radius:8px;">'
            '<tr><td align="center" valign="middle" '
            'style="color:rgba(201,164,92,0.4);font-size:22px;">&#9670;</td></tr></table>'
        )

    desc_row = ""
    if short_desc:
        desc_row = (
            f'<p style="margin:0 0 10px 0;font-size:13px;color:#5F6672;line-height:1.5;">'
            f"{short_desc}</p>"
        )

    return f"""
        <!-- Listing -->
        <tr>
          <td style="padding:20px 40px;">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td width="96" valign="top" style="padding-right:16px;">{img_cell}</td>
                <td valign="top">
                  <p style="margin:0 0 4px 0;font-size:11px;color:#C9A45C;font-weight:700;
                             text-transform:uppercase;letter-spacing:0.8px;">{type_label}</p>
                  <h3 style="margin:0 0 6px 0;font-size:15px;color:#0F2747;font-weight:700;
                              line-height:1.3;">{title}</h3>
                  {desc_row}
                  <p style="margin:0 0 12px 0;font-size:18px;color:#0F2747;font-weight:800;">{price_str}</p>
                  <a href="{tracked_url}"
                     style="display:inline-block;padding:8px 20px;background:#C9A45C;
                            color:#081729;text-decoration:none;border-radius:6px;
                            font-size:12px;font-weight:700;">Voir l'annonce &#8594;</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>"""


def build_newsletter_html(
    listings: list,
    unsubscribe_token: str,
    period_days: int,
    is_preview: bool = False,
    history_id: str = None,
) -> str:
    """
    Construit le HTML complet de l'email newsletter.

    Args:
        listings: Liste de dicts annonces (id, title, type, price, images, slug, short_description)
        unsubscribe_token: Token unique de désinscription de l'abonné
        period_days: Nombre de jours couverts (7, 14 ou 30)
        is_preview: Si True, le lien de désinscription est remplacé par un message admin
        history_id: Si fourni, active le tracking pixel + liens de clic

    Returns:
        Chaîne HTML complète de l'email
    """
    count = len(listings)
    count_label = "1 nouvelle annonce" if count == 1 else f"{count} nouvelles annonces"
    period_label = _PERIOD_LABELS.get(period_days, f"Derniers {period_days} jours")

    # Lignes des annonces (avec tracking si history_id fourni)
    listing_rows = ""
    for i, listing in enumerate(listings):
        listing_rows += _build_listing_row(listing, history_id=history_id)
        if i < len(listings) - 1:
            listing_rows += """
        <tr>
          <td style="padding:0 40px;">
            <div style="height:1px;background:#F0F3F7;"></div>
          </td>
        </tr>"""

    # Section désinscription
    if is_preview:
        unsubscribe_section = (
            '<p style="color:#C9A45C;font-size:11px;margin:0;font-style:italic;">'
            "[Aperçu admin — Lien de désinscription non fonctionnel en prévisualisation]</p>"
        )
    else:
        unsubscribe_url = (
            f"{CITADELLE_URL}/api/citadelle/newsletter/unsubscribe/{unsubscribe_token}"
        )
        unsubscribe_section = (
            '<p style="color:rgba(255,255,255,0.35);font-size:11px;margin:0;line-height:1.8;">'
            "Vous recevez cet email car vous êtes abonné aux alertes annonces<br>"
            f'de La Citadelle Numérique. <a href="{unsubscribe_url}" '
            'style="color:#C9A45C;text-decoration:underline;">Se désinscrire</a></p>'
        )

    # Pixel de tracking (invisible, inséré juste avant </body> si history_id fourni)
    tracking_pixel = ""
    if history_id and not is_preview:
        pixel_url = f"{BACKEND_PUBLIC_URL}/api/citadelle/newsletter/pixel/{history_id}"
        tracking_pixel = (
            f'<img src="{pixel_url}" width="1" height="1" alt="" '
            f'style="display:none;visibility:hidden;width:1px;height:1px;" />'
        )

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Nouvelles annonces — La Citadelle Numérique</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F4F8;font-family:Arial,Helvetica,sans-serif;">

  <!-- Wrapper principal -->
  <table cellpadding="0" cellspacing="0" width="100%"
         style="background-color:#F0F4F8;padding:32px 16px;">
    <tr><td align="center">

      <!-- Carte email (max 600px) -->
      <table cellpadding="0" cellspacing="0" width="600"
             style="max-width:600px;width:100%;background:#FFFFFF;
                    border-radius:16px;overflow:hidden;
                    box-shadow:0 4px 32px rgba(15,39,71,0.12);">

        <!-- ── EN-TÊTE ── -->
        <tr>
          <td style="background:#0F2747;padding:40px;text-align:center;">
            <!-- Barre dorée décorative -->
            <table cellpadding="0" cellspacing="0" align="center" style="margin-bottom:20px;">
              <tr><td width="48" height="4" style="background:#C9A45C;border-radius:2px;"></td></tr>
            </table>
            <h1 style="color:#C9A45C;font-size:26px;font-weight:800;margin:0 0 8px 0;
                        font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.5px;">
              La Citadelle Num&#233;rique
            </h1>
            <p style="color:rgba(255,255,255,0.55);font-size:12px;margin:0;
                       text-transform:uppercase;letter-spacing:1.5px;">
              {period_label}
            </p>
          </td>
        </tr>

        <!-- ── INTRODUCTION ── -->
        <tr>
          <td style="padding:32px 40px 20px;text-align:center;">
            <h2 style="color:#0F2747;font-size:20px;font-weight:700;margin:0 0 10px 0;">
              {count_label}
            </h2>
            <p style="color:#5F6672;font-size:14px;line-height:1.6;margin:0;">
              Voici les derniers actifs num&#233;riques disponibles
              sur La Citadelle Num&#233;rique.
            </p>
          </td>
        </tr>

        <!-- Séparateur -->
        <tr>
          <td style="padding:0 40px;">
            <div style="height:2px;background:linear-gradient(to right,#0F2747,#C9A45C,#0F2747);
                         opacity:0.2;"></div>
          </td>
        </tr>

        <!-- ── ANNONCES ── -->
        {listing_rows}

        <!-- Séparateur -->
        <tr>
          <td style="padding:0 40px;">
            <div style="height:2px;background:linear-gradient(to right,#0F2747,#C9A45C,#0F2747);
                         opacity:0.2;"></div>
          </td>
        </tr>

        <!-- ── BOUTON CTA ── -->
        <tr>
          <td style="padding:28px 40px;text-align:center;">
            <a href="{CITADELLE_URL}/citadelle/annonces"
               style="display:inline-block;padding:14px 36px;background:#0F2747;
                      color:#FFFFFF;text-decoration:none;border-radius:8px;
                      font-size:14px;font-weight:700;letter-spacing:0.3px;">
              Voir toutes les annonces &#8594;
            </a>
          </td>
        </tr>

        <!-- ── PIED DE PAGE ── -->
        <tr>
          <td style="background:#081729;padding:28px 40px;text-align:center;">
            <p style="color:rgba(255,255,255,0.45);font-size:12px;margin:0 0 12px 0;
                       font-weight:600;letter-spacing:0.5px;">
              La Citadelle Num&#233;rique
            </p>
            <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:0 0 16px 0;">
              Marketplace fran&#231;aise d&apos;actifs num&#233;riques
            </p>
            {unsubscribe_section}
          </td>
        </tr>

      </table>
      <!-- Fin carte email -->

    </td></tr>
  </table>
  <!-- Fin wrapper -->

  {tracking_pixel}

</body>
</html>"""


def send_newsletter_digest_email(
    to_email: str,
    listings: list,
    unsubscribe_token: str,
    period_days: int,
    history_id: str = None,
) -> bool:
    """
    Envoie l'email digest newsletter à un abonné.

    Args:
        to_email: Adresse email du destinataire
        listings: Liste des annonces à inclure
        unsubscribe_token: Token unique de désinscription
        period_days: Nombre de jours couverts (pour le libellé de période)
        history_id: Si fourni, active le tracking ouverture/clic dans l'email
    """
    try:
        html_content = build_newsletter_html(
            listings=listings,
            unsubscribe_token=unsubscribe_token,
            period_days=period_days,
            is_preview=False,
            history_id=history_id,
        )

        msg = MIMEMultipart("alternative")
        msg["From"] = CITADELLE_FROM_EMAIL
        msg["To"] = to_email
        count = len(listings)
        subject_listing = "1 nouvelle annonce" if count == 1 else f"{count} nouvelles annonces"
        msg["Subject"] = f"{subject_listing} disponibles — La Citadelle Numérique"

        msg.attach(MIMEText(html_content, "html", "utf-8"))

        _envoyer_email(msg)

        logger.info(f"[Newsletter] Email digest envoyé à {to_email}")
        return True

    except Exception as e:
        logger.error(f"[Newsletter] Erreur envoi à {to_email} : {e}")
        return False



# ─────────────────────────────────────────────────────────────────────────────
# NOTIFICATIONS VENDEUR — Messages et Offres
# ─────────────────────────────────────────────────────────────────────────────

