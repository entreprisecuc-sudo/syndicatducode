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
from services.email_service.core import _envoyer_email, _build_notification_base

logger = logging.getLogger(__name__)


def _bloc_infos_html(rows: list, accent: str = "#C9A45C") -> str:
    """Rend un encart clé/valeur stylisé pour les emails d'enchère (DRY)."""
    lignes = "".join(
        f"""<tr>
              <td style="padding:6px 0;color:#718096;font-size:13px;">{k}</td>
              <td style="padding:6px 0;color:#0F2747;font-size:14px;font-weight:700;text-align:right;">{v}</td>
            </tr>"""
        for k, v in rows
    )
    return f"""
      <table cellpadding="0" cellspacing="0" width="100%" style="background:#F8FAFC;border:1px solid #E2E8F0;border-left:3px solid {accent};border-radius:10px;margin:16px 0;">
        <tr><td style="padding:14px 18px;">
          <table cellpadding="0" cellspacing="0" width="100%">{lignes}</table>
        </td></tr>
      </table>"""


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

        body_html = f"""
            <p style="color:#0F2747;font-size:15px;line-height:1.6;margin:0 0 8px 0;">Bonjour {bidder_name},</p>
            <p style="color:#4A5568;font-size:14px;line-height:1.7;margin:0;">
              Votre ench&#232;re a bien &#233;t&#233; enregistr&#233;e. Vous serez averti si un autre
              ench&#233;risseur d&#233;passe votre offre — vous pourrez alors surench&#233;rir &#224; tout moment.
            </p>
            {_bloc_infos_html([("Annonce", listing_title), ("Votre offre", f"{amount:,.0f} &#8364;"), ("Fin de l'enchère", ends_str)])}
        """
        html = _build_notification_base(
            title="Votre ench&#232;re est enregistr&#233;e",
            subtitle=listing_title,
            badge_color="#C9A45C",
            body_html=body_html,
            cta_url=listing_url,
            cta_label="Voir l'annonce",
        )
        texte = (f"Bonjour {bidder_name},\n\nVotre enchère de {amount:,.0f} € sur « {listing_title} » "
                 f"a bien été enregistrée. Fin : {ends_str}.\nVoir l'annonce : {listing_url}\n\nLa Citadelle Numérique")

        msg = MIMEMultipart("alternative")
        msg['From'] = CITADELLE_FROM_EMAIL
        msg['To'] = bidder_email
        msg['Subject'] = f"Votre enchère de {amount:,.0f} € — {listing_title}"
        msg.attach(MIMEText(texte, 'plain', 'utf-8'))
        msg.attach(MIMEText(html, 'html', 'utf-8'))
        _envoyer_email(msg)
        return True
    except Exception as e:
        logger.error(f"[Citadelle Enchère] Erreur email confirmation enchère: {e}")
        return False


def send_citadelle_auction_outbid_email(
    bidder_email: str,
    bidder_name: str,
    listing_title: str,
    listing_slug: str,
    previous_amount: float,
    new_amount: float,
    auction_ends_at: str,
) -> bool:
    """Prévient un enchérisseur qu'il vient d'être surenchéri."""
    try:
        from datetime import datetime
        from config.settings import CITADELLE_URL
        ends_str = ""
        try:
            ends_str = datetime.fromisoformat(auction_ends_at).strftime("%d/%m/%Y à %Hh%M")
        except Exception:
            ends_str = "—"
        listing_url = f"{CITADELLE_URL}/citadelle/annonces/{listing_slug}"

        body_html = f"""
            <p style="color:#0F2747;font-size:15px;line-height:1.6;margin:0 0 8px 0;">Bonjour {bidder_name},</p>
            <p style="color:#4A5568;font-size:14px;line-height:1.7;margin:0;">
              Un autre ench&#233;risseur vient de <strong style="color:#0F2747;">d&#233;passer votre offre</strong>
              sur cet actif. Ne laissez pas filer la perle rare — vous pouvez surench&#233;rir d&#232;s maintenant.
            </p>
            {_bloc_infos_html([("Annonce", listing_title), ("Votre offre", f"{previous_amount:,.0f} &#8364;"), ("Enchère actuelle", f"{new_amount:,.0f} &#8364;"), ("Fin de l'enchère", ends_str)], accent="#F59E0B")}
        """
        html = _build_notification_base(
            title="Vous avez &#233;t&#233; surench&#233;ri",
            subtitle=listing_title,
            badge_color="#F59E0B",
            body_html=body_html,
            cta_url=listing_url,
            cta_label="Surench&#233;rir maintenant",
        )
        texte = (f"Bonjour {bidder_name},\n\nVous avez été surenchéri sur « {listing_title} ». "
                 f"Votre offre : {previous_amount:,.0f} € — Enchère actuelle : {new_amount:,.0f} €. Fin : {ends_str}.\n"
                 f"Surenchérir : {listing_url}\n\nLa Citadelle Numérique")

        msg = MIMEMultipart("alternative")
        msg['From'] = CITADELLE_FROM_EMAIL
        msg['To'] = bidder_email
        msg['Subject'] = f"Vous avez été surenchéri — {listing_title}"
        msg.attach(MIMEText(texte, 'plain', 'utf-8'))
        msg.attach(MIMEText(html, 'html', 'utf-8'))
        _envoyer_email(msg)
        return True
    except Exception as e:
        logger.error(f"[Citadelle Enchère] Erreur email surenchéri: {e}")
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

        body_html = f"""
            <p style="color:#0F2747;font-size:15px;line-height:1.6;margin:0 0 8px 0;">Bonjour {bidder_name},</p>
            <p style="color:#4A5568;font-size:14px;line-height:1.7;margin:0 0 8px 0;">
              Apr&#232;s v&#233;rification, notre &#233;quipe de mod&#233;ration a <strong style="color:#0F2747;">annul&#233; votre ench&#232;re</strong>.
              Cette d&#233;cision peut faire suite &#224; un signalement ou &#224; une ench&#232;re jug&#233;e non conforme
              (montant manifestement disproportionn&#233;, comportement suspect, etc.).
            </p>
            <p style="color:#4A5568;font-size:14px;line-height:1.7;margin:0;">
              Si vous pensez qu'il s'agit d'une erreur, vous pouvez ench&#233;rir &#224; nouveau de mani&#232;re coh&#233;rente.
            </p>
            {_bloc_infos_html([("Annonce", listing_title), ("Enchère annulée", f"{amount:,.0f} &#8364;")], accent="#DC2626")}
        """
        html = _build_notification_base(
            title="Votre ench&#232;re a &#233;t&#233; annul&#233;e",
            subtitle=listing_title,
            badge_color="#DC2626",
            body_html=body_html,
            cta_url=listing_url,
            cta_label="Voir l'annonce",
        )
        texte = (f"Bonjour {bidder_name},\n\nVotre enchère de {amount:,.0f} € sur « {listing_title} » "
                 f"a été annulée par la modération.\nVoir l'annonce : {listing_url}\n\nLa Citadelle Numérique")

        msg = MIMEMultipart("alternative")
        msg['From'] = CITADELLE_FROM_EMAIL
        msg['To'] = bidder_email
        msg['Subject'] = f"Votre enchère a été annulée — {listing_title}"
        msg.attach(MIMEText(texte, 'plain', 'utf-8'))
        msg.attach(MIMEText(html, 'html', 'utf-8'))
        _envoyer_email(msg)
        return True
    except Exception as e:
        logger.error(f"[Citadelle Enchère] Erreur email annulation enchère: {e}")
        return False


