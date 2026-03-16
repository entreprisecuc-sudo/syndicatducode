"""
Routes de gestion des factures
- Utilisateurs : voir montant à facturer, uploader facture
- Admin : définir montant, valider/payer factures
"""

from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from datetime import datetime, timezone
from typing import Optional
import uuid
import os
import logging

from middleware.auth import get_current_user, RoleChecker
from models.invoice import (
    BillingAmountUpdate, 
    InvoiceCreate, 
    InvoiceStatusUpdate,
    INVOICE_STATUSES
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/invoices", tags=["Factures"])

# Middleware admin
admin_only = RoleChecker(["admin"])

# Variable globale pour la base de données
db = None

# Dossier pour stocker les factures
UPLOAD_DIR = "/app/backend/uploads/invoices"

def set_database(database):
    """Injecte la connexion à la base de données"""
    global db
    db = database
    # Créer le dossier uploads si nécessaire
    os.makedirs(UPLOAD_DIR, exist_ok=True)


# ============================================
# ROUTES UTILISATEUR
# ============================================

@router.get("/my-billing")
async def get_my_billing_info(current_user: dict = Depends(get_current_user)):
    """
    Récupère les informations de facturation de l'utilisateur connecté
    - Montant à facturer (défini par l'admin)
    - Liste des factures soumises
    """
    user_id = current_user["sub"]
    
    # Récupérer le montant à facturer
    billing = await db.user_billing.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )
    
    amount_to_invoice = billing.get("amount", 0) if billing else 0
    billing_note = billing.get("note", "") if billing else ""
    
    # Récupérer les factures soumises
    invoices = await db.invoices.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    # Ajouter le label de statut
    for inv in invoices:
        inv["status_label"] = INVOICE_STATUSES.get(inv.get("status"), "Inconnu")
    
    # Calculer le total facturé et payé
    total_invoiced = sum(inv.get("amount", 0) for inv in invoices if inv.get("status") != "rejected")
    total_paid = sum(inv.get("amount", 0) for inv in invoices if inv.get("status") == "paid")
    
    return {
        "amount_to_invoice": amount_to_invoice,
        "billing_note": billing_note,
        "total_invoiced": total_invoiced,
        "total_paid": total_paid,
        "invoices": invoices
    }


@router.post("/submit")
async def submit_invoice(
    amount: float = Form(...),
    invoice_number: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Soumettre une nouvelle facture (avec fichier PDF ou Excel)
    """
    user_id = current_user["sub"]
    
    # Vérifier le format du fichier
    allowed_extensions = [".pdf", ".xlsx", ".xls"]
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Format non autorisé. Formats acceptés: PDF, Excel (.xlsx, .xls)"
        )
    
    # Vérifier la taille (max 10 Mo)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le fichier ne doit pas dépasser 10 Mo"
        )
    
    # Générer un nom unique pour le fichier
    invoice_id = str(uuid.uuid4())
    safe_filename = f"{invoice_id}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    # Sauvegarder le fichier
    with open(file_path, "wb") as f:
        f.write(content)
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Créer l'entrée en base
    invoice_doc = {
        "id": invoice_id,
        "user_id": user_id,
        "user_email": current_user.get("email"),
        "amount": amount,
        "invoice_number": invoice_number,
        "description": description,
        "file_url": f"/uploads/invoices/{safe_filename}",
        "file_name": file.filename,
        "status": "pending",
        "admin_note": None,
        "created_at": now,
        "updated_at": now,
        "validated_at": None,
        "paid_at": None
    }
    
    await db.invoices.insert_one(invoice_doc)
    
    # Notification admin
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "type": "invoice_submitted",
        "title": "Nouvelle facture soumise",
        "message": f"{current_user.get('email')} a soumis une facture de {amount}€",
        "data": {
            "invoice_id": invoice_id,
            "user_id": user_id,
            "amount": amount
        },
        "read": False,
        "created_at": now
    })
    
    logger.info(f"Facture soumise par {current_user.get('email')}: {amount}€")
    
    return {
        "message": "Facture soumise avec succès",
        "invoice_id": invoice_id
    }


@router.get("/my-invoices")
async def get_my_invoices(current_user: dict = Depends(get_current_user)):
    """
    Liste les factures de l'utilisateur connecté
    """
    user_id = current_user["sub"]
    
    invoices = await db.invoices.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for inv in invoices:
        inv["status_label"] = INVOICE_STATUSES.get(inv.get("status"), "Inconnu")
    
    return {"invoices": invoices}


# ============================================
# ROUTES ADMIN
# ============================================

@router.put("/admin/user/{user_id}/billing", dependencies=[Depends(admin_only)])
async def set_user_billing_amount(
    user_id: str,
    data: BillingAmountUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Définir le montant à facturer pour un utilisateur (admin)
    """
    # Vérifier que l'utilisateur existe
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Upsert le montant de facturation
    await db.user_billing.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "user_id": user_id,
                "amount": data.amount,
                "note": data.note,
                "updated_at": now,
                "updated_by": current_user["sub"]
            },
            "$setOnInsert": {
                "created_at": now
            }
        },
        upsert=True
    )
    
    # Log admin
    await db.admin_logs.insert_one({
        "admin_id": current_user["sub"],
        "action": "SET_BILLING_AMOUNT",
        "details": f"Montant défini pour {user.get('email')}: {data.amount}€",
        "timestamp": now
    })
    
    logger.info(f"Montant de facturation défini pour {user_id}: {data.amount}€")
    
    return {"message": f"Montant à facturer défini: {data.amount}€"}


