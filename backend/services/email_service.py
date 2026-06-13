"""
Service d'envoi d'emails
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

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

logger = logging.getLogger(__name__)


def _envoyer_email(msg: MIMEMultipart) -> None:
    """
    Envoie un email via le bon compte SMTP selon l'expéditeur du message.
    - expéditeur == CITADELLE_FROM_EMAIL → credentials lagarde@lacitadellenumerique.fr
    - sinon → credentials Syndicat du Code (atelier@syndicatducode.fr)
    Le serveur SMTP est commun (Hostinger), seuls les credentials diffèrent.
    """
    from_email = msg.get("From", "")
    if from_email == CITADELLE_FROM_EMAIL:
        user, password = CITADELLE_SMTP_USER, CITADELLE_SMTP_PASSWORD
    else:
        user, password = SMTP_USER, SMTP_PASSWORD
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
        server.login(user, password)
        server.send_message(msg)


def send_reset_password_email(to_email: str, reset_token: str) -> bool:
    """
    Envoie un email de réinitialisation de mot de passe
    
    Args:
        to_email: Email du destinataire
        reset_token: Token de réinitialisation (brut)
    
    Returns:
        True si l'envoi a réussi
    """
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = "Réinitialisation de votre mot de passe - Le Syndicat du Code"
        
        reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
        
        body = f"""
Bonjour,

Vous avez demandé la réinitialisation de votre mot de passe sur Le Syndicat du Code.

Cliquez sur le lien suivant pour définir un nouveau mot de passe :

{reset_link}

⚠️ Ce lien est valable pendant 1 heure et ne peut être utilisé qu'une seule fois.

Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Notre loi. Unis par le code.
Le Syndicat du Code
        """
        
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        _envoyer_email(msg)
        
        logger.info(f"Email de réinitialisation envoyé à {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Erreur envoi email de réinitialisation: {e}")
        return False


def send_welcome_email(to_email: str) -> bool:
    """
    Envoie un email de bienvenue après inscription
    
    Args:
        to_email: Email du destinataire
    
    Returns:
        True si l'envoi a réussi
    """
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = "Bienvenue au Syndicat du Code !"
        
        body = f"""
Bienvenue au Syndicat du Code !

Votre compte a été créé avec succès.

