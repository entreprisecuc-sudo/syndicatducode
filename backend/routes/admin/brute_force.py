"""
Routes admin - Protection Anti-Brute Force
Gestion de la configuration et des entités bloquées
"""

from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from pydantic import BaseModel
import logging

from middleware.auth import RoleChecker

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/brute-force", tags=["Brute Force"])
admin_only = RoleChecker(["admin"])

db = None


def set_database(database):
    """Injecte la connexion à la base de données"""
    global db
    db = database


# ============================================
# MODÈLES
# ============================================

class BruteForceConfigUpdate(BaseModel):
    max_attempts: int
    block_duration_minutes: int
    window_minutes: int
    is_active: bool


class UnblockRequest(BaseModel):
    ip: str


# ============================================
# ROUTES
# ============================================

@router.get("/config", dependencies=[Depends(admin_only)])
async def get_config():
    """Récupère la configuration anti-brute force"""
    config = await db.brute_force_config.find_one({}, {"_id": 0})
    if not config:
        return {
            "max_attempts": 5,
            "block_duration_minutes": 15,
            "window_minutes": 5,
            "is_active": True
        }
    return config


@router.put("/config", dependencies=[Depends(admin_only)])
async def update_config(config: BruteForceConfigUpdate):
    """Met à jour la configuration anti-brute force"""
    if not (1 <= config.max_attempts <= 20):
        raise HTTPException(status_code=400, detail="max_attempts doit être entre 1 et 20")
    if not (1 <= config.block_duration_minutes <= 30):
        raise HTTPException(status_code=400, detail="block_duration_minutes doit être entre 1 et 30")
    if not (1 <= config.window_minutes <= 30):
        raise HTTPException(status_code=400, detail="window_minutes doit être entre 1 et 30")

    await db.brute_force_config.update_one(
        {},
        {"$set": config.model_dump()},
        upsert=True
    )
    logger.info(f"Config brute force mise à jour: {config.model_dump()}")
    return {"message": "Configuration mise à jour avec succès"}


@router.get("/blocked", dependencies=[Depends(admin_only)])
async def get_blocked_entities():
    """Liste les entités actuellement bloquées"""
    now = datetime.now(timezone.utc).isoformat()
    blocked = await db.blocked_ips.find(
        {"blocked_until": {"$gt": now}},
        {"_id": 0}
    ).sort("blocked_at", -1).to_list(100)
    return {"blocked": blocked, "count": len(blocked)}


@router.post("/unblock", dependencies=[Depends(admin_only)])
async def unblock_entity(data: UnblockRequest):
    """Débloque manuellement une IP"""
    result = await db.blocked_ips.delete_one({"ip": data.ip})
    await db.login_attempts.delete_many({"ip": data.ip})

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="IP non trouvée dans la liste des entités bloquées"
        )

    logger.info(f"IP débloquée manuellement par admin: {data.ip}")
    return {"message": f"IP {data.ip} débloquée avec succès"}
