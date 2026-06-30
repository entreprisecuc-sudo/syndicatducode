"""
Emails Citadelle — Commandes de services.
"""

import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

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


def send_invoice_confirmation_email(
    invoice: dict,
    pdf_bytes: bytes,
) -> bool:
    """
    Envoie un email de confirmation de paiement au client avec la facture PDF en pièce jointe.
    - invoice : document MongoDB de la facture (invoice_number, client_name, client_email, ...)
    - pdf_bytes : contenu du PDF généré en mémoire (bytes)
    """
    try:
        client_name   = invoice.get("client_name", "Client")
        client_email  = invoice.get("client_email", "")
        invoice_number = invoice.get("invoice_number", "")
        service_title  = invoice.get("service_title", "Prestation")
        amount_ttc     = invoice.get("amount_ttc", 0)
        amount_ht      = invoice.get("amount_ht", 0)
        vat_amount     = invoice.get("vat_amount", 0)

        amount_ttc_str = f"{amount_ttc:,.2f}".replace(",", "\u202f").replace(".", ",")
        amount_ht_str  = f"{amount_ht:,.2f}".replace(",", "\u202f").replace(".", ",")
        vat_str        = f"{vat_amount:,.2f}".replace(",", "\u202f").replace(".", ",")

        body_html = f"""
        <p style="color:#1A2A3A;font-size:15px;line-height:1.6;margin:0 0 20px 0;">
          Bonjour <strong>{client_name}</strong>,<br><br>
          Votre paiement a bien &#233;t&#233; re&#231;u. Vous trouverez ci-joint votre facture
          officielle en pi&#232;ce jointe (format PDF).
        </p>

        <div style="background:#F7F9FC;border-left:4px solid #C9A45C;
                    border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:20px;">
          <p style="color:#C9A45C;font-size:11px;font-weight:700;
                     text-transform:uppercase;letter-spacing:0.8px;margin:0 0 10px 0;">
            R&#233;capitulatif de votre facture
          </p>
          <p style="color:#0F2747;font-size:15px;font-weight:700;margin:0 0 6px 0;">
            {service_title}
          </p>
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:10px;">
            <tr>
              <td style="color:#5F6672;font-size:13px;padding:3px 0;">Montant HT</td>
              <td style="color:#0F2747;font-size:13px;font-weight:600;text-align:right;">{amount_ht_str}&nbsp;&#8364;</td>
            </tr>
            <tr>
              <td style="color:#5F6672;font-size:13px;padding:3px 0;">TVA (20&nbsp;%)</td>
              <td style="color:#0F2747;font-size:13px;font-weight:600;text-align:right;">{vat_str}&nbsp;&#8364;</td>
            </tr>
            <tr>
              <td style="color:#0F2747;font-size:14px;font-weight:700;padding:8px 0 3px 0;border-top:1px solid #E5E7EB;">Total TTC</td>
              <td style="color:#0F2747;font-size:14px;font-weight:700;text-align:right;padding:8px 0 3px 0;border-top:1px solid #E5E7EB;">{amount_ttc_str}&nbsp;&#8364;</td>
            </tr>
          </table>
          <p style="color:#9CA3AF;font-size:11px;margin:10px 0 0 0;">
            N&#186; de facture&#160;: <strong style="color:#6B7280;">{invoice_number}</strong>
          </p>
        </div>

        <div style="background:#F0FFF4;border-radius:8px;padding:12px 16px;margin-bottom:20px;
                    border:1px solid #BBF7D0;">
          <p style="color:#166534;font-size:13px;margin:0;line-height:1.6;">
            &#10003; Votre facture PDF est attach&#233;e &#224; cet email.
            Conservez-la pour votre comptabilit&#233;.
          </p>
        </div>

        <p style="color:#5F6672;font-size:13px;line-height:1.6;margin:0;">
          Une question ? Contactez-nous :<br>
          <a href="mailto:{CITADELLE_FROM_EMAIL}" style="color:#C9A45C;">{CITADELLE_FROM_EMAIL}</a>
        </p>"""

        html = _build_notification_base(
            title="Paiement confirm&#233; &#8212; Facture disponible",
            subtitle=f"Facture {invoice_number}",
            badge_color="#22C55E",
            body_html=body_html,
            cta_url=f"{CITADELLE_URL}/citadelle/espace-membre/factures",
            cta_label="Acc&#233;der &#224; mes factures",
        )

        # Construction du message avec pièce jointe
        msg = MIMEMultipart("mixed")
        msg["From"]    = CITADELLE_FROM_EMAIL
        msg["To"]      = client_email
        msg["Subject"] = f"[Citadelle] Votre facture {invoice_number} — {service_title}"

        # Corps HTML
        html_part = MIMEMultipart("alternative")
        html_part.attach(MIMEText(html, "html", "utf-8"))
        msg.attach(html_part)

        # Pièce jointe PDF
        pdf_part = MIMEBase("application", "pdf")
        pdf_part.set_payload(pdf_bytes)
        encoders.encode_base64(pdf_part)
        pdf_part.add_header(
            "Content-Disposition",
            "attachment",
            filename=f"Facture_{invoice_number}.pdf",
        )
        msg.attach(pdf_part)

        _envoyer_email(msg)
        logger.info(f"[Citadelle] Email facture {invoice_number} envoyé à {client_email}")
        return True

    except Exception as e:
        logger.error(f"[Citadelle] Erreur envoi email facture : {e}")
        return False



