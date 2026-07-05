"""
Emails Citadelle — Enchères.
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


def send_citadelle_auction_new_listing_email(
    recipient_email: str,
    listing_title: str,
    listing_slug: str,
    listing_price: float,
    auction_ends_at: str,
) -> bool:
    """Notifie un utilisateur/abonné newsletter qu'une nouvelle enchère a démarré."""
    try:
        from datetime import datetime, timezone
        from config.settings import CITADELLE_URL
        ends = datetime.fromisoformat(auction_ends_at)
        ends_str = ends.strftime("%d/%m/%Y à %Hh%M")
        listing_url = f"{CITADELLE_URL}/citadelle/annonces/{listing_slug}"

        msg = MIMEMultipart()
        msg['From'] = CITADELLE_FROM_EMAIL
        msg['To'] = recipient_email
        msg['Subject'] = f"[Enchère] {listing_title} — La Citadelle Numérique"

        body = f"""Nouvelle enchère sur La Citadelle Numérique !

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{listing_title}
Prix de départ : {listing_price:,.0f} €
Fin de l'enchère : {ends_str}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cet actif numérique vient d'être mis aux enchères sur La Citadelle Numérique.
Ne manquez pas cette opportunité — les enchères sont ouvertes !

Voir l'annonce et enchérir :
{listing_url}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
La Citadelle Numérique — Marketplace d'actifs numériques
{CITADELLE_URL}
"""
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        _envoyer_email(msg)
        return True
    except Exception as e:
        logger.error(f"[Citadelle Enchère] Erreur email nouvelle enchère: {e}")
        return False


def send_citadelle_auction_bid_email(
    bidder_email: str,
    bidder_name: str,
    listing_title: str,
    listing_slug: str,
    amount: float,
    auction_ends_at: str,
) -> bool:
    """Confirme une enchère à l'enchérisseur."""
    try:
        from datetime import datetime
        from config.settings import CITADELLE_URL
        ends = datetime.fromisoformat(auction_ends_at)
        ends_str = ends.strftime("%d/%m/%Y à %Hh%M")
        listing_url = f"{CITADELLE_URL}/citadelle/annonces/{listing_slug}"

        msg = MIMEMultipart()
        msg['From'] = CITADELLE_FROM_EMAIL
        msg['To'] = bidder_email
        msg['Subject'] = f"Votre enchère de {amount:,.0f} € — {listing_title}"

        body = f"""Bonjour {bidder_name},

Votre enchère a bien été enregistrée sur La Citadelle Numérique.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Annonce     : {listing_title}
Votre offre : {amount:,.0f} €
Fin         : {ends_str}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Vous serez averti si un autre enchérisseur dépasse votre offre.
Vous pouvez enchérir à nouveau à tout moment.

Voir l'annonce :
{listing_url}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
La Citadelle Numérique
"""
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        _envoyer_email(msg)
        return True
    except Exception as e:
        logger.error(f"[Citadelle Enchère] Erreur email confirmation enchère: {e}")
        return False


