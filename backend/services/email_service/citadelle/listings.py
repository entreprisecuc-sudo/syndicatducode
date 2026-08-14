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
    TEST_EMAIL_OVERRIDE,
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


def send_citadelle_garde_verified_email(
    to_email: str,
    listing_title: str,
    listing_slug: str,
    seller_name: str = "",
) -> bool:
    """
    Notifie le vendeur que son annonce a obtenu le badge « Vérifié par La Garde ».
    Email HTML premium avec branding Citadelle bleu/or.
    """
    try:
        listing_url = f"{CITADELLE_URL}/citadelle/annonces/{listing_slug}"
        prenom = seller_name.split()[0] if seller_name else "Bonjour"

        msg = MIMEMultipart("alternative")
        msg['From'] = CITADELLE_FROM_EMAIL
        msg['To'] = to_email
        msg['Subject'] = f"Votre annonce est maintenant Vérifiée par La Garde — {listing_title}"

        html = f"""<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f3f8;font-family:'Helvetica Neue',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f3f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(15,39,71,0.12);">

        <!-- EN-TÊTE BLEU NUIT -->
        <tr>
          <td style="background:#0f2747;padding:32px 40px 24px;text-align:center;">
            <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(201,164,92,0.7);">La Citadelle Numérique</p>
            <!-- Bouclier SVG doré -->
            <div style="display:inline-block;margin:16px 0;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr><td align="center" style="background:rgba(201,164,92,0.12);border:2px solid rgba(201,164,92,0.35);border-radius:50%;width:72px;height:72px;">
                  <span style="font-size:36px;line-height:72px;">🛡️</span>
                </td></tr>
              </table>
            </div>
            <h1 style="margin:8px 0 0;font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">Vérifié par La Garde</h1>
            <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.55);">Badge de confiance activé sur votre annonce</p>
          </td>
        </tr>

        <!-- BANDEAU DORÉ -->
        <tr>
          <td style="background:#c9a45c;padding:10px 40px;text-align:center;">
            <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#0f2747;">Identité · Droits · Revenus · Accès — Tout a été contrôlé</p>
          </td>
        </tr>

        <!-- CORPS -->
        <tr>
          <td style="background:#ffffff;padding:36px 40px;">

            <p style="margin:0 0 20px;font-size:15px;color:#1a2e4a;">Bonjour {prenom},</p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#374151;">
              Excellente nouvelle ! Votre annonce a passé avec succès la vérification complète de <strong>La Garde</strong>. 
              Le badge <strong style="color:#0f2747;">« Vérifié par La Garde »</strong> est maintenant affiché sur votre annonce.
            </p>

            <!-- Carte annonce -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:28px;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c9a45c;">Votre annonce</p>
                <p style="margin:0;font-size:16px;font-weight:800;color:#0f2747;">{listing_title}</p>
              </td></tr>
            </table>

            <!-- Ce que le badge apporte -->
            <p style="margin:0 0 16px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#0f2747;">Ce que ce badge signifie pour vous</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f0f3f8;">
                  <table cellpadding="0" cellspacing="0"><tr>
                    <td style="padding-right:12px;font-size:18px;">✅</td>
                    <td style="font-size:14px;color:#374151;line-height:1.5;"><strong>Plus de confiance</strong> — Les acheteurs savent que votre identité et vos droits ont été vérifiés.</td>
                  </tr></table>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f0f3f8;">
                  <table cellpadding="0" cellspacing="0"><tr>
                    <td style="padding-right:12px;font-size:18px;">⚡</td>
                    <td style="font-size:14px;color:#374151;line-height:1.5;"><strong>Vente plus rapide</strong> — Les annonces vérifiées reçoivent en moyenne plus d'offres.</td>
                  </tr></table>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;">
                  <table cellpadding="0" cellspacing="0"><tr>
                    <td style="padding-right:12px;font-size:18px;">🛡️</td>
                    <td style="font-size:14px;color:#374151;line-height:1.5;"><strong>Distinction visuelle</strong> — Un bouclier doré s'affiche sur votre carte d'annonce dans le listing.</td>
                  </tr></table>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="{listing_url}"
                   style="display:inline-block;background:#c9a45c;color:#0f2747;font-size:14px;font-weight:900;text-decoration:none;padding:16px 40px;border-radius:10px;letter-spacing:0.3px;">
                  Voir mon annonce →
                </a>
              </td></tr>
            </table>

            <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#9ca3af;text-align:center;">
              Merci de votre confiance. N'hésitez pas à nous contacter pour toute question.
            </p>
          </td>
        </tr>

        <!-- PIED DE PAGE -->
        <tr>
          <td style="background:#0f2747;padding:20px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#c9a45c;">La Citadelle Numérique</p>
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);">Marketplace française d'actifs numériques · <a href="{CITADELLE_URL}" style="color:rgba(201,164,92,0.5);text-decoration:none;">{CITADELLE_URL}</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>"""

        msg.attach(MIMEText(html, "html", "utf-8"))
        _envoyer_email(msg)
        logger.info(f"[Citadelle] Email Vérifié La Garde envoyé à {to_email} pour: {listing_title[:40]}")
        return True

    except Exception as e:
        logger.error(f"[Citadelle] Erreur email garde_verified: {e}")
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


