"""
Routes Newsletter — La Citadelle Numérique
Inscription aux alertes annonces, désinscription et gestion admin
"""

import uuid
import secrets
import logging

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import HTMLResponse, Response, RedirectResponse
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone
from urllib.parse import unquote

from middleware.auth import get_current_user
from routes.citadelle.dependencies import require_admin
from services.newsletter_scheduler import (
    get_or_create_config,
    reschedule_newsletter_job,
    run_newsletter_digest,
    fetch_blog_sections,
)
from services.email_service import build_newsletter_html

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Citadelle Newsletter"])

db = None


def set_database(database):
    """Injecte la référence à la base de données MongoDB."""
    global db
    db = database
    # Injecte aussi dans le service scheduler
    from services.newsletter_scheduler import set_database as set_scheduler_db
    set_scheduler_db(database)


# ── Helpers ────────────────────────────────────────────────────────────────────

# require_admin importé depuis routes/citadelle/dependencies (DRY)


# ── Modèles ────────────────────────────────────────────────────────────────────

class SubscribeRequest(BaseModel):
    email: EmailStr


class NewsletterConfigUpdate(BaseModel):
    frequency: Optional[str] = None    # weekly | biweekly | monthly
    day_of_week: Optional[int] = None  # 0=lundi … 6=dimanche
    hour: Optional[int] = None         # 0-23
    max_listings: Optional[int] = None # 1-50
    is_active: Optional[bool] = None


# ── Routes publiques ───────────────────────────────────────────────────────────

@router.post("/newsletter/subscribe", summary="S'inscrire à la newsletter")
async def subscribe(data: SubscribeRequest):
    """
    Inscription publique à la newsletter d'alertes annonces.
    Si déjà abonné et actif → confirmation silencieuse.
    Si désabonné → réactivation de l'abonnement.
    """
    email = data.email.lower().strip()

    existing = await db.citadelle_newsletter_subscriptions.find_one(
        {"email": email}, {"_id": 0}
    )

    if existing:
        if existing.get("is_active"):
            return {"message": "Vous êtes déjà inscrit à la newsletter."}
        # Réactivation
        await db.citadelle_newsletter_subscriptions.update_one(
            {"email": email},
            {"$set": {
                "is_active": True,
                "subscribed_at": datetime.now(timezone.utc).isoformat(),
            }},
        )
        logger.info(f"[Newsletter] Réactivation abonnement : {email}")
        return {"message": "Votre abonnement a été réactivé avec succès."}

    # Nouvelle inscription
    subscription = {
        "id": str(uuid.uuid4()),
        "email": email,
        "user_id": None,
        "is_active": True,
        "unsubscribe_token": secrets.token_urlsafe(32),
        "subscribed_at": datetime.now(timezone.utc).isoformat(),
        "last_email_sent_at": None,
    }
    await db.citadelle_newsletter_subscriptions.insert_one(subscription)
    logger.info(f"[Newsletter] Nouvelle inscription : {email}")
    return {"message": "Inscription réussie ! Vous recevrez les prochaines alertes annonces par email."}


@router.post("/newsletter/subscribe-member", summary="Auto-inscription d'un membre connecté")
async def subscribe_member(current_user: dict = Depends(get_current_user)):
    """
    Auto-inscription d'un membre Citadelle connecté.
    Appelé silencieusement après la connexion/inscription.
    Associe l'abonnement à l'user_id pour protéger le compte.
    """
    email = current_user.get("email", "").lower().strip()
    user_id = current_user.get("id") or current_user.get("user_id")

    if not email:
        raise HTTPException(status_code=400, detail="Email introuvable dans le token.")

    existing = await db.citadelle_newsletter_subscriptions.find_one(
        {"email": email}, {"_id": 0}
    )

    if existing:
        # Mettre à jour le user_id si pas encore associé
        if not existing.get("user_id") and user_id:
            await db.citadelle_newsletter_subscriptions.update_one(
                {"email": email}, {"$set": {"user_id": user_id}}
            )
        return {"message": "Abonnement existant.", "subscribed": True}

    subscription = {
        "id": str(uuid.uuid4()),
        "email": email,
        "user_id": user_id,
        "is_active": True,
        "unsubscribe_token": secrets.token_urlsafe(32),
        "subscribed_at": datetime.now(timezone.utc).isoformat(),
        "last_email_sent_at": None,
    }
    await db.citadelle_newsletter_subscriptions.insert_one(subscription)
    logger.info(f"[Newsletter] Auto-inscription membre : {email}")
    return {"message": "Inscription aux alertes annonces activée.", "subscribed": True}


