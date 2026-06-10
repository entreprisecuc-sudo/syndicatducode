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
    CITADELLE_FROM_EMAIL
)

logger = logging.getLogger(__name__)


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
        
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
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
        
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
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
        
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
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
        
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
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
        
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
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

        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)

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
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)

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
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)

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

        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)

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

        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)

        logger.info(f"[Citadelle] Email accès sécurisés envoyé à {to_email} pour « {listing_title} »")
        return True

    except Exception as e:
        logger.error(f"[Citadelle] Erreur envoi email accès: {e}")
        return False
