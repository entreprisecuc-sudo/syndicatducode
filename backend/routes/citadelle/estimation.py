"""
Routes Estimateur Pro — La Citadelle Numérique
Gestion des demandes d'estimation professionnelle de business digitaux
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime, timezone
import uuid
import logging

from routes.citadelle.dependencies import require_admin

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Citadelle Estimation"])

db = None

def set_database(database):
    global db
    db = database


class EstimationRequest(BaseModel):
    nom: str = Field(..., min_length=2, max_length=80)
    email: EmailStr
    url_site: Optional[str] = Field(None, max_length=255)
    type_site: str = Field(..., max_length=50)
    benefice_mensuel: Optional[float] = Field(None, ge=0)
    ca_mensuel: Optional[float] = Field(None, ge=0)
    message: Optional[str] = Field(None, max_length=1000)


@router.post("/estimation/request", summary="Demande d'estimation professionnelle")
async def create_estimation_request(data: EstimationRequest):
    doc = {
        "id": str(uuid.uuid4()),
        "nom": data.nom,
        "email": data.email,
        "url_site": data.url_site,
        "type_site": data.type_site,
        "benefice_mensuel": data.benefice_mensuel,
        "ca_mensuel": data.ca_mensuel,
        "message": data.message,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.citadelle_estimation_requests.insert_one(doc)
    logger.info(f"Nouvelle demande d'estimation : {data.email} — {data.type_site}")
    return {"message": "Votre demande a bien été envoyée. Notre équipe vous contacte sous 48h.", "id": doc["id"]}


@router.get("/admin/estimation-requests", summary="Liste des demandes d'estimation — admin")
async def list_estimation_requests(admin=Depends(require_admin)):
    requests = await db.citadelle_estimation_requests.find(
        {}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return requests
