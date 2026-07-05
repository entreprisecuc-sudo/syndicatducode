"""
Module Transmission d'actif — La Citadelle Numérique (La Garde).
Réservé aux administrateurs pour la saisie. PDF accessible admin + acheteur + vendeur.
Champs sensibles chiffrés au repos, jamais loggés.
"""
import io
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from config.settings import CITADELLE_URL
from utils.crypto import encrypt_value, decrypt_value
from routes.citadelle.transmission_schema import (
    get_access_schema, is_sensitive, SECTIONS, DEFAULT_CHECKLIST, RECOMMENDED_SERVICES,
)
from services.transmission_pdf import build_attestation_pdf

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Transmission d'actif — La Garde"])

db = None


def set_database(database):
    global db
    db = database


# ── Auth helpers ──────────────────────────────────────────────────────────
async def _current_user(request: Request) -> dict:
    from services.auth_service import decode_access_token
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentification requise.")
    payload = decode_access_token(auth.replace("Bearer ", "").strip())
    if not payload:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré.")
    return payload


async def _admin(request: Request) -> dict:
    user = await _current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs.")
    return user


async def _next_dossier_number() -> str:
    year = datetime.now(timezone.utc).year
    counter = await db.citadelle_counters.find_one_and_update(
        {"_id": f"transmission_{year}"},
        {"$inc": {"seq": 1}}, upsert=True, return_document=True,
    )
    return f"TR-{year}-{str(counter.get('seq', 1)).zfill(5)}"


def _verify_url(dossier: str) -> str:
    return f"{CITADELLE_URL}/verifier-transmission/{dossier}"


# ── Sérialisation ───────────────────────────────────────────────────────────
def _encrypt_access(access: dict) -> dict:
    out = {}
    for sec_key, fields in (access or {}).items():
        out[sec_key] = {}
        for fkey, val in (fields or {}).items():
            if val and is_sensitive(sec_key, fkey):
                out[sec_key][fkey] = encrypt_value(val)
            else:
                out[sec_key][fkey] = val or ""
    return out


def _decrypt_access(access: dict) -> dict:
    out = {}
    for sec_key, fields in (access or {}).items():
        out[sec_key] = {}
        for fkey, val in (fields or {}).items():
            if val and is_sensitive(sec_key, fkey):
                out[sec_key][fkey] = decrypt_value(val)
            else:
                out[sec_key][fkey] = val or ""
    return out


def _public_doc(doc: dict, decrypt: bool = False) -> dict:
    """Représentation renvoyée à l'admin (accès déchiffrés pour édition si decrypt=True)."""
    d = {k: v for k, v in doc.items() if k != "_id"}
    d["access"] = _decrypt_access(doc.get("access", {})) if decrypt else doc.get("access", {})
    return d


def _pdf_data(doc: dict) -> dict:
    return {
        "dossier_number": doc.get("dossier_number", ""),
        "general": doc.get("general", {}),
        "asset": doc.get("asset", {}),
        "access": _decrypt_access(doc.get("access", {})),
        "checklist": doc.get("checklist", {}),
        "observations": doc.get("observations", ""),
        "recommended_services": doc.get("recommended_services", []),
    }


# ── Schéma dynamique ─────────────────────────────────────────────────────────
@router.get("/admin/transmissions/schema/{asset_type}")
async def get_schema(asset_type: str, request: Request):
    await _admin(request)
    return {
        "asset_type": asset_type,
        "sections": get_access_schema(asset_type),
        "checklist": DEFAULT_CHECKLIST,
        "services": RECOMMENDED_SERVICES,
    }


# ── Création depuis une transaction ──────────────────────────────────────────
class CreateBody(BaseModel):
    transaction_id: str