def send_citadelle_second_chance_seller_request_email(
    seller_email: str,
    listing_title: str,
    next_amount: float,
    transaction_id: str,
) -> bool:
    """Demande au vendeur s'il souhaite proposer l'actif à l'enchérisseur suivant (dernière chance)."""
    try:
        from config.settings import CITADELLE_URL
        tx_url = f"{CITADELLE_URL}/citadelle/espace-membre/transactions/{transaction_id}"

        msg = MIMEMultipart()
        msg['From'] = CITADELLE_FROM_EMAIL
        msg['To'] = seller_email
        msg['Subject'] = f"[Enchère] Proposer une seconde chance — {listing_title}"

        body = f"""Bonjour,

La vente aux enchères de votre actif n'a pas abouti (l'enchérisseur gagnant ne l'a pas finalisée).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Annonce                : {listing_title}
Enchérisseur suivant   : {next_amount:,.0f} €
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

La Garde de la Citadelle vous propose d'offrir une DERNIÈRE CHANCE à l'enchérisseur suivant,
au montant de son enchère ({next_amount:,.0f} €).

Rien n'est déclenché tant que vous n'avez pas confirmé. Rendez-vous sur votre transaction
pour accepter ou refuser cette proposition :
{tx_url}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
La Citadelle Numérique
"""
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        _envoyer_email(msg)
        return True
    except Exception as e:
        logger.error(f"[Citadelle Enchère] Erreur email demande seconde chance vendeur: {e}")
        return False


def send_citadelle_second_chance_offer_email(
    bidder_email: str,
    bidder_name: str,
    listing_title: str,
    listing_slug: str,
    amount: float,
    transaction_id: str,
) -> bool:
    """Offre 'dernière chance' à l'enchérisseur suivant après validation du vendeur."""
    try:
        from config.settings import CITADELLE_URL
        payment_url = f"{CITADELLE_URL}/citadelle/espace-membre/transactions/{transaction_id}"

        body_html = f"""
            <p style="color:#0F2747;font-size:15px;line-height:1.6;margin:0 0 8px 0;">Bonjour {bidder_name},</p>
            <p style="color:#4A5568;font-size:14px;line-height:1.7;margin:0;">
              Bonne nouvelle : l'ench&#233;risseur gagnant n'a pas finalis&#233; son achat.
              La Citadelle vous offre une <strong style="color:#0F2747;">DERNI&#200;RE CHANCE</strong> d'acqu&#233;rir cet actif
              au montant de votre ench&#232;re. Cette offre est prioritaire — ne tardez pas.
            </p>
            {_bloc_infos_html([("Annonce", listing_title), ("Votre prix", f"{amount:,.0f} &#8364;")])}
        """
        html = _build_notification_base(
            title="Derni&#232;re chance !",
            subtitle=listing_title,
            badge_color="#C9A45C",
            body_html=body_html,
            cta_url=payment_url,
            cta_label="Finaliser mon achat",
        )
        texte = (f"Bonjour {bidder_name},\n\nDernière chance : l'actif « {listing_title} » vous est proposé "
                 f"à {amount:,.0f} €.\nFinaliser : {payment_url}\n\nLa Citadelle Numérique")

        msg = MIMEMultipart("alternative")
        msg['From'] = CITADELLE_FROM_EMAIL
        msg['To'] = bidder_email
        msg['Subject'] = f"Dernière chance ! L'actif « {listing_title} » vous est proposé"
        msg.attach(MIMEText(texte, 'plain', 'utf-8'))
        msg.attach(MIMEText(html, 'html', 'utf-8'))
        _envoyer_email(msg)
        return True
    except Exception as e:
        logger.error(f"[Citadelle Enchère] Erreur email offre seconde chance: {e}")
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


