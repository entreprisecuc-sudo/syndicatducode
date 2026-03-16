"""
Modèles pour la gestion des factures
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Statuts de facture
INVOICE_STATUSES = {
    "pending": "En attente",
    "validated": "Validée", 
    "paid": "Payée",
    "rejected": "Rejetée"
}

class BillingAmountUpdate(BaseModel):
    """Modèle pour définir le montant à facturer (admin)"""
    amount: float = Field(..., ge=0, description="Montant à facturer en euros")
    note: Optional[str] = Field(None, max_length=500, description="Note optionnelle")


class InvoiceCreate(BaseModel):
    """Modèle pour soumettre une facture (utilisateur)"""
    amount: float = Field(..., gt=0, description="Montant de la facture")
    invoice_number: Optional[str] = Field(None, max_length=100, description="Numéro de facture")
    description: Optional[str] = Field(None, max_length=500, description="Description")


class InvoiceStatusUpdate(BaseModel):
    """Modèle pour mettre à jour le statut d'une facture (admin)"""
    status: str = Field(..., pattern="^(pending|validated|paid|rejected)$")
    admin_note: Optional[str] = Field(None, max_length=500)


class InvoiceResponse(BaseModel):
    """Modèle de réponse pour une facture"""
    id: str
    user_id: str
    amount: float
    invoice_number: Optional[str]
    description: Optional[str]
    file_url: str
    file_name: str
    status: str
    status_label: str
    admin_note: Optional[str]
    created_at: str
    updated_at: str
    validated_at: Optional[str]
    paid_at: Optional[str]
