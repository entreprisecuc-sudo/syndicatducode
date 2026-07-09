"""
Analytics — La Citadelle Numérique + Syndicat du Code.
Suivi léger, first-party et respectueux du RGPD (IP hachée, jamais stockée en clair).
LOT 1 : visiteurs uniques, pages vues, utilisateurs actifs, courbe temporelle,
top pages, conversations entamées par annonce.
"""

import os
import uuid
import hashlib
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field

from middleware.auth import get_current_user_optional
from routes.citadelle.dependencies import require_admin

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Citadelle Analytics"])

_db = None


def set_database(database):
    global _db
    _db = database


COLLECTION = "citadelle_analytics_events"
# Sel de hachage : réutilise le secret JWT existant (aucun hardcoding, aucune nouvelle variable)
_SALT = os.environ.get("JWT_SECRET_KEY", "")
_BOT_MARKERS = ("bot", "spider", "crawl", "slurp", "preview", "monitor", "curl", "python-requests", "headless")
_PERIODS = {"24h": timedelta(hours=24), "7d": timedelta(days=7), "30d": timedelta(days=30), "90d": timedelta(days=90)}


def _hash_ip(ip: str) -> str:
    return hashlib.sha256(f"{_SALT}:{ip}".encode()).hexdigest()[:32]


def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _scope_from_path(path: str) -> str:
    return "citadelle" if path.startswith("/citadelle") else "syndicat"


def _device_from_ua(ua: str) -> str:
    ua = (ua or "").lower()
    return "mobile" if any(k in ua for k in ("mobile", "android", "iphone", "ipad")) else "desktop"


def _period_start(period: str) -> str:
    return (datetime.now(timezone.utc) - _PERIODS.get(period, _PERIODS["7d"])).isoformat()


def _match(period: str, scope: str) -> dict:
    m = {"created_at": {"$gte": _period_start(period)}}
    if scope in ("citadelle", "syndicat"):
        m["scope"] = scope
    return m


class TrackInput(BaseModel):
    session_id: str = Field(..., min_length=6, max_length=64)
    path: str = Field(..., min_length=1, max_length=300)
    referrer: Optional[str] = Field(None, max_length=500)


@router.post("/analytics/track", summary="Enregistrer une page vue (public, RGPD-friendly)")
async def track_event(data: TrackInput, request: Request, user=Depends(get_current_user_optional)):
    path = data.path.split("?")[0][:300]
    # Ne jamais suivre les espaces d'administration
    if path.startswith("/syndicat-admin") or path.startswith("/admin"):
        return {"ok": True, "skipped": "admin"}

    ua = request.headers.get("user-agent", "")
    if any(b in ua.lower() for b in _BOT_MARKERS):
        return {"ok": True, "skipped": "bot"}

    doc = {
        "id": str(uuid.uuid4()),
        "session_id": data.session_id,
        "path": path,
        "referrer": (data.referrer or "")[:500],
        "ip_hash": _hash_ip(_client_ip(request)),
        "user_id": user.get("sub") if user else None,
        "is_authenticated": bool(user),
        "device": _device_from_ua(ua),
        "scope": _scope_from_path(path),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await _db[COLLECTION].insert_one(doc)
    return {"ok": True}


@router.get("/admin/analytics/overview", summary="Admin — KPIs analytics")
async def analytics_overview(period: str = "7d", scope: str = "all", current_user: dict = Depends(require_admin)):
    events = _db[COLLECTION]
    match = _match(period, scope)
    start = _period_start(period)

    page_views = await events.count_documents(match)
    unique_visitors = len(await events.distinct("ip_hash", match))
    sessions = len(await events.distinct("session_id", match))
    active_users = len([u for u in await events.distinct("user_id", {**match, "is_authenticated": True}) if u])
    authenticated_views = await events.count_documents({**match, "is_authenticated": True})

    # Conversations pré-vente entamées sur la période (indépendant du scope : propre à la Citadelle)
    conversations_started = await _db.citadelle_conversations.count_documents({"created_at": {"$gte": start}})

    # Répartition appareils
    devices = {}
    for d in ("mobile", "desktop"):
        devices[d] = await events.count_documents({**match, "device": d})

    return {
        "period": period,
        "scope": scope,
        "page_views": page_views,
        "unique_visitors": unique_visitors,
        "sessions": sessions,
        "active_users": active_users,
        "authenticated_views": authenticated_views,
        "conversations_started": conversations_started,
        "devices": devices,
    }


@router.get("/admin/analytics/timeseries", summary="Admin — Vues et visiteurs par jour")
async def analytics_timeseries(period: str = "7d", scope: str = "all", current_user: dict = Depends(require_admin)):
    pipeline = [
        {"$match": _match(period, scope)},
        {"$group": {
            "_id": {"$substrCP": ["$created_at", 0, 10]},
            "views": {"$sum": 1},
            "visitors": {"$addToSet": "$ip_hash"},
        }},
        {"$project": {"day": "$_id", "views": 1, "visitors": {"$size": "$visitors"}, "_id": 0}},
        {"$sort": {"day": 1}},
    ]
    series = await _db[COLLECTION].aggregate(pipeline).to_list(200)
    return {"series": series}


@router.get("/admin/analytics/top-pages", summary="Admin — Pages les plus vues")
async def analytics_top_pages(period: str = "7d", scope: str = "all", limit: int = 15, current_user: dict = Depends(require_admin)):
    pipeline = [
        {"$match": _match(period, scope)},
        {"$group": {
            "_id": "$path",
            "views": {"$sum": 1},
            "visitors": {"$addToSet": "$ip_hash"},
        }},
        {"$project": {"path": "$_id", "views": 1, "visitors": {"$size": "$visitors"}, "_id": 0}},
        {"$sort": {"views": -1}},
        {"$limit": min(max(limit, 1), 50)},
    ]
    pages = await _db[COLLECTION].aggregate(pipeline).to_list(50)
    return {"pages": pages}


@router.get("/admin/analytics/listings-engagement", summary="Admin — Conversations entamées par annonce")
async def listings_engagement(limit: int = 20, current_user: dict = Depends(require_admin)):
    pipeline = [
        {"$group": {
            "_id": "$listing_id",
            "conversations": {"$sum": 1},
            "listing_title": {"$first": "$listing_title"},
            "listing_slug": {"$first": "$listing_slug"},
            "last_activity": {"$max": "$updated_at"},
        }},
        {"$project": {"listing_id": "$_id", "conversations": 1, "listing_title": 1, "listing_slug": 1, "last_activity": 1, "_id": 0}},
        {"$sort": {"conversations": -1}},
        {"$limit": min(max(limit, 1), 50)},
    ]
    listings = await _db.citadelle_conversations.aggregate(pipeline).to_list(50)
    return {"listings": listings}