Connectez-vous dès maintenant pour choisir votre rôle :
- Partenaire Commercial (apporteur d'affaires)
- Partenaire Développeur (freelance)

👉 {FRONTEND_URL}/login

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Notre loi. Unis par le code.
Le Syndicat du Code
        """
        
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        _envoyer_email(msg)
        
        logger.info(f"Email de bienvenue envoyé à {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Erreur envoi email de bienvenue: {e}")
        return False


def send_suspension_email(to_email: str, reason: str) -> bool:
    """
    Envoie un email de notification de suspension de compte
    
    Args:
        to_email: Email du destinataire
        reason: Motif de la suspension
    
    Returns:
        True si l'envoi a réussi
    """
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = "⚠️ Suspension de votre compte - Le Syndicat du Code"
        
        body = f"""
Bonjour,

Nous vous informons que votre compte sur Le Syndicat du Code a été suspendu.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 MOTIF DE LA SUSPENSION :

{reason}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Durant cette suspension, vous ne pourrez plus accéder à votre espace membre.

Si vous pensez qu'il s'agit d'une erreur ou si vous souhaitez contester cette décision, 
veuillez nous contacter par email à : contact@syndicatducode.fr

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Notre loi. Unis par le code.
Le Syndicat du Code
        """
        
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        _envoyer_email(msg)
        
        logger.info(f"Email de suspension envoyé à {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Erreur envoi email de suspension: {e}")
        return False


def send_reactivation_email(to_email: str) -> bool:
    """
    Envoie un email de notification de réactivation de compte
    
    Args:
        to_email: Email du destinataire
    
    Returns:
        True si l'envoi a réussi
    """
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = "✅ Votre compte a été réactivé - Le Syndicat du Code"
        
        body = f"""
Bonjour,

Bonne nouvelle ! Votre compte sur Le Syndicat du Code a été réactivé.

Vous pouvez dès à présent vous reconnecter et accéder à votre espace membre :

👉 {FRONTEND_URL}/connexion

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Notre loi. Unis par le code.
Le Syndicat du Code
        """
        
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        _envoyer_email(msg)
        
        logger.info(f"Email de réactivation envoyé à {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Erreur envoi email de réactivation: {e}")
        return False


def send_application_decision_email(to_email: str, project_title: str, is_accepted: bool, note: str = None) -> bool:
    """
    Envoie un email de décision sur une candidature (acceptée ou refusée)
    
    Args:
        to_email: Email du candidat
        project_title: Titre du projet
        is_accepted: True si acceptée, False si refusée
        note: Note optionnelle de l'admin
    
    Returns:
        True si l'envoi a réussi
    """
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        
        if is_accepted:
            msg['Subject'] = f"🎉 Candidature acceptée - {project_title}"
            status_text = "ACCEPTÉE"
            status_emoji = "✅"
            intro_text = "Nous avons le plaisir de vous informer que votre candidature a été retenue !"
            action_text = f"""
Un espace projet a été créé pour vous permettre de collaborer avec l'équipe.

👉 Connectez-vous à votre espace membre : {FRONTEND_URL}/connexion

Rendez-vous dans la section "Mes espaces projets" pour commencer à échanger avec l'équipe."""
        else:
            msg['Subject'] = f"Candidature non retenue - {project_title}"
            status_text = "NON RETENUE"
            status_emoji = "❌"
            intro_text = "Nous vous remercions de l'intérêt que vous portez à ce projet."
            action_text = """
Nous vous encourageons à consulter régulièrement les nouveaux projets disponibles
sur votre espace membre et à postuler aux opportunités qui correspondent à vos compétences."""
        
        note_section = ""
        if note:
            note_section = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 MESSAGE DE L'ÉQUIPE :

{note}
"""
        
        body = f"""
Bonjour,

{intro_text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{status_emoji} PROJET : {project_title}
📋 STATUT : {status_text}
{note_section}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{action_text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Notre loi. Unis par le code.
Le Syndicat du Code

Pour toute question, contactez-nous à : contact@syndicatducode.fr
        """
        
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        _envoyer_email(msg)
        
        logger.info(f"Email de décision candidature envoyé à {to_email} (acceptée: {is_accepted})")
        return True
        
    except Exception as e:
        logger.error(f"Erreur envoi email décision candidature: {e}")
        return False


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


def send_backup_notification_email(    to_email: str,
    filename: str,
    drive_url: str,
    drive_enabled: bool,
    error_message: str = "",
) -> bool:
    """
    Envoie un email de notification après une sauvegarde déclenchée.

    Args:
        to_email: Email du destinataire
        filename: Nom du fichier ZIP généré
        drive_url: URL Google Drive (vide si upload non effectué)
        drive_enabled: True si Google Drive est configuré
        error_message: Message d'erreur éventuel (vide si succès)

    Returns:
        True si l'envoi a réussi
    """
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = "Sauvegarde MongoDB effectuée - Le Syndicat du Code"

        drive_section = ""
        if drive_enabled:
            if drive_url:
                drive_section = f"""
📁 GOOGLE DRIVE : Upload réussi
🔗 Lien : {drive_url}
"""
            else:
                drive_section = """
📁 GOOGLE DRIVE : Échec de l'upload (voir les logs pour le détail)
"""
        else:
            drive_section = """
📁 GOOGLE DRIVE : Non configuré (export local uniquement)
"""

        error_section = ""
        if error_message:
            error_section = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ AVERTISSEMENT :
{error_message}
"""

        body = f"""
Bonjour,

Une sauvegarde de la base de données MongoDB a été déclenchée avec succès.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💾 FICHIER GÉNÉRÉ : {filename}
{drive_section}{error_section}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Notre loi. Unis par le code.
Le Syndicat du Code
        """

        msg.attach(MIMEText(body, 'plain', 'utf-8'))

        _envoyer_email(msg)

        logger.info("Email de notification de backup envoyé à %s", to_email)
        return True

    except Exception as e:
        logger.error("Erreur envoi email de backup : %s", e)
        return False


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
_LISTING_TYPE_LABELS = {
    "website": "Site internet",
    "ecommerce": "E-commerce",
    "saas": "SaaS",
    "webapp": "Application web",
    "social_account": "Réseau social",
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


def send_new_message_notification_email(
    seller_email: str,
    listing_title: str,
    buyer_email: str,
    message_preview: str,
    conversation_id: str,
) -> bool:
    """
    Notifie le vendeur qu'un acheteur lui a envoyé son premier message
    sur l'une de ses annonces.

    Args:
        seller_email: Email du vendeur destinataire
        listing_title: Titre de l'annonce concernée
        buyer_email: Email de l'acheteur qui a écrit
        message_preview: Début du message (tronqué à 200 chars)
        conversation_id: ID de la conversation (pour le lien CTA)
    """
    try:
        preview = (message_preview[:200] + "…") if len(message_preview) > 200 else message_preview
        conversation_url = f"{CITADELLE_URL}/citadelle/espace-membre/messages/{conversation_id}"

        body_html = f"""
        <p style="color:#1A2A3A;font-size:15px;line-height:1.6;margin:0 0 20px 0;">
          Un acheteur vous a envoy&#233; un message concernant votre annonce&#160;:
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
            <strong style="color:#0F2747;">{buyer_email}</strong> vous &#233;crit&#160;:
          </p>
          <p style="color:#374151;font-size:14px;line-height:1.6;margin:0;font-style:italic;">
            &#8220;{preview}&#8221;
          </p>
        </div>

        <p style="color:#5F6672;font-size:13px;line-height:1.6;margin:0;">
          R&#233;pondez rapidement pour ne pas laisser cet acheteur potentiel sans nouvelles.
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
        msg["To"] = seller_email
        msg["Subject"] = f"[Citadelle] Nouveau message sur votre annonce : {listing_title}"

        msg.attach(MIMEText(html, "html", "utf-8"))
        _envoyer_email(msg)

        logger.info(f"[Notif] Email nouveau message envoyé à {seller_email} pour annonce '{listing_title}'")
        return True

    except Exception as e:
        logger.error(f"[Notif] Erreur envoi notification message à {seller_email} : {e}")
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


# ─────────────────────────────────────────────────────────────────────────────
# COMMANDES DE SERVICES — Confirmation client + Notification admin
# ─────────────────────────────────────────────────────────────────────────────

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
) -> bool:
    """
    Notifie l'administrateur Citadelle d'une nouvelle commande de service.
    Destinataire : CITADELLE_ADMIN_EMAIL (settings).
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
        msg["Subject"] = f"[Citadelle Admin] Nouvelle commande — {service_title} — {amount_str} €"

        msg.attach(MIMEText(html, "html", "utf-8"))
        _envoyer_email(msg)

        logger.info(f"[Citadelle] Email notification admin nouvelle commande — réf. {ref}")
        return True

    except Exception as e:
        logger.error(f"[Citadelle] Erreur email notification admin commande : {e}")
        return False


def send_citadelle_contact_email(nom: str, email: str, sujet: str, message: str) -> bool:
    """
    Transmet le message du formulaire de contact à l'équipe La Citadelle Numérique.
    L'admin reçoit le contenu complet avec l'email de l'expéditeur pour répondre.
    """
    try:
        from config.settings import CITADELLE_ADMIN_EMAIL

        msg = MIMEMultipart()
        msg['From'] = CITADELLE_FROM_EMAIL
        msg['To'] = CITADELLE_ADMIN_EMAIL
        msg['Reply-To'] = email
        msg['Subject'] = f"[Contact Citadelle] {sujet}"

        body = f"""Nouveau message de contact — La Citadelle Numérique

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
De        : {nom}
Email     : {email}
Sujet     : {sujet}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Message envoyé depuis le formulaire de contact
{CITADELLE_URL}/citadelle/contact
"""

        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        _envoyer_email(msg)

        logger.info(f"[Citadelle Contact] Message reçu de {email} — sujet: {sujet[:50]}")
        return True

    except Exception as e:
        logger.error(f"[Citadelle Contact] Erreur envoi email contact: {e}")
        return False


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
        listing_url = f"{CITADELLE_URL}/citadelle/annonces/{listing_slug}"

        msg = MIMEMultipart()
        msg['From'] = CITADELLE_FROM_EMAIL
        msg['To'] = winner_email
        msg['Subject'] = f"Félicitations ! Vous avez remporté l'enchère — {listing_title}"

        body = f"""Félicitations {winner_name} !

Vous avez remporté l'enchère pour :

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{listing_title}
Montant remporté : {amount:,.0f} €
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pour finaliser votre acquisition, rendez-vous sur votre espace membre
et procédez au paiement sécurisé :

{payment_url}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
La Citadelle Numérique
{CITADELLE_URL}
"""
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        _envoyer_email(msg)
        return True
    except Exception as e:
        logger.error(f"[Citadelle Enchère] Erreur email gagnant: {e}")
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