@router.get("/newsletter/unsubscribe/{token}", summary="Désinscription via lien email")
async def unsubscribe(token: str):
    """
    Désinscription via le token contenu dans l'email.
    Retourne une page HTML de confirmation.
    """
    subscription = await db.citadelle_newsletter_subscriptions.find_one(
        {"unsubscribe_token": token}, {"_id": 0}
    )
    if not subscription:
        raise HTTPException(status_code=404, detail="Lien invalide ou expiré.")

    await db.citadelle_newsletter_subscriptions.update_one(
        {"unsubscribe_token": token},
        {"$set": {"is_active": False}},
    )
    logger.info(f"[Newsletter] Désinscription : {subscription.get('email')}")

    html = """<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Désinscription confirmée — La Citadelle Numérique</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #0F2747;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(201,164,92,0.3);
      border-radius: 20px;
      padding: 48px 40px;
      text-align: center;
      max-width: 480px;
      width: 100%;
    }
    .icon {
      width: 64px; height: 64px;
      background: rgba(201,164,92,0.15);
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 24px;
      font-size: 28px;
    }
    h1 { color: #C9A45C; font-size: 22px; font-weight: 700; margin-bottom: 12px; }
    p { color: rgba(255,255,255,0.65); line-height: 1.6; font-size: 14px; margin-bottom: 12px; }
    a {
      display: inline-block;
      margin-top: 24px;
      padding: 12px 28px;
      background: rgba(201,164,92,0.15);
      border: 1px solid rgba(201,164,92,0.4);
      color: #C9A45C;
      text-decoration: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h1>Désinscription confirmée</h1>
    <p>Vous avez bien été désinscrit de la newsletter de <strong style="color:white;">La Citadelle Numérique</strong>.</p>
    <p>Vous ne recevrez plus les alertes hebdomadaires de nouvelles annonces.</p>
    <p>Vous pouvez vous réinscrire à tout moment depuis le site.</p>
    <a href="/citadelle">← Retour à La Citadelle Numérique</a>
  </div>
</body>
</html>"""

    return HTMLResponse(content=html)


# ── Routes admin ───────────────────────────────────────────────────────────────

@router.get("/admin/newsletter/subscribers", summary="Admin — Liste des abonnés")
async def admin_list_subscribers(current_user: dict = Depends(require_admin)):
    """Admin : retourne tous les abonnés avec statistiques."""
    subscribers = await db.citadelle_newsletter_subscriptions.find(
        {}, {"_id": 0}
    ).sort("subscribed_at", -1).to_list(10000)

    total = len(subscribers)
    active = sum(1 for s in subscribers if s.get("is_active"))

    return {
        "stats": {"total": total, "active": active, "inactive": total - active},
        "subscribers": subscribers,
    }


