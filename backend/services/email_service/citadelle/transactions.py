"""
Emails Citadelle — Transactions (accès, messages, offres, relances).
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
from services.email_service.citadelle.newsletter import _get_listing_image_url_for_email

logger = logging.getLogger(__name__)


def send_citadelle_credentials_email(to_email: str, listing_title: str, credentials_data: str, amount: float) -> bool:
    """
    Envoie les accès de l'actif numérique à l'acheteur par email sécurisé.
    Déclenché par l'admin après vérification.
    """
    try:
        msg = MIMEMultipart()
        msg['From'] = CITADELLE_FROM_EMAIL
        msg['To'] = to_email
        msg['Subject'] = f"Vos accès sécurisés — {listing_title} — La Citadelle Numérique"

        body = f"""Bonjour,

La vente de l'actif « {listing_title} » a été finalisée avec succès.

Montant de la transaction : {amount:,.0f} €

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  VOS ACCÈS SÉCURISÉS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{credentials_data}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT :
- Conservez ces informations en lieu sûr.
- Modifiez les mots de passe dès que possible.
- Ne partagez jamais ces accès avec des tiers.

Ces accès sont également disponibles dans votre espace membre sur La Citadelle Numérique.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

La Citadelle Numérique
Marketplace française d'actifs numériques
{CITADELLE_URL}
"""

        msg.attach(MIMEText(body, 'plain', 'utf-8'))

        _envoyer_email(msg)

        logger.info(f"[Citadelle] Email accès sécurisés envoyé à {to_email} pour « {listing_title} »")
        return True

    except Exception as e:
        logger.error(f"[Citadelle] Erreur envoi email accès: {e}")
        return False



# ─────────────────────────────────────────────────────────────────────────────
# NEWSLETTER — Digest hebdomadaire d'annonces
# ─────────────────────────────────────────────────────────────────────────────

# Mapping slug → libellé français des types d'annonces
def send_new_message_notification_email(
    recipient_email: str,
    listing_title: str,
    sender_email: str,
    message_preview: str,
    conversation_id: str,
) -> bool:
    """
    Notifie un participant (acheteur OU vendeur) qu'il a reçu un nouveau message.
    Utilisé lors de l'envoi et des réponses dans une conversation.

    Args:
        recipient_email: Email du destinataire (celui qui n'a pas encore lu)
        listing_title:   Titre de l'annonce concernée
        sender_email:    Email de l'expéditeur du message
        message_preview: Début du message (tronqué à 200 chars)
        conversation_id: ID de la conversation (pour le lien CTA)
    """
    try:
        preview = (message_preview[:200] + "…") if len(message_preview) > 200 else message_preview
        conversation_url = f"{CITADELLE_URL}/citadelle/espace-membre/messages/{conversation_id}"

        body_html = f"""
        <p style="color:#1A2A3A;font-size:15px;line-height:1.6;margin:0 0 20px 0;">
          Vous avez re&#231;u un nouveau message concernant votre annonce&#160;:
        </p>

        <!-- Titre annonce -->
        <div style="background:#F7F9FC;border-left:4px solid #C9A45C;
                    border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:20px;">
          <p style="color:#C9A45C;font-size:11px;font-weight:700;
                     text-transform:uppercase;letter-spacing:0.8px;margin:0 0 4px 0;">Annonce</p>
          <p style="color:#0F2747;font-size:15px;font-weight:700;margin:0;">{listing_title}</p>
        </div>

        <!-- Expéditeur + message -->
        <div style="background:#F7F9FC;border-radius:10px;padding:16px 18px;margin-bottom:24px;">
          <p style="color:#5F6672;font-size:12px;margin:0 0 8px 0;">
            <strong style="color:#0F2747;">{sender_email}</strong> vous &#233;crit&#160;:
          </p>
          <p style="color:#374151;font-size:14px;line-height:1.6;margin:0;font-style:italic;">
            &#8220;{preview}&#8221;
          </p>
        </div>

        <p style="color:#5F6672;font-size:13px;line-height:1.6;margin:0;">
          R&#233;pondez rapidement pour ne pas laisser votre interlocuteur sans nouvelles.
        </p>"""

        html = _build_notification_base(
            title="Nouveau message re&#231;u",
            subtitle=f"Concernant : {listing_title}",
            badge_color="#C9A45C",
            body_html=body_html,
            cta_url=conversation_url,
            cta_label="R&#233;pondre maintenant",
        )

        msg = MIMEMultipart("alternative")
        msg["From"] = CITADELLE_FROM_EMAIL
        msg["To"] = recipient_email
        msg["Subject"] = f"[Citadelle] Nouveau message sur votre annonce : {listing_title}"

        msg.attach(MIMEText(html, "html", "utf-8"))
        _envoyer_email(msg)

        logger.info(f"[Notif] Email nouveau message envoyé à {recipient_email} pour annonce '{listing_title}'")
        return True

    except Exception as e:
        logger.error(f"[Notif] Erreur envoi notification message à {recipient_email} : {e}")
        return False


def send_new_offer_notification_email(
    seller_email: str,
    listing_title: str,
    offer_amount: float,
    buyer_email: str,
    offer_message_preview: str,
    transaction_id: str,
) -> bool:
    """
    Notifie le vendeur qu'il vient de recevoir une offre d'achat.

    Args:
        seller_email: Email du vendeur
        listing_title: Titre de l'annonce
        offer_amount: Montant de l'offre en euros
        buyer_email: Email de l'acheteur
        offer_message_preview: Message joint à l'offre (tronqué à 200 chars)
        transaction_id: ID de la transaction pour le lien CTA
    """
    try:
        preview = (offer_message_preview[:200] + "…") if len(offer_message_preview) > 200 else offer_message_preview
        transaction_url = f"{CITADELLE_URL}/citadelle/espace-membre/transactions/{transaction_id}"
        amount_str = f"{offer_amount:,.0f}".replace(",", "\u202f")

        body_html = f"""
        <p style="color:#1A2A3A;font-size:15px;line-height:1.6;margin:0 0 20px 0;">
          Vous avez re&#231;u une offre d&apos;achat sur votre annonce&#160;:
        </p>

        <!-- Titre annonce -->
        <div style="background:#F7F9FC;border-left:4px solid #C9A45C;
                    border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:20px;">
          <p style="color:#C9A45C;font-size:11px;font-weight:700;
                     text-transform:uppercase;letter-spacing:0.8px;margin:0 0 4px 0;">Annonce</p>
          <p style="color:#0F2747;font-size:15px;font-weight:700;margin:0;">{listing_title}</p>
        </div>

        <!-- Montant mis en valeur -->
        <div style="background:#0F2747;border-radius:12px;padding:20px 24px;
                    text-align:center;margin-bottom:20px;">
          <p style="color:rgba(255,255,255,0.6);font-size:12px;
                     text-transform:uppercase;letter-spacing:1px;margin:0 0 6px 0;">
            Montant propos&#233;
          </p>
          <p style="color:#C9A45C;font-size:36px;font-weight:800;margin:0;
                     font-family:Georgia,'Times New Roman',serif;">
            {amount_str}&nbsp;&#8364;
          </p>
          <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:8px 0 0 0;">
            par <strong style="color:rgba(255,255,255,0.8);">{buyer_email}</strong>
          </p>
        </div>

        <!-- Message de l'offre -->
        {f'''<div style="background:#F7F9FC;border-radius:10px;padding:16px 18px;margin-bottom:20px;">
          <p style="color:#5F6672;font-size:12px;margin:0 0 8px 0;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Message joint à l&apos;offre</p>
          <p style="color:#374151;font-size:14px;line-height:1.6;margin:0;font-style:italic;">
            &#8220;{preview}&#8221;
          </p>
        </div>''' if preview else ''}

        <p style="color:#5F6672;font-size:13px;line-height:1.6;margin:0;">
          Acceptez, refusez ou faites une contre-offre directement depuis votre espace membre.
        </p>"""

        html = _build_notification_base(
            title="Nouvelle offre re&#231;ue",
            subtitle=f"Sur : {listing_title}",
            badge_color="#22C55E",
            body_html=body_html,
            cta_url=transaction_url,
            cta_label="Voir l&#8217;offre",
        )

        msg = MIMEMultipart("alternative")
        msg["From"] = CITADELLE_FROM_EMAIL
        msg["To"] = seller_email
        msg["Subject"] = f"[Citadelle] Nouvelle offre de {amount_str} € sur : {listing_title}"

        msg.attach(MIMEText(html, "html", "utf-8"))
        _envoyer_email(msg)

        logger.info(f"[Notif] Email nouvelle offre envoyé à {seller_email} — {amount_str} € sur '{listing_title}'")
        return True

    except Exception as e:
        logger.error(f"[Notif] Erreur envoi notification offre à {seller_email} : {e}")
        return False


def send_conversation_reminder_email(
    seller_email: str,
    listing_title: str,
    buyer_email: str,
    conversation_id: str,
    hours_since: int,
) -> bool:
    """
    Relance le vendeur 24h après un message non répondu.
    N'est envoyé qu'UNE SEULE FOIS par conversation dormante.

    Args:
        seller_email: Email du vendeur
        listing_title: Titre de l'annonce
        buyer_email: Email de l'acheteur en attente
        conversation_id: ID de la conversation
        hours_since: Nombre d'heures écoulées depuis le dernier message acheteur
    """
    try:
        conversation_url = f"{CITADELLE_URL}/citadelle/espace-membre/messages/{conversation_id}"
        hours_label = f"{hours_since} heure{'s' if hours_since > 1 else ''}"

        body_html = f"""
        <p style="color:#1A2A3A;font-size:15px;line-height:1.6;margin:0 0 20px 0;">
          Un acheteur attend votre r&#233;ponse depuis plus de
          <strong>{hours_label}</strong> sur votre annonce&#160;:
        </p>

        <!-- Titre annonce -->
        <div style="background:#FEF9EC;border-left:4px solid #F59E0B;
                    border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:20px;">
          <p style="color:#F59E0B;font-size:11px;font-weight:700;
                     text-transform:uppercase;letter-spacing:0.8px;margin:0 0 4px 0;">
            &#9888;&#xFE0F; Relance · {hours_label} sans r&#233;ponse
          </p>
          <p style="color:#0F2747;font-size:15px;font-weight:700;margin:0;">{listing_title}</p>
        </div>

        <!-- Info acheteur -->
        <div style="background:#F7F9FC;border-radius:10px;padding:16px 18px;margin-bottom:24px;">
          <p style="color:#5F6672;font-size:13px;margin:0;">
            L&apos;acheteur <strong style="color:#0F2747;">{buyer_email}</strong>
            attend toujours votre r&#233;ponse. Ne laissez pas cette opportunit&#233; passer&#160;!
          </p>
        </div>

        <p style="color:#5F6672;font-size:12px;line-height:1.6;margin:0;">
          Ceci est une relance unique. Vous ne recevrez pas d&apos;autres rappels
          pour cette conversation.
        </p>"""

        html = _build_notification_base(
            title="Message en attente de r&#233;ponse",
            subtitle=f"Relance — {listing_title}",
            badge_color="#F59E0B",
            body_html=body_html,
            cta_url=conversation_url,
            cta_label="R&#233;pondre maintenant",
        )

        msg = MIMEMultipart("alternative")
        msg["From"] = CITADELLE_FROM_EMAIL
        msg["To"] = seller_email
        msg["Subject"] = f"[Citadelle] Rappel : un message attend votre réponse — {listing_title}"

        msg.attach(MIMEText(html, "html", "utf-8"))
        _envoyer_email(msg)

        logger.info(f"[Notif] Email relance 24h envoyé à {seller_email} pour conv {conversation_id}")
        return True

    except Exception as e:
        logger.error(f"[Notif] Erreur envoi relance à {seller_email} : {e}")
        return False


def send_unread_messages_digest_email(
    recipient_email: str,
    conversations: list,
) -> bool:
    """
    Email de relance digest : regroupe TOUTES les conversations avec messages non lus
    en un seul email. Respecte la règle anti-spam (1 email / conversation / 24h géré par l'appelant).

    Args:
        recipient_email: Email du destinataire
        conversations:   Liste de dicts [{conv_id, listing_title, unread_count, last_preview}]
    """
    if not conversations:
        return False

    try:
        nb = len(conversations)
        messages_url = f"{CITADELLE_URL}/citadelle/espace-membre/messages"

        # Construire la liste des conversations en HTML
        conv_items_html = ""
        for conv in conversations:
            conv_url = f"{messages_url}/{conv['conv_id']}"
            title    = conv.get("listing_title", "Conversation")
            preview  = conv.get("last_preview", "")
            unread   = conv.get("unread_count", 1)
            badge    = (
                f'<span style="background:#C9A45C;color:#0F2747;font-size:11px;'
                f'font-weight:700;padding:2px 8px;border-radius:20px;margin-left:8px;">'
                f'{unread} msg</span>'
            ) if unread > 1 else ""
            preview_block = (
                f'<p style="color:#374151;font-size:13px;line-height:1.5;'
                f'margin:6px 0 10px 0;font-style:italic;">&#8220;{preview[:150]}&#8221;</p>'
            ) if preview else ""

            conv_items_html += f"""
            <div style="background:#F7F9FC;border-left:4px solid #C9A45C;
                        border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:12px;">
              <p style="color:#0F2747;font-size:14px;font-weight:700;margin:0 0 4px 0;">
                {title}{badge}
              </p>
              {preview_block}
              <a href="{conv_url}"
                 style="color:#C9A45C;font-size:12px;font-weight:700;text-decoration:none;">
                R&#233;pondre &#8594;
              </a>
            </div>"""

        body_html = f"""
        <p style="color:#1A2A3A;font-size:15px;line-height:1.6;margin:0 0 20px 0;">
          Vous avez <strong>{nb} conversation{"s" if nb > 1 else ""}</strong>
          avec des messages en attente de r&#233;ponse depuis plus de 24&#160;h.
        </p>
        {conv_items_html}
        <p style="color:#5F6672;font-size:13px;line-height:1.6;margin:16px 0 0 0;">
          Cliquez sur chaque conversation pour r&#233;pondre directement depuis votre espace membre.
        </p>"""

        html = _build_notification_base(
            title="Messages en attente",
            subtitle=f"{nb} conversation{'s' if nb > 1 else ''} sans r&#233;ponse",
            badge_color="#F59E0B",
            body_html=body_html,
            cta_url=messages_url,
            cta_label="Voir mes messages",
        )

        msg = MIMEMultipart("alternative")
        msg["From"] = CITADELLE_FROM_EMAIL
        msg["To"]   = recipient_email
        msg["Subject"] = (
            f"[Citadelle] Vous avez {nb} message{'s' if nb > 1 else ''} en attente de r\u00e9ponse"
        )

        msg.attach(MIMEText(html, "html", "utf-8"))
        _envoyer_email(msg)

        logger.info(f"[Relance] Digest envoyé à {recipient_email} — {nb} conversation(s)")
        return True

    except Exception as e:
        logger.error(f"[Relance] Erreur envoi digest à {recipient_email} : {e}")
        return False


# ─────────────────────────────────────────────────────────────────────────────
# COMMANDES DE SERVICES — Confirmation client + Notification admin
# ─────────────────────────────────────────────────────────────────────────────


def send_citadelle_offer_auto_cancelled_email(buyer_email: str, buyer_name: str, listing_title: str, suggestions: list = None) -> bool:
    """Prévient un acheteur que son offre a été annulée car le bien a trouvé acquéreur.
    Email HTML premium avec jusqu'à 3 vignettes d'annonces similaires (image, titre, prix)."""
    try:
        annonces_url = f"{CITADELLE_URL}/citadelle/annonces"

        # Cartes de suggestions (tables pour compatibilité email)
        cartes_html = ""
        if suggestions:
            cards = []
            for s in suggestions:
                img = _get_listing_image_url_for_email({"images": s.get("images")})
                if img:
                    img_cell = (
                        f'<img src="{img}" width="88" height="66" alt="" '
                        f'style="display:block;border-radius:8px;object-fit:cover;width:88px;height:66px;" />'
                    )
                else:
                    img_cell = (
                        '<div style="width:88px;height:66px;border-radius:8px;background:#0F2747;'
                        'color:#C9A45C;font-size:22px;text-align:center;line-height:66px;">&#127984;</div>'
                    )
                prix = f"{s['price']:,.0f} &#8364;".replace(",", " ") if s.get("price") is not None else ""
                cards.append(f"""
                <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:12px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;">
                  <tr>
                    <td width="88" style="padding:10px;">{img_cell}</td>
                    <td style="padding:10px 12px 10px 0;vertical-align:middle;">
                      <a href="{s.get('url', '')}" style="color:#0F2747;font-size:14px;font-weight:700;text-decoration:none;">{s.get('title', '')}</a>
                      <p style="color:#C9A45C;font-size:13px;font-weight:700;margin:6px 0 0 0;">{prix}</p>
                    </td>
                    <td width="70" style="padding:10px;text-align:right;vertical-align:middle;">
                      <a href="{s.get('url', '')}" style="display:inline-block;padding:8px 12px;background:#0F2747;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:12px;font-weight:700;">Voir</a>
                    </td>
                  </tr>
                </table>""")
            cartes_html = (
                '<p style="color:#0F2747;font-size:14px;font-weight:700;margin:24px 0 12px 0;">'
                'Ces annonces pourraient vous plaire :</p>' + "".join(cards)
            )

        body_html = f"""
            <p style="color:#0F2747;font-size:15px;line-height:1.6;margin:0 0 8px 0;">
              Bonjour {buyer_name or ''},
            </p>
            <p style="color:#4A5568;font-size:14px;line-height:1.7;margin:0 0 8px 0;">
              Navr&#233;, le bien num&#233;rique <strong style="color:#0F2747;">&laquo; {listing_title} &raquo;</strong>
              vient de trouver acqu&#233;reur. Votre offre a donc &#233;t&#233; automatiquement cl
              &#244;tur&#233;e — aucun frais ne vous est appliqu&#233;.
            </p>
            <p style="color:#4A5568;font-size:14px;line-height:1.7;margin:0;">
              Ne baissez pas les bras : la perle rare vous attend peut-&#234;tre parmi nos autres annonces.
            </p>
            {cartes_html}
        """

        html = _build_notification_base(
            title="Le bien a trouv&#233; acqu&#233;reur",
            subtitle=listing_title,
            badge_color="#C9A45C",
            body_html=body_html,
            cta_url=annonces_url,
            cta_label="Voir toutes les annonces",
        )

        # Fallback texte
        lignes_txt = ""
        if suggestions:
            lignes_txt = "\n\nAnnonces similaires :\n" + "\n".join(
                f"• {s.get('title','')}" + (f" — {s['price']:,.0f} €" if s.get("price") is not None else "") + f" : {s.get('url','')}"
                for s in suggestions
            )
        texte = (f"Bonjour {buyer_name or ''},\n\n"
                 f"Navré, le bien numérique « {listing_title} » vient de trouver acquéreur. "
                 f"Votre offre a été automatiquement clôturée.{lignes_txt}\n\n"
                 f"Voir toutes les annonces : {annonces_url}\n\nLa Citadelle Numérique")

        msg = MIMEMultipart("alternative")
        msg['From'] = CITADELLE_FROM_EMAIL
        msg['To'] = buyer_email
        msg['Subject'] = f"Votre offre — {listing_title} — La Citadelle Numérique"
        msg.attach(MIMEText(texte, 'plain', 'utf-8'))
        msg.attach(MIMEText(html, 'html', 'utf-8'))
        _envoyer_email(msg)
        return True
    except Exception as e:
        logger.error(f"[Citadelle] Erreur email annulation offre concurrente: {e}")
        return False

