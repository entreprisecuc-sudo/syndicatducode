"""
Route settings — La Citadelle Numérique
Paramètres configurables de la plateforme (commission, etc.)
"""

import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

logger = logging.getLogger(__name__)

router = APIRouter()
db = None

def set_database(database):
    global db
    db = database

# ── Clé unique du document commission ─────────────────────────────────────────
_COMMISSION_KEY = "commission"

# ── Valeurs par défaut ─────────────────────────────────────────────────────────
_COMMISSION_DEFAULT = {"rate": 0.05, "minimum_eur": 49}


# ── Dépendance admin ──────────────────────────────────────────────────────────
from routes.citadelle.dependencies import require_admin

# require_admin importé depuis routes/citadelle/dependencies (DRY)


# ── Modèles ────────────────────────────────────────────────────────────────────

class CommissionSettings(BaseModel):
    rate: float = Field(..., gt=0, le=1, description="Taux de commission (ex: 0.05 pour 5 %)")
    minimum_eur: float = Field(..., gt=0, description="Montant minimum en euros")


class CommissionSettingsResponse(BaseModel):
    rate: float
    minimum_eur: float
    updated_at: Optional[str] = None


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get(
    "/settings/commission",
    response_model=CommissionSettingsResponse,
    summary="Paramètres commission — lecture publique",
)
async def get_commission_settings():
    """
    Retourne les paramètres de commission actifs.
    Accessible publiquement (utilisé dans le formulaire de publication).
    """
    doc = await db.citadelle_settings.find_one(
        {"key": _COMMISSION_KEY}, {"_id": 0}
    )
    if doc:
        return CommissionSettingsResponse(
            rate=doc["rate"],
            minimum_eur=doc["minimum_eur"],
            updated_at=doc.get("updated_at"),
        )
    # Retour des valeurs par défaut si non configuré
    return CommissionSettingsResponse(**_COMMISSION_DEFAULT)


@router.put(
    "/admin/settings/commission",
    response_model=CommissionSettingsResponse,
    summary="Admin — Mettre à jour les paramètres de commission",
)
async def update_commission_settings(
    data: CommissionSettings,
    current_user: dict = Depends(require_admin),
):
    """
    Met à jour le taux et le minimum de commission.
    Crée le document s'il n'existe pas.
    """
    now = datetime.now(timezone.utc).isoformat()
    update = {
        "key": _COMMISSION_KEY,
        "rate": data.rate,
        "minimum_eur": data.minimum_eur,
        "updated_at": now,
        "updated_by": current_user.get("email", "admin"),
    }
    await db.citadelle_settings.update_one(
        {"key": _COMMISSION_KEY},
        {"$set": update},
        upsert=True,
    )
    logger.info(
        f"[Citadelle Admin] Commission mise à jour — "
        f"taux: {data.rate * 100:.2f}%, minimum: {data.minimum_eur} € "
        f"par {current_user.get('email')}"
    )
    return CommissionSettingsResponse(
        rate=data.rate,
        minimum_eur=data.minimum_eur,
        updated_at=now,
    )
