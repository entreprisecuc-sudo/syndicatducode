"""
Emails Citadelle — Commandes de services.
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


def send_service_order_confirmation_email(
    to_email: str,
    client_name: str,
    service_title: str,
    amount: float,
    order_id: str,
) -> bool:
    """
    Envoie un email de confirmation de commande de service au client.
    Template HTML branding Citadelle Numérique.
    """
    try:
        amount_str = f"{amount:,.0f}".replace(",", "\u202f")
        ref = order_id[:8].upper()

        body_html = f"""
        <p style="color:#1A2A3A;font-size:15px;line-height:1.6;margin:0 0 20px 0;">
          Bonjour <strong>{client_name}</strong>,<br><br>
          Votre commande a bien &#233;t&#233; enregistr&#233;e. Notre &#233;quipe va vous contacter
          tr&#232;s prochainement pour la prise en charge de votre service.
        </p>

        <div style="background:#F7F9FC;border-left:4px solid #C9A45C;
                    border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:20px;">
          <p style="color:#C9A45C;font-size:11px;font-weight:700;
                     text-transform:uppercase;letter-spacing:0.8px;margin:0 0 8px 0;">
            D&#233;tail de votre commande
          </p>
          <p style="color:#0F2747;font-size:15px;font-weight:700;margin:0 0 4px 0;">
            {service_title}
          </p>
          <p style="color:#5F6672;font-size:13px;margin:0 0 4px 0;">
            Montant&#160;: <strong style="color:#0F2747;">{amount_str}&nbsp;&#8364;</strong>
          </p>
          <p style="color:#9CA3AF;font-size:11px;margin:0;">
            R&#233;f&#233;rence&#160;: {ref}
          </p>
        </div>

        <div style="background:#F0F9FF;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
          <p style="color:#0369A1;font-size:13px;margin:0;line-height:1.6;">
            &#9432;&#xFE0F; Le syst&#232;me de paiement en ligne est en cours de mise en place.
            Votre commande est bien enregistr&#233;e et nous vous contacterons directement
            pour les modalit&#233;s de r&#232;glement.
          </p>
        </div>

        <p style="color:#5F6672;font-size:13px;line-height:1.6;margin:0;">
          Une question ?
          <a href="mailto:{CITADELLE_FROM_EMAIL}" style="color:#C9A45C;">{CITADELLE_FROM_EMAIL}</a>
        </p>"""

        html = _build_notification_base(
            title="Commande enregistr&#233;e",
            subtitle=service_title,
            badge_color="#C9A45C",
            body_html=body_html,
            cta_url=f"{CITADELLE_URL}/citadelle/services",
            cta_label="Voir nos services",
        )

        msg = MIMEMultipart("alternative")
        msg["From"] = CITADELLE_FROM_EMAIL
        msg["To"] = to_email
        msg["Subject"] = f"[Citadelle] Confirmation de commande — {service_title}"

        msg.attach(MIMEText(html, "html", "utf-8"))
        _envoyer_email(msg)

        logger.info(f"[Citadelle] Email confirmation commande envoyé à {to_email} — réf. {ref}")
        return True

    except Exception as e:
        logger.error(f"[Citadelle] Erreur email confirmation commande : {e}")
        return False


def send_service_order_admin_notification_email(
    service_title: str,
    amount: float,
    client_name: str,
    client_email: str,
    client_message: str,
    order_id: str,
    cc_recipients: list[str] | None = None,
) -> bool:
    """
    Notifie l'administrateur Citadelle d'une nouvelle commande de service.
    Destinataire principal : CITADELLE_ADMIN_EMAIL.
    cc_recipients : liste optionnelle d'adresses en copie (ex. Syndicat du Code).
    """
    try:
        from config.settings import CITADELLE_ADMIN_EMAIL
        amount_str = f"{amount:,.0f}".replace(",", "\u202f")
        ref = order_id[:8].upper()

        message_section = ""
        if client_message:
            message_section = f"""
        <div style="background:#F7F9FC;border-radius:10px;padding:14px 18px;margin-bottom:16px;">
          <p style="color:#5F6672;font-size:11px;font-weight:700;text-transform:uppercase;
                     letter-spacing:0.5px;margin:0 0 6px 0;">Message du client</p>
          <p style="color:#374151;font-size:13px;line-height:1.6;margin:0;font-style:italic;">
            &#8220;{client_message}&#8221;
          </p>
        </div>"""

        body_html = f"""
        <p style="color:#1A2A3A;font-size:15px;line-height:1.6;margin:0 0 20px 0;">
          Une nouvelle commande de service vient d&apos;&#234;tre pass&#233;e sur La Citadelle Num&#233;rique.
        </p>

        <div style="background:#0F2747;border-radius:12px;padding:20px 24px;
                    text-align:center;margin-bottom:20px;">
          <p style="color:rgba(255,255,255,0.6);font-size:11px;
                     text-transform:uppercase;letter-spacing:1px;margin:0 0 6px 0;">Montant</p>
          <p style="color:#C9A45C;font-size:36px;font-weight:800;margin:0;
                     font-family:Georgia,'Times New Roman',serif;">
            {amount_str}&nbsp;&#8364;
          </p>
          <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:8px 0 0 0;">
            {service_title}
          </p>
        </div>

        <div style="background:#F7F9FC;border-left:4px solid #C9A45C;
                    border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:16px;">
          <p style="color:#C9A45C;font-size:11px;font-weight:700;
                     text-transform:uppercase;letter-spacing:0.8px;margin:0 0 6px 0;">Client</p>
          <p style="color:#0F2747;font-size:15px;font-weight:700;margin:0 0 2px 0;">{client_name}</p>
          <p style="color:#5F6672;font-size:13px;margin:0;">{client_email}</p>
        </div>

        {message_section}

        <p style="color:#9CA3AF;font-size:11px;margin:0;">
          R&#233;f&#233;rence commande&#160;: {ref}
        </p>"""

        html = _build_notification_base(
            title="Nouvelle commande de service",
            subtitle=service_title,
            badge_color="#22C55E",
            body_html=body_html,
            cta_url=f"{CITADELLE_URL}/syndicat-admin",
            cta_label="G&#233;rer les commandes",
        )

        msg = MIMEMultipart("alternative")
        msg["From"] = CITADELLE_FROM_EMAIL
        msg["To"] = CITADELLE_ADMIN_EMAIL
        if cc_recipients:
            msg["Cc"] = ", ".join(cc_recipients)
        msg["Subject"] = f"[Citadelle Admin] Nouvelle commande — {service_title} — {amount_str} €"

        msg.attach(MIMEText(html, "html", "utf-8"))
        _envoyer_email(msg)

        logger.info(f"[Citadelle] Email notification admin nouvelle commande — réf. {ref}")
        return True

    except Exception as e:
        logger.error(f"[Citadelle] Erreur email notification admin commande : {e}")
        return False