def send_citadelle_listing_relance_email(
    to_email: str,
    seller_name: str,
    listing_title: str,
    listing_slug: str,
    days_online: int,
    quality_pct: int,
    quality_label: str,
    missing_criteria: list,
) -> bool:
    """
    Relance automatique envoyée au vendeur après 31 jours d'annonce active.
    Demande si l'actif est toujours à vendre et fournit des conseils basés
    sur le score de qualité de l'annonce.
    Si TEST_EMAIL_OVERRIDE est défini, l'email part sur cette adresse de test.
    """
    try:
        # Redirection vers l'adresse de test si défini
        recipient = TEST_EMAIL_OVERRIDE or to_email

        prenom = seller_name.split()[0] if seller_name else "Bonjour"
        listing_url   = f"{CITADELLE_URL}/citadelle/annonces/{listing_slug}"
        edit_url      = f"{CITADELLE_URL}/citadelle/espace-membre/mes-annonces"

        # Couleur du score qualité
        if quality_pct >= 90:
            score_color = "#16A34A"
        elif quality_pct >= 70:
            score_color = "#22C55E"
        elif quality_pct >= 40:
            score_color = "#F59E0B"
        else:
            score_color = "#EF4444"

        # Barre de progression (largeur en %)
        bar_width = max(4, quality_pct)

        # Bloc conseils — critères manquants
        if missing_criteria:
            conseils_items = "".join(
                f'<tr><td style="padding:6px 0;border-bottom:1px solid #f0f3f8;">'
                f'<table cellpadding="0" cellspacing="0"><tr>'
                f'<td style="padding-right:10px;font-size:15px;">→</td>'
                f'<td style="font-size:14px;color:#374151;line-height:1.5;">{c}</td>'
                f'</tr></table></td></tr>'
                for c in missing_criteria
            )
            conseils_bloc = f"""
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#0f2747;">
              Pour améliorer vos chances de vente, ajoutez :
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              {conseils_items}
            </table>
            """
        else:
            conseils_bloc = """
            <p style="margin:0 0 28px;font-size:14px;color:#16A34A;font-weight:600;">
              ✅ Annonce complète — rien à signaler. Votre annonce a toutes les chances de trouver preneur !
            </p>
            """

        msg = MIMEMultipart("alternative")
        msg['From']    = CITADELLE_FROM_EMAIL
        msg['To']      = recipient
        msg['Subject'] = f"Votre actif est-il toujours à vendre ? — {listing_title}"

        html = f"""<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f3f8;font-family:'Helvetica Neue',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f3f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(15,39,71,0.12);">

        <!-- EN-TÊTE -->
        <tr>
          <td style="background:#0f2747;padding:28px 40px 22px;text-align:center;">
            <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(201,164,92,0.7);">La Citadelle Numérique</p>
            <h1 style="margin:0;font-size:20px;font-weight:900;color:#ffffff;letter-spacing:-0.3px;">Votre annonce a {days_online} jours</h1>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.5);">Est-elle toujours d'actualité ?</p>
          </td>
        </tr>

        <!-- BANDEAU DORÉ -->
        <tr>
          <td style="background:#c9a45c;padding:8px 40px;text-align:center;">
            <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#0f2747;">Suivi de votre annonce</p>
          </td>
        </tr>

        <!-- CORPS -->
        <tr>
          <td style="background:#ffffff;padding:32px 40px;">

            <p style="margin:0 0 20px;font-size:15px;color:#1a2e4a;">Bonjour {prenom},</p>

            <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#374151;">
              Votre annonce <strong style="color:#0f2747;">"{listing_title}"</strong> est en ligne
              depuis <strong>{days_online} jours</strong>.<br>
              <strong>Votre actif est-il toujours à vendre ?</strong>
            </p>

            <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#6b7280;">
              Si ce n'est plus le cas, pensez à <a href="{edit_url}" style="color:#c9a45c;">mettre à jour ou retirer votre annonce</a>
              afin de garder la marketplace à jour pour les acheteurs.
            </p>

            <!-- Score qualité -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f8f9fc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;">
              <tr><td style="padding:20px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                  <tr>
                    <td style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c9a45c;">
                      QUALITÉ DE L'ANNONCE
                    </td>
                    <td align="right" style="font-size:13px;font-weight:800;color:{score_color};">
                      {quality_pct}% · {quality_label}
                    </td>
                  </tr>
                </table>
                <!-- Barre de progression -->
                <table width="100%" cellpadding="0" cellspacing="0"
                  style="background:#e5e7eb;border-radius:6px;height:10px;overflow:hidden;">
                  <tr>
                    <td width="{bar_width}%" style="background:{score_color};height:10px;border-radius:6px;"></td>
                    <td></td>
                  </tr>
                </table>
              </td></tr>
            </table>

            {conseils_bloc}

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td align="center" style="padding-bottom:12px;">
                  <a href="{listing_url}"
                    style="display:inline-block;background:#c9a45c;color:#0f2747;font-size:14px;font-weight:900;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
                    Voir mon annonce →
                  </a>
                </td>
              </tr>
              <tr>
                <td align="center">
                  <a href="{edit_url}"
                    style="display:inline-block;background:rgba(15,39,71,0.06);color:#0f2747;font-size:13px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:10px;">
                    Mettre à jour / Retirer l'annonce
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;text-align:center;">
              Cet email est automatiquement envoyé aux vendeurs dont l'annonce est active depuis plus de 31 jours.<br>
              Pour toute question : <a href="mailto:{CITADELLE_FROM_EMAIL}" style="color:#c9a45c;">{CITADELLE_FROM_EMAIL}</a>
            </p>
          </td>
        </tr>

        <!-- PIED DE PAGE -->
        <tr>
          <td style="background:#0f2747;padding:18px 40px;text-align:center;">
            <p style="margin:0 0 3px;font-size:12px;font-weight:700;color:#c9a45c;">La Citadelle Numérique</p>
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);">
              Marketplace française d'actifs numériques ·
              <a href="{CITADELLE_URL}" style="color:rgba(201,164,92,0.5);text-decoration:none;">{CITADELLE_URL}</a>
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
        logger.info(
            f"[Citadelle Relance] Email envoyé à {recipient} "
            f"(vendeur réel: {to_email}) — annonce: {listing_title[:40]}"
        )
        return True

    except Exception as e:
        logger.error(f"[Citadelle Relance] Erreur email relance annonce: {e}")
        return False


