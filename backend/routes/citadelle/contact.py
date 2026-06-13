"""
Route contact — La Citadelle Numérique
Formulaire de contact public → email à l'équipe Citadelle
"""

import logging
from fastapi import APIRouter
from pydantic import BaseModel, EmailStr, Field

from services.email_service import send_citadelle_contact_email

logger = logging.getLogger(__name__)

router = APIRouter()


class ContactForm(BaseModel):
    nom: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    sujet: str = Field(..., min_length=3, max_length=150)
    message: str = Field(..., min_length=10, max_length=2000)


@router.post("/contact", summary="Formulaire de contact public", status_code=200)
async def contact(data: ContactForm):
    """Envoie le message de contact à l'équipe La Citadelle Numérique."""
    envoye = send_citadelle_contact_email(
        nom=data.nom,
        email=data.email,
        sujet=data.sujet,
        message=data.message,
    )
    if not envoye:
        logger.warning(f"[Citadelle Contact] Échec envoi email depuis {data.email}")
    return {"success": True, "message": "Votre message a bien été envoyé. Nous vous répondrons sous 48h."}