@router.post("/admin/transmissions")
async def create_transmission(body: CreateBody, request: Request):
    await _admin(request)
    existing = await db.citadelle_transmissions.find_one({"transaction_id": body.transaction_id})
    if existing:
        return _public_doc(existing, decrypt=True)

    tx = await db.citadelle_transactions.find_one({"id": body.transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable.")

    buyer = await db.users.find_one({"id": tx.get("buyer_id")}, {"_id": 0}) or {}
    seller = await db.users.find_one({"id": tx.get("seller_id")}, {"_id": 0}) or {}
    listing = await db.citadelle_listings.find_one({"id": tx.get("listing_id")}, {"_id": 0}) or {}

    def _name(u):
        return f"{u.get('first_name', '')} {u.get('last_name', '')}".strip() or u.get("email", "")

    asset_type = listing.get("type", "")
    from config.settings import CITADELLE_URL as _c  # noqa
    price = tx.get("payment_amount") or tx.get("offer_amount") or 0
    now = datetime.now(timezone.utc).isoformat()
    dossier = await _next_dossier_number()

    doc = {
        "id": str(uuid.uuid4()),
        "dossier_number": dossier,
        "transaction_id": body.transaction_id,
        "status": "draft",
        "asset_type": asset_type,
        "buyer_id": tx.get("buyer_id", ""),
        "seller_id": tx.get("seller_id", ""),
        "buyer_email": buyer.get("email", ""),
        "seller_email": seller.get("email", ""),
        "general": {
            "transaction_ref": body.transaction_id,
            "date": now,
            "buyer": _name(buyer),
            "seller": _name(seller),
            "price": float(price),
            "commission": float(tx.get("commission") or 0),
            "asset_type": asset_type,
            "asset_type_label": asset_type,
            "asset_title": listing.get("title", ""),
        },
        "asset": {
            "name": listing.get("title", ""),
            "url": listing.get("url") or listing.get("website_url") or "",
            "description": "",
            "category": asset_type,
            "creation_date": "",
            "technologies": "",
            "version": "",
        },
        "access": {},
        "checklist": {},
        "observations": "",
        "recommended_services": [],
        "created_at": now,
        "updated_at": now,
        "finalized_at": None,
    }
    await db.citadelle_transmissions.insert_one(doc)
    logger.info(f"[Transmission] Dossier {dossier} créé pour tx {body.transaction_id}")
    return _public_doc(doc, decrypt=True)


# ── Liste & détail admin ─────────────────────────────────────────────────────
@router.get("/admin/transmissions")
async def list_transmissions(request: Request, limit: int = 100, skip: int = 0):
    await _admin(request)
    total = await db.citadelle_transmissions.count_documents({})
    cursor = db.citadelle_transmissions.find({}, {"_id": 0, "access": 0}).sort("created_at", -1).skip(skip).limit(limit)
    items = [d async for d in cursor]
    return {"transmissions": items, "total": total}


@router.get("/admin/transmissions/by-transaction/{transaction_id}")
async def transmission_by_transaction(transaction_id: str, request: Request):
    await _admin(request)
    doc = await db.citadelle_transmissions.find_one(
        {"transaction_id": transaction_id},
        {"_id": 0, "id": 1, "status": 1, "dossier_number": 1},
    )
    if not doc:
        return {"exists": False}
    return {"exists": True, **doc}


@router.get("/admin/transmissions/{tid}")
async def get_transmission(tid: str, request: Request):
    await _admin(request)
    doc = await db.citadelle_transmissions.find_one({"id": tid})
    if not doc:
        raise HTTPException(status_code=404, detail="Dossier introuvable.")
    return _public_doc(doc, decrypt=True)


# ── Sauvegarde (brouillon / étapes) ──────────────────────────────────────────
class UpdateBody(BaseModel):
    asset: Optional[dict] = None
    access: Optional[dict] = None
    checklist: Optional[dict] = None
    observations: Optional[str] = None
    recommended_services: Optional[list] = None
    general: Optional[dict] = None


@router.patch("/admin/transmissions/{tid}")
async def update_transmission(tid: str, body: UpdateBody, request: Request):
    await _admin(request)
    doc = await db.citadelle_transmissions.find_one({"id": tid})
    if not doc:
        raise HTTPException(status_code=404, detail="Dossier introuvable.")

    updates = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if body.asset is not None:
        updates["asset"] = {**doc.get("asset", {}), **body.asset}
    if body.general is not None:
        updates["general"] = {**doc.get("general", {}), **body.general}
    if body.access is not None:
        updates["access"] = _encrypt_access(body.access)
    if body.checklist is not None:
        updates["checklist"] = body.checklist
    if body.observations is not None:
        updates["observations"] = body.observations
    if body.recommended_services is not None:
        updates["recommended_services"] = body.recommended_services

    await db.citadelle_transmissions.update_one({"id": tid}, {"$set": updates})
    doc = await db.citadelle_transmissions.find_one({"id": tid})
    return _public_doc(doc, decrypt=True)


# ── Finalisation + email acheteur ────────────────────────────────────────────
@router.post("/admin/transmissions/{tid}/finalize")
async def finalize_transmission(tid: str, request: Request):
    await _admin(request)
    doc = await db.citadelle_transmissions.find_one({"id": tid})
    if not doc:
        raise HTTPException(status_code=404, detail="Dossier introuvable.")

    now = datetime.now(timezone.utc).isoformat()
    await db.citadelle_transmissions.update_one(
        {"id": tid}, {"$set": {"status": "finalized", "finalized_at": now, "updated_at": now}}
    )

    # Email acheteur — document prêt
    buyer_email = doc.get("buyer_email", "")
    if buyer_email:
        try:
            from services.email_service.core import send_citadelle_email, _build_notification_base
            asset_title = doc.get("general", {}).get("asset_title", "votre actif")
            body_html = (
                f"<p style='color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;'>Bonjour,</p>"
                f"<p style='color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;'>"
                f"Votre <strong>Attestation de Transmission</strong> pour l'actif "
                f"« {asset_title} » (dossier <strong>{doc.get('dossier_number')}</strong>) est prête. "
                f"Elle contient l'ensemble des accès transmis et le récapitulatif officiel de votre acquisition.</p>"
                f"<p style='color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;'>"
                f"Retrouvez-la dès maintenant dans votre espace La Garde.</p>"
            )
            html = _build_notification_base(
                "Attestation de Transmission",
                "Votre dossier de cession est disponible",
                "#C9A45C", body_html,
                f"{CITADELLE_URL}/citadelle/espace-membre/transmissions",
                "Accéder à mon document",
            )
            await send_citadelle_email(buyer_email, "Votre Attestation de Transmission est prête — La Garde", html)
        except Exception as e:
            logger.error(f"[Transmission] Échec email acheteur : {e}")

    # Email vendeur — Titre de Cession prêt (sans aucun accès/code)
    seller_email = doc.get("seller_email", "")
    if seller_email:
        try:
            from services.email_service.core import send_citadelle_email, _build_notification_base
            asset_title = doc.get("general", {}).get("asset_title", "votre actif")
            body_html = (
                f"<p style='color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;'>Bonjour,</p>"
                f"<p style='color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;'>"
                f"La cession de « {asset_title} » a été finalisée par La Garde. Votre "
                f"<strong>Titre de Cession</strong> (dossier <strong>{doc.get('dossier_number')}</strong>) "
                f"est désormais disponible : il atteste officiellement de la transmission de votre actif.</p>"
                f"<p style='color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;'>"
                f"Retrouvez-le à tout moment dans votre espace La Garde. Merci de votre confiance.</p>"
            )
            html = _build_notification_base(
                "Titre de Cession",
                "Votre cession a été finalisée",
                "#C9A45C", body_html,
                f"{CITADELLE_URL}/citadelle/espace-membre/transmissions",
                "Accéder à mon document",
            )
            await send_citadelle_email(seller_email, "Votre Titre de Cession est disponible — La Garde", html)
        except Exception as e:
            logger.error(f"[Transmission] Échec email vendeur : {e}")

    doc = await db.citadelle_transmissions.find_one({"id": tid})
    return _public_doc(doc)


@router.get("/admin/transmissions/{tid}/pdf")
async def admin_pdf(tid: str, request: Request):
    await _admin(request)
    doc = await db.citadelle_transmissions.find_one({"id": tid})
    if not doc:
        raise HTTPException(status_code=404, detail="Dossier introuvable.")
    pdf = build_attestation_pdf(_pdf_data(doc), full=True, verify_url=_verify_url(doc["dossier_number"]))
    return StreamingResponse(io.BytesIO(pdf), media_type="application/pdf", headers={
        "Content-Disposition": f'attachment; filename="attestation-{doc["dossier_number"]}.pdf"'})


# ── Espace membre (acheteur / vendeur) ───────────────────────────────────────
@router.get("/transmissions/my")
async def my_transmissions(request: Request):
    user = await _current_user(request)
    uid = user.get("sub")
    cursor = db.citadelle_transmissions.find(
        {"status": "finalized", "$or": [{"buyer_id": uid}, {"seller_id": uid}]},
        {"_id": 0, "access": 0},
    ).sort("finalized_at", -1)
    items = []
    async for d in cursor:
        items.append({
            "id": d["id"],
            "dossier_number": d.get("dossier_number"),
            "asset_title": d.get("general", {}).get("asset_title", ""),
            "date": d.get("finalized_at"),
            "role": "buyer" if d.get("buyer_id") == uid else "seller",
        })
    return {"transmissions": items}


@router.get("/transmissions/{tid}/pdf")
async def member_pdf(tid: str, request: Request):
    user = await _current_user(request)
    uid = user.get("sub")
    doc = await db.citadelle_transmissions.find_one({"id": tid})
    if not doc or doc.get("status") != "finalized":
        raise HTTPException(status_code=404, detail="Document indisponible.")

    is_admin = user.get("role") == "admin"
    is_buyer = doc.get("buyer_id") == uid
    is_seller = doc.get("seller_id") == uid
    if not (is_admin or is_buyer or is_seller):
        raise HTTPException(status_code=403, detail="Accès refusé.")

    # Vendeur → version simplifiée SANS accès ; acheteur/admin → version complète
    full = is_admin or is_buyer
    pdf = build_attestation_pdf(_pdf_data(doc), full=full, verify_url=_verify_url(doc["dossier_number"]))
    prefix = "attestation" if full else "titre-de-cession"
    return StreamingResponse(io.BytesIO(pdf), media_type="application/pdf", headers={
        "Content-Disposition": f'attachment; filename="{prefix}-{doc["dossier_number"]}.pdf"'})


# ── Vérification publique d'authenticité ─────────────────────────────────────
@router.get("/transmissions/verify/{dossier_number}")
async def verify_transmission(dossier_number: str):
    doc = await db.citadelle_transmissions.find_one(
        {"dossier_number": dossier_number, "status": "finalized"}, {"_id": 0}
    )
    if not doc:
        return {"valid": False}
    g = doc.get("general", {})
    return {
        "valid": True,
        "dossier_number": doc.get("dossier_number"),
        "asset_title": g.get("asset_title", ""),
        "asset_type": g.get("asset_type_label", g.get("asset_type", "")),
        "date": doc.get("finalized_at"),
        "issuer": "La Garde de La Citadelle Numérique",
    }