@router.get("/admin/user/{user_id}/billing", dependencies=[Depends(admin_only)])
async def get_user_billing_info(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Récupère les informations de facturation d'un utilisateur (admin)
    """
    # Montant à facturer
    billing = await db.user_billing.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )
    
    # Factures de l'utilisateur
    invoices = await db.invoices.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for inv in invoices:
        inv["status_label"] = INVOICE_STATUSES.get(inv.get("status"), "Inconnu")
    
    # Stats
    total_invoiced = sum(inv.get("amount", 0) for inv in invoices if inv.get("status") != "rejected")
    total_paid = sum(inv.get("amount", 0) for inv in invoices if inv.get("status") == "paid")
    pending_count = sum(1 for inv in invoices if inv.get("status") == "pending")
    
    return {
        "amount_to_invoice": billing.get("amount", 0) if billing else 0,
        "billing_note": billing.get("note", "") if billing else "",
        "total_invoiced": total_invoiced,
        "total_paid": total_paid,
        "pending_count": pending_count,
        "invoices": invoices
    }


@router.put("/admin/{invoice_id}/status", dependencies=[Depends(admin_only)])
async def update_invoice_status(
    invoice_id: str,
    data: InvoiceStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Mettre à jour le statut d'une facture (admin)
    """
    invoice = await db.invoices.find_one({"id": invoice_id})
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Facture non trouvée"
        )
    
    now = datetime.now(timezone.utc).isoformat()
    
    update_data = {
        "status": data.status,
        "updated_at": now
    }
    
    if data.admin_note:
        update_data["admin_note"] = data.admin_note
    
    # Timestamps spécifiques
    if data.status == "validated":
        update_data["validated_at"] = now
    elif data.status == "paid":
        update_data["paid_at"] = now
    
    await db.invoices.update_one(
        {"id": invoice_id},
        {"$set": update_data}
    )
    
    # Log admin
    status_label = INVOICE_STATUSES.get(data.status, data.status)
    await db.admin_logs.insert_one({
        "admin_id": current_user["sub"],
        "action": "UPDATE_INVOICE_STATUS",
        "details": f"Facture {invoice_id} → {status_label}",
        "timestamp": now
    })
    
    logger.info(f"Statut facture {invoice_id} mis à jour: {data.status}")
    
    return {"message": f"Statut mis à jour: {status_label}"}


@router.get("/admin/all", dependencies=[Depends(admin_only)])
async def get_all_invoices(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Liste toutes les factures (admin)
    """
    query = {}
    if status:
        query["status"] = status
    
    invoices = await db.invoices.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    
    # Enrichir avec les infos utilisateur
    for inv in invoices:
        inv["status_label"] = INVOICE_STATUSES.get(inv.get("status"), "Inconnu")
        
        user = await db.users.find_one(
            {"id": inv.get("user_id")},
            {"_id": 0, "id": 1, "email": 1, "role": 1}
        )
        profile = await db.profiles.find_one(
            {"user_id": inv.get("user_id")},
            {"_id": 0, "first_name": 1, "last_name": 1}
        )
        inv["user"] = {
            **(user or {}),
            **(profile or {})
        }
    
    return {"invoices": invoices}


@router.delete("/admin/{invoice_id}", dependencies=[Depends(admin_only)])
async def delete_invoice(
    invoice_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Supprimer une facture (admin)
    """
    invoice = await db.invoices.find_one({"id": invoice_id})
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Facture non trouvée"
        )
    
    # Supprimer le fichier
    file_path = f"/app/backend{invoice.get('file_url', '')}"
    if os.path.exists(file_path):
        os.remove(file_path)
    
    # Supprimer l'entrée
    await db.invoices.delete_one({"id": invoice_id})
    
    # Log admin
    await db.admin_logs.insert_one({
        "admin_id": current_user["sub"],
        "action": "DELETE_INVOICE",
        "details": f"Facture {invoice_id} supprimée",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Facture supprimée"}