@router.delete(
    "/admin/newsletter/subscribers/{sub_id}",
    summary="Admin — Supprimer un abonné",
)
async def admin_delete_subscriber(
    sub_id: str,
    current_user: dict = Depends(require_admin),
):
    """Admin : supprime définitivement un abonnement."""
    result = await db.citadelle_newsletter_subscriptions.delete_one({"id": sub_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Abonné introuvable.")
    return {"message": "Abonné supprimé avec succès."}


@router.get("/admin/newsletter/config", summary="Admin — Configuration newsletter")
async def admin_get_config(current_user: dict = Depends(require_admin)):
    """Admin : retourne la configuration du scheduler newsletter."""
    config = await get_or_create_config()
    return config


@router.patch("/admin/newsletter/config", summary="Admin — Modifier la configuration")
async def admin_update_config(
    data: NewsletterConfigUpdate,
    current_user: dict = Depends(require_admin),
):
    """
    Admin : met à jour la configuration du scheduler.
    Reprogramme le job APScheduler si le jour ou l'heure ont changé.
    """
    updates = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not updates:
        return await get_or_create_config()

    # Validation
    if "frequency" in updates and updates["frequency"] not in ("weekly", "biweekly", "monthly"):
        raise HTTPException(status_code=400, detail="Fréquence invalide. Valeurs acceptées : weekly, biweekly, monthly.")
    if "day_of_week" in updates and not (0 <= updates["day_of_week"] <= 6):
        raise HTTPException(status_code=400, detail="Jour de semaine invalide (0-6).")
    if "hour" in updates and not (0 <= updates["hour"] <= 23):
        raise HTTPException(status_code=400, detail="Heure invalide (0-23).")
    if "max_listings" in updates and not (1 <= updates["max_listings"] <= 50):
        raise HTTPException(status_code=400, detail="Nombre d'annonces invalide (1-50).")

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.citadelle_newsletter_config.update_one(
        {"id": "main"}, {"$set": updates}, upsert=True
    )
    updated = await db.citadelle_newsletter_config.find_one({"id": "main"}, {"_id": 0})

    # Reprogrammation si paramètres d'horaire modifiés
    if "day_of_week" in updates or "hour" in updates:
        reschedule_newsletter_job(
            day_of_week=updated.get("day_of_week", 4),
            hour=updated.get("hour", 16),
        )

    return updated


@router.post("/admin/newsletter/send-now", summary="Admin — Envoi immédiat")
async def admin_send_now(current_user: dict = Depends(require_admin)):
    """Admin : déclenche l'envoi immédiat du digest sans respecter la fréquence ni le filtre de date."""
    import asyncio
    asyncio.create_task(run_newsletter_digest(force=True))
    return {"message": "Envoi du digest déclenché. Les emails partiront dans quelques instants."}


@router.get(
    "/admin/newsletter/preview",
    summary="Admin — Prévisualisation HTML de l'email",
)
async def admin_preview_email(current_user: dict = Depends(require_admin)):
    """Admin : retourne l'aperçu HTML de l'email newsletter avec les annonces actives."""
    cursor = db.citadelle_listings.find(
        {"status": "active"},
        {
            "_id": 0,
            "id": 1,
            "title": 1,
            "type": 1,
            "price": 1,
            "images": 1,
            "slug": 1,
            "short_description": 1,
        },
    ).sort("created_at", -1).limit(5)

    listings = await cursor.to_list(5)

    blog_sections = await fetch_blog_sections(since_iso=None)

    html = build_newsletter_html(
        listings=listings,
        unsubscribe_token="PREVIEW",
        period_days=7,
        is_preview=True,
        blog_sections=blog_sections,
    )
    return HTMLResponse(content=html)


# ── Tracking (routes publiques, sans auth) ─────────────────────────────────────

# Pixel GIF transparent 1x1 (binaire constant)
_TRACKING_PIXEL_GIF = bytes([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
    0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
    0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
    0x01, 0x00, 0x3b,
])


@router.get("/newsletter/pixel/{history_id}", summary="Tracking — Pixel d'ouverture")
async def track_open(history_id: str):
    """
    Pixel de tracking 1×1. Incrémente le compteur d'ouvertures d'une newsletter.
    Route publique — accessible depuis les clients email.
    """
    await db.citadelle_newsletter_history.update_one(
        {"id": history_id}, {"$inc": {"opens": 1}}
    )
    return Response(
        content=_TRACKING_PIXEL_GIF,
        media_type="image/gif",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate, private",
            "Pragma": "no-cache",
            "Expires": "0",
        },
    )


@router.get("/newsletter/click/{history_id}", summary="Tracking — Redirecteur de clic")
async def track_click(history_id: str, url: str = Query(default="")):
    """
    Redirecteur de clic. Incrémente le compteur de clics puis redirige vers l'URL cible.
    Route publique — accessible depuis les clients email.
    """
    await db.citadelle_newsletter_history.update_one(
        {"id": history_id}, {"$inc": {"clicks": 1}}
    )
    target_url = unquote(url) if url else f"/citadelle/annonces"
    return RedirectResponse(url=target_url, status_code=302)


# ── Historique admin ───────────────────────────────────────────────────────────

@router.get("/admin/newsletter/history", summary="Admin — Historique des envois")
async def admin_get_history(current_user: dict = Depends(require_admin)):
    """Admin : retourne la liste des newsletters envoyées avec leurs statistiques."""
    history = await db.citadelle_newsletter_history.find(
        {},
        {
            "_id": 0,
            "listings_snapshot": 0,  # Exclu du listing pour alléger la réponse
        },
    ).sort("sent_at", -1).to_list(200)
    return {"history": history}


@router.get(
    "/admin/newsletter/history/{history_id}/preview",
    summary="Admin — Prévisualisation d'un ancien envoi",
)
async def admin_history_preview(
    history_id: str,
    current_user: dict = Depends(require_admin),
):
    """Admin : reconstitue et retourne le HTML d'une newsletter précédemment envoyée."""
    record = await db.citadelle_newsletter_history.find_one(
        {"id": history_id}, {"_id": 0}
    )
    if not record:
        raise HTTPException(status_code=404, detail="Historique introuvable.")

    listings = record.get("listings_snapshot", [])
    blog_sections = record.get("blog_sections_snapshot") or await fetch_blog_sections(since_iso=None)
    html = build_newsletter_html(
        listings=listings,
        unsubscribe_token="PREVIEW",
        period_days=record.get("period_days", 7),
        is_preview=True,
        blog_sections=blog_sections,
    )
    return HTMLResponse(content=html)