def send_citadelle_auction_winner_email(
    winner_email: str,
    winner_name: str,
    listing_title: str,
    listing_slug: str,
    amount: float,
    transaction_id: str,
) -> bool:
    """Félicite le gagnant de l'enchère et lui fournit le lien de paiement."""
    try:
        from config.settings import CITADELLE_URL
        payment_url = f"{CITADELLE_URL}/citadelle/espace-membre/transactions/{transaction_id}"

        msg = MIMEMultipart("alternative")
        msg['From'] = CITADELLE_FROM_EMAIL
        msg['To'] = winner_email
        msg['Subject'] = f"Félicitations ! Vous avez remporté l'enchère — {listing_title}"

        html = f"""<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        <!-- En-tête doré -->
        <tr>
          <td style="background:#0f2747;padding:32px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#c9a45c;">La Citadelle Numérique</p>
            <h1 style="margin:0;font-size:26px;font-weight:900;color:#ffffff;line-height:1.2;">
              Félicitations, vous avez<br>remporté l'enchère !
            </h1>
            <div style="margin:20px auto 0;width:48px;height:3px;background:#c9a45c;border-radius:2px;"></div>
          </td>
        </tr>

        <!-- Corps -->
        <tr>
          <td style="background:#ffffff;padding:40px 40px 32px;">
            <p style="margin:0 0 24px;font-size:16px;color:#4a5568;">
              Bonjour <strong style="color:#0f2747;">{winner_name}</strong>,
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:#4a5568;line-height:1.6;">
              La Garde de la Citadelle a le plaisir de vous informer que vous avez remporté l'enchère pour l'actif numérique suivant :
            </p>

            <!-- Bloc annonce -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c9a45c;">Actif remporté</p>
                  <p style="margin:0 0 16px;font-size:17px;font-weight:800;color:#0f2747;">{listing_title}</p>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-right:32px;">
                        <p style="margin:0;font-size:11px;color:#718096;text-transform:uppercase;letter-spacing:1px;">Montant remporté</p>
                        <p style="margin:4px 0 0;font-size:28px;font-weight:900;color:#0f2747;">{amount:,.0f} €</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 24px;font-size:15px;color:#4a5568;line-height:1.6;">
              Pour finaliser votre acquisition, procédez au paiement sécurisé depuis votre espace membre en cliquant sur le bouton ci-dessous :
            </p>

            <!-- Bouton paiement -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="{payment_url}"
                    style="display:inline-block;background:#c9a45c;color:#0f2747;font-size:16px;font-weight:800;text-decoration:none;padding:16px 40px;border-radius:10px;letter-spacing:0.5px;">
                    Procéder au paiement →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#a0aec0;text-align:center;line-height:1.6;">
              Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
              <a href="{payment_url}" style="color:#c9a45c;word-break:break-all;">{payment_url}</a>
            </p>
          </td>
        </tr>

        <!-- Pied de page -->
        <tr>
          <td style="background:#0f2747;padding:24px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.45);">
              © La Citadelle Numérique — Marketplace d'actifs numériques
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""

        msg.attach(MIMEText(html, "html", "utf-8"))
        _envoyer_email(msg)
        return True
    except Exception as e:
        logger.error(f"[Citadelle Enchère] Erreur email gagnant: {e}")
        return False


def send_citadelle_auction_bid_removed_email(
    bidder_email: str,
    bidder_name: str,
    listing_title: str,
    listing_slug: str,
    amount: float,
) -> bool:
    """Informe un enchérisseur que son enchère a été annulée par la modération."""
    try:
        from config.settings import CITADELLE_URL
        listing_url = f"{CITADELLE_URL}/citadelle/annonces/{listing_slug}"

        msg = MIMEMultipart()
        msg['From'] = CITADELLE_FROM_EMAIL
        msg['To'] = bidder_email
        msg['Subject'] = f"Votre enchère a été annulée — {listing_title}"

        body = f"""Bonjour {bidder_name},

Après vérification, notre équipe de modération a annulé votre enchère sur La Citadelle Numérique.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Annonce         : {listing_title}
Enchère annulée : {amount:,.0f} €
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cette décision peut faire suite à un signalement ou à une enchère jugée non conforme
(montant manifestement disproportionné, comportement suspect, etc.).

Si vous pensez qu'il s'agit d'une erreur, vous pouvez enchérir à nouveau de manière
cohérente ou contacter notre support.

Voir l'annonce :
{listing_url}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
La Citadelle Numérique
"""
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        _envoyer_email(msg)
        return True
    except Exception as e:
        logger.error(f"[Citadelle Enchère] Erreur email annulation enchère: {e}")
        return False


def send_citadelle_auction_daily_digest_email(
    seller_email: str,
    seller_name: str,
    listing_title: str,
    listing_slug: str,
    current_bid: float,
    nb_bids: int,
    auction_ends_at: str,
) -> bool:
    """Digest quotidien envoyé au vendeur avec l'état de son enchère."""
    try:
        from datetime import datetime
        from config.settings import CITADELLE_URL
        ends = datetime.fromisoformat(auction_ends_at)
        ends_str = ends.strftime("%d/%m/%Y à %Hh%M")
        listing_url = f"{CITADELLE_URL}/citadelle/annonces/{listing_slug}"

        msg = MIMEMultipart()
        msg['From'] = CITADELLE_FROM_EMAIL
        msg['To'] = seller_email
        msg['Subject'] = f"[Enchère] Résumé du jour — {listing_title}"

        body = f"""Bonjour {seller_name},

Voici le résumé quotidien de votre enchère en cours :

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{listing_title}
Enchère la plus haute : {current_bid:,.0f} €
Nombre d'enchères     : {nb_bids}
Fin de l'enchère      : {ends_str}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Voir votre annonce :
{listing_url}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
La Citadelle Numérique
"""
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        _envoyer_email(msg)
        return True
    except Exception as e:
        logger.error(f"[Citadelle Enchère] Erreur email digest vendeur: {e}")
        return False

    except Exception as e:
        logger.error(f"[Citadelle Contact] Erreur envoi email contact: {e}")
        return False


