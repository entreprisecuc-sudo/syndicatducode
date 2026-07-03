"""
Système de facturation — La Citadelle Numérique
- Génération PDF (reportlab) avec design professionnel
- Stockage MongoDB (collection citadelle_invoices)
- Routes client (GET /invoices/my, GET /invoices/{id}/pdf)
- Routes admin  (GET /admin/invoices, GET /admin/invoices/{id}/pdf, POST /admin/invoices/bulk-pdf)
- Prévu pour intégration future PDP (champ pdp_status)
"""

import io
import os
import uuid
import zipfile
import logging
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse, Response
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, EmailStr

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import mm

# Chemin vers le logo de La Citadelle Numérique (utilisé dans le PDF)
LOGO_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "static", "citadelle-logo-pdf.png")

logger = logging.getLogger(__name__)

router = APIRouter(tags=["invoices"])

_db: Optional[AsyncIOMotorDatabase] = None

NAVY   = HexColor("#0F2747")
GOLD   = HexColor("#C9A45C")
LIGHT  = HexColor("#F3F4F6")
MUTED  = HexColor("#6B7280")
GREEN  = HexColor("#22C55E")

TVA_RATE = 0.20  # TVA standard 20%

# Infos vendeur (La Citadelle Numérique — exploitée par JOERKE.B)
SELLER = {
    "name":      "La Citadelle Numérique",
    "slogan":    "Marketplace d'actifs numériques",
    "email":     os.environ.get("CITADELLE_ADMIN_EMAIL", "lagarde@lacitadellenumerique.fr"),
    "address":   "11 RUE URBAIN IV, 10000 TROYES",
    "siret":     "892 906 728 00019",
    "tva_intra": "FR12892906728",
    "rcs":       "R.C.S. Troyes — 892 906 728",
    "forme_jur": "SASU — Capital 250,00 €",
    "operator":  "JOERKE.B",
}


def set_database(db: AsyncIOMotorDatabase):
    global _db
    _db = db


def _check_db():
    if _db is None:
        raise HTTPException(status_code=500, detail="Base de données non initialisée.")


async def _get_billing_config() -> dict:
    """Retourne la config de facturation (doc unique). Défaut : franchise TVA désactivée."""
    if _db is None:
        return {"tva_enabled": False}
    cfg = await _db.citadelle_billing_config.find_one({"_id": "default"})
    return cfg or {"tva_enabled": False}


# ─────────────────────────────────────────────────────────────────────────────
# Numérotation séquentielle des factures
# ─────────────────────────────────────────────────────────────────────────────

async def _next_invoice_number() -> str:
    year = datetime.now(timezone.utc).year
    counter = await _db.citadelle_counters.find_one_and_update(
        {"_id": f"invoice_{year}"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    seq = counter.get("seq", 1)
    return f"FAC-{year}-{str(seq).zfill(5)}"


# ─────────────────────────────────────────────────────────────────────────────
# Création automatique d'une facture après paiement confirmé
# ─────────────────────────────────────────────────────────────────────────────

async def create_invoice_for_payment(transaction: dict) -> str:
    """
    Crée une facture dans MongoDB à partir d'une transaction de paiement confirmée.
    Idempotente : ne crée pas de doublon si la transaction a déjà une facture.
    Retourne l'invoice_id.
    """
    if _db is None:
        logger.warning("Impossible de créer la facture : DB non initialisée")
        return ""

    session_id = transaction.get("session_id", "")

    # Idempotence : vérifier si une facture existe déjà pour cette session
    existing = await _db.citadelle_invoices.find_one({"stripe_session_id": session_id})
    if existing:
        return str(existing.get("_id", ""))

    # Lire la config TVA active au moment du paiement
    config     = await _get_billing_config()
    tva_enabled = config.get("tva_enabled", False)

    amount_ttc = float(transaction.get("amount", 0))
    if tva_enabled:
        amount_ht  = round(amount_ttc / (1 + TVA_RATE), 2)
        vat_amount = round(amount_ttc - amount_ht, 2)
        vat_rate   = TVA_RATE
    else:
        # Franchise TVA — Art. 293 B du CGI
        amount_ht  = amount_ttc
        vat_amount = 0.0
        vat_rate   = 0.0

    invoice_number = await _next_invoice_number()
    invoice_id     = str(uuid.uuid4())
    now            = datetime.now(timezone.utc)

    doc = {
        "_id":             invoice_id,
        "invoice_number":  invoice_number,
        "created_at":      now.isoformat(),
        "payment_date":    transaction.get("updated_at") or now.isoformat(),

        # Vendeur
        "seller_name":     SELLER["name"],
        "seller_email":    SELLER["email"],
        "seller_siret":    SELLER["siret"],
        "seller_tva":      SELLER["tva_intra"],
        "seller_address":  SELLER["address"],
        "seller_rcs":      SELLER["rcs"],
        "seller_operator": SELLER["operator"],

        # Client
        "client_name":     transaction.get("client_name", ""),
        "client_email":    transaction.get("client_email", ""),
        "user_id":         transaction.get("user_id") or "",

        # Prestation
        "service_title":   transaction.get("service_title", "Prestation La Citadelle Numérique"),
        "description":     transaction.get("client_message") or "",

        # Montants
        "amount_ttc":      amount_ttc,
        "amount_ht":       amount_ht,
        "vat_rate":        vat_rate,
        "vat_amount":      vat_amount,
        "tva_enabled":     tva_enabled,

        # Références
        "stripe_session_id": session_id,
        "transaction_id":  str(transaction.get("_id", "")),

        # Conformité PDP (future intégration)
        "pdp_status":      "not_required",   # "not_required" | "pending" | "submitted"
        "pdp_reference":   None,
    }

    await _db.citadelle_invoices.insert_one(doc)
    logger.info(f"Facture créée : {invoice_number} — {transaction.get('client_email')}")

    # ── Envoi email avec facture PDF en pièce jointe ───────────────────────
    try:
        from services.email_service import send_invoice_confirmation_email
        import asyncio
        pdf_bytes = _build_pdf(doc)
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, send_invoice_confirmation_email, doc, pdf_bytes)
    except Exception as e:
        logger.error(f"[Facture] Erreur envoi email avec PDF : {e}")

    return invoice_id


# ─────────────────────────────────────────────────────────────────────────────
# Génération PDF (reportlab)
# ─────────────────────────────────────────────────────────────────────────────

def _build_pdf(inv: dict) -> bytes:
    """Génère un PDF de facture professionnel et le retourne en bytes."""
    buf = io.BytesIO()
    W, H = A4  # 595.27 x 841.89 pt

    c = canvas.Canvas(buf, pagesize=A4)
    c.setTitle(f"Facture {inv['invoice_number']}")

    def x(mm_val): return mm_val * mm
    def y(mm_val): return H - mm_val * mm

    # ── Bande de titre (fond navy) ─────────────────────────────────────────
    c.setFillColor(NAVY)
    c.rect(0, H - 42 * mm, W, 42 * mm, fill=1, stroke=0)

    # Logo Citadelle (coin gauche de la bande)
    logo_x = x(12)
    logo_y = H - 38 * mm
    logo_size = 30 * mm
    if os.path.exists(LOGO_PATH):
        c.drawImage(LOGO_PATH, logo_x, logo_y, width=logo_size, height=logo_size, mask="auto")
        text_offset_x = x(48)  # texte décalé après le logo
    else:
        text_offset_x = x(12)

    # Nom vendeur
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(text_offset_x, y(16), "La Citadelle Numérique")

    c.setFillColor(white)
    c.setFont("Helvetica", 9)
    c.drawString(text_offset_x, y(23), "Marketplace d'actifs numériques")

    # Numéro facture (droite)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 13)
    inv_num = inv.get("invoice_number", "FAC-????")
    c.drawRightString(W - x(12), y(16), f"FACTURE  {inv_num}")

    # Date (droite)
    raw_date = inv.get("created_at", "")[:10]
    try:
        dt = datetime.strptime(raw_date, "%Y-%m-%d")
        date_str = dt.strftime("%d/%m/%Y")
    except Exception:
        date_str = raw_date
    c.setFont("Helvetica", 9)
    c.setFillColor(HexColor("#C9A45C"))
    c.drawRightString(W - x(12), y(24), f"Émise le {date_str}")

    # ── Ligne or séparatrice ───────────────────────────────────────────────
    c.setStrokeColor(GOLD)
    c.setLineWidth(1.5)
    c.line(x(12), y(42), W - x(12), y(42))

    # ── Bloc "DE" ──────────────────────────────────────────────────────────
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(x(12), y(52), "ÉMETTEUR")

    c.setFont("Helvetica-Bold", 10)
    c.drawString(x(12), y(59), inv.get("seller_name", SELLER["name"]))

    c.setFont("Helvetica", 9)
    c.setFillColor(MUTED)
    c.drawString(x(12), y(65), inv.get("seller_email", ""))
    siret = inv.get("seller_siret", SELLER["siret"])
    if siret:
        c.drawString(x(12), y(71), f"SIRET : {siret}")
    tva = inv.get("seller_tva", SELLER["tva_intra"])
    if tva:
        c.drawString(x(12), y(77), f"N° TVA : {tva}")
    c.drawString(x(12), y(83), SELLER["address"])
    c.drawString(x(12), y(89), SELLER["rcs"])

    # Mention JOERKE.B en très petit
    c.setFont("Helvetica-Oblique", 7)
    c.setFillColor(HexColor("#9CA3AF"))
    c.drawString(x(12), y(95), f"Exploitée par {SELLER['operator']} — {SELLER['forme_jur']}")

    # ── Bloc "À" ───────────────────────────────────────────────────────────
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(x(110), y(52), "DESTINATAIRE")

    c.setFont("Helvetica-Bold", 10)
    c.drawString(x(110), y(59), inv.get("client_name", ""))

    c.setFont("Helvetica", 9)
    c.setFillColor(MUTED)
    c.drawString(x(110), y(65), inv.get("client_email", ""))

    # ── Tableau des prestations ────────────────────────────────────────────
    table_top  = y(110)
    table_y    = table_top
    col_widths = [x(100), x(18), x(27), x(17), x(28)]  # Désignation, Qté, PU HT, TVA, TTC
    col_x      = [x(12), x(112), x(130), x(157), x(174)]

    # En-tête tableau
    c.setFillColor(NAVY)
    c.rect(x(12), table_y - x(7), W - x(24), x(7), fill=1, stroke=0)

    headers = ["Désignation", "Qté", "Prix unit. HT", "TVA", "Total TTC"]
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8)
    for i, h in enumerate(headers):
        if i == 0:
            c.drawString(col_x[i] + 3, table_y - x(4.5), h)
        else:
            c.drawCentredString(col_x[i] + col_widths[i] / 2, table_y - x(4.5), h)

    # Ligne de données
    table_y -= x(7)
    c.setFillColor(LIGHT)
    c.rect(x(12), table_y - x(9), W - x(24), x(9), fill=1, stroke=0)

    c.setFillColor(NAVY)
    c.setFont("Helvetica", 9)
    service_title = inv.get("service_title", "Prestation")
    if len(service_title) > 55:
        service_title = service_title[:52] + "..."

    tva_enabled = inv.get("tva_enabled", inv.get("vat_rate", TVA_RATE) > 0)
    amount_ht  = inv.get("amount_ht", 0)
    vat_rate   = inv.get("vat_rate", TVA_RATE)
    amount_ttc = inv.get("amount_ttc", 0)

    row_mid = table_y - x(4.8)
    c.drawString(col_x[0] + 3, row_mid, service_title)
    c.drawCentredString(col_x[1] + col_widths[1] / 2, row_mid, "1")
    if tva_enabled:
        c.drawCentredString(col_x[2] + col_widths[2] / 2, row_mid, f"{amount_ht:,.2f} €")
        c.drawCentredString(col_x[3] + col_widths[3] / 2, row_mid, f"{int(vat_rate * 100)}%")
    else:
        c.drawCentredString(col_x[2] + col_widths[2] / 2, row_mid, f"{amount_ttc:,.2f} €")
        c.setFillColor(MUTED)
        c.drawCentredString(col_x[3] + col_widths[3] / 2, row_mid, "—")
        c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(col_x[4] + col_widths[4] / 2, row_mid, f"{amount_ttc:,.2f} €")

    table_y -= x(9)

    # ── Totaux ────────────────────────────────────────────────────────────
    totals_x = x(130)
    totals_y = table_y - x(8)

    def draw_total_row(label, value, bold=False, color=MUTED):
        nonlocal totals_y
        c.setFont("Helvetica-Bold" if bold else "Helvetica", 9 if not bold else 10)
        c.setFillColor(NAVY if bold else MUTED)
        c.drawString(totals_x, totals_y, label)
        c.setFillColor(GOLD if bold else color)
        c.drawRightString(W - x(12), totals_y, value)
        totals_y -= x(6)

    c.setStrokeColor(HexColor("#E5E7EB"))
    c.setLineWidth(0.5)
    c.line(totals_x, table_y - x(2), W - x(12), table_y - x(2))

    if tva_enabled:
        draw_total_row("Sous-total HT", f"{amount_ht:,.2f} €")
        draw_total_row(f"TVA {int(vat_rate * 100)}%", f"{inv.get('vat_amount', 0):,.2f} €")

    totals_y -= 2
    c.setStrokeColor(GOLD)
    c.setLineWidth(1)
    c.line(totals_x, totals_y + x(4), W - x(12), totals_y + x(4))
    totals_y -= x(3)

    label_total = "TOTAL TTC" if tva_enabled else "TOTAL"
    draw_total_row(label_total, f"{amount_ttc:,.2f} €", bold=True)

    if not tva_enabled:
        c.setFont("Helvetica-Oblique", 7.5)
        c.setFillColor(MUTED)
        c.drawString(totals_x, totals_y, "TVA non applicable — Art. 293 B du CGI")
        totals_y -= x(5)

    # ── Référence paiement ─────────────────────────────────────────────────
    ref_y = totals_y - x(14)
    c.setFillColor(LIGHT)
    c.roundRect(x(12), ref_y - x(14), W - x(24), x(14), 4, fill=1, stroke=0)

    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(NAVY)
    c.drawString(x(16), ref_y - x(6), "Règlement :")
    c.setFont("Helvetica", 8)
    pay_date = inv.get("payment_date", "")[:10]
    try:
        pay_date = datetime.strptime(pay_date, "%Y-%m-%d").strftime("%d/%m/%Y")
    except Exception:
        pass
    c.drawString(x(40), ref_y - x(6), f"Stripe — Paiement reçu le {pay_date}")

    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(NAVY)
    c.drawString(x(16), ref_y - x(11), "Référence :")
    c.setFont("Helvetica", 8)
    c.setFillColor(MUTED)
    session = inv.get("stripe_session_id", "")
    c.drawString(x(40), ref_y - x(11), session[:60] if session else "—")

    # ── Note PDP ──────────────────────────────────────────────────────────
    pdp_y = ref_y - x(22)
    c.setFont("Helvetica-Oblique", 7)
    c.setFillColor(MUTED)
    c.drawString(x(12), pdp_y, "Note : Facturation électronique — Intégration PDP en cours de déploiement (décret n°2022-1299, réforme 2026).")

    # ── Pied de page ──────────────────────────────────────────────────────
    footer_y = y(287)
    c.setStrokeColor(HexColor("#E5E7EB"))
    c.setLineWidth(0.5)
    c.line(x(12), footer_y + x(4), W - x(12), footer_y + x(4))

    c.setFont("Helvetica", 7)
    c.setFillColor(MUTED)
    c.drawCentredString(W / 2, footer_y, "La Citadelle Numérique — lacitadellenumerique.fr")
    c.drawCentredString(W / 2, footer_y - x(4), "Document généré automatiquement — valeur légale sous réserve de signature électronique")
    c.setFont("Helvetica-Oblique", 6)
    c.setFillColor(HexColor("#9CA3AF"))
    c.drawCentredString(W / 2, footer_y - x(8), f"propulsé par {SELLER['operator']} — SASU — SIRET {SELLER['siret']} — {SELLER['tva_intra']}")

    c.save()
    return buf.getvalue()


# ─────────────────────────────────────────────────────────────────────────────
# Utilitaire auth simple (vérifie le token Bearer dans l'en-tête)
# ─────────────────────────────────────────────────────────────────────────────

async def _get_current_user(request: Request) -> dict:
    from services.auth_service import decode_access_token
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentification requise.")
    token = auth.replace("Bearer ", "").strip()
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré.")
    return payload


async def _get_admin_user(request: Request) -> dict:
    user = await _get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs.")
    return user


# ─────────────────────────────────────────────────────────────────────────────
# Routes client
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/invoices/my")
async def get_my_invoices(request: Request):
    _check_db()
    user = await _get_current_user(request)
    user_id = user.get("sub") or ""
    email   = user.get("email") or ""

    query = {"$or": [{"user_id": user_id}, {"client_email": email}]} if user_id else {"client_email": email}
    cursor = _db.citadelle_invoices.find(query, {"_id": 1, "invoice_number": 1, "created_at": 1,
                                                  "service_title": 1, "amount_ttc": 1, "pdp_status": 1})
    invoices = []
    async for doc in cursor.sort("created_at", -1):
        invoices.append({
            "id":             str(doc["_id"]),
            "invoice_number": doc.get("invoice_number", ""),
            "created_at":     doc.get("created_at", ""),
            "service_title":  doc.get("service_title", ""),
            "amount_ttc":     doc.get("amount_ttc", 0),
            "pdp_status":     doc.get("pdp_status", "not_required"),
        })
    return {"invoices": invoices}


@router.get("/invoices/{invoice_id}/pdf")
async def download_invoice_pdf(invoice_id: str, request: Request):
    _check_db()
    user    = await _get_current_user(request)
    user_id = user.get("sub") or ""
    email   = user.get("email") or ""

    inv = await _db.citadelle_invoices.find_one({"_id": invoice_id})
    if not inv:
        raise HTTPException(status_code=404, detail="Facture introuvable.")

    # Vérifier que la facture appartient à l'utilisateur (ou qu'il est admin)
    if not user.get("is_admin") and inv.get("client_email") != email and inv.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Accès refusé.")

    pdf_bytes = _build_pdf(inv)
    filename  = f"{inv.get('invoice_number', 'facture')}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ─────────────────────────────────────────────────────────────────────────────
# Routes admin
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/admin/invoices")
async def admin_list_invoices(request: Request, limit: int = 100, skip: int = 0, search: str = ""):
    _check_db()
    await _get_admin_user(request)

    query = {}
    if search:
        query = {"$or": [
            {"client_email":   {"$regex": search, "$options": "i"}},
            {"client_name":    {"$regex": search, "$options": "i"}},
            {"invoice_number": {"$regex": search, "$options": "i"}},
            {"service_title":  {"$regex": search, "$options": "i"}},
        ]}

    total = await _db.citadelle_invoices.count_documents(query)
    cursor = _db.citadelle_invoices.find(query).sort("created_at", -1).skip(skip).limit(limit)

    invoices = []
    async for doc in cursor:
        invoices.append({
            "id":             str(doc["_id"]),
            "invoice_number": doc.get("invoice_number", ""),
            "created_at":     doc.get("created_at", ""),
            "client_name":    doc.get("client_name", ""),
            "client_email":   doc.get("client_email", ""),
            "service_title":  doc.get("service_title", ""),
            "amount_ttc":     doc.get("amount_ttc", 0),
            "amount_ht":      doc.get("amount_ht", 0),
            "vat_amount":     doc.get("vat_amount", 0),
            "pdp_status":     doc.get("pdp_status", "not_required"),
            "stripe_session_id": doc.get("stripe_session_id", ""),
        })

    return {"invoices": invoices, "total": total}


@router.get("/admin/invoices/{invoice_id}/pdf")
async def admin_download_invoice_pdf(invoice_id: str, request: Request):
    _check_db()
    await _get_admin_user(request)

    inv = await _db.citadelle_invoices.find_one({"_id": invoice_id})
    if not inv:
        raise HTTPException(status_code=404, detail="Facture introuvable.")

    pdf_bytes = _build_pdf(inv)
    filename  = f"{inv.get('invoice_number', 'facture')}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/admin/invoices/bulk-pdf")
async def admin_bulk_download_invoices(request: Request):
    """Télécharge un ZIP contenant les PDFs des factures sélectionnées."""
    _check_db()
    await _get_admin_user(request)

    body = await request.json()
    ids  = body.get("invoice_ids", [])
    if not ids:
        raise HTTPException(status_code=400, detail="Aucune facture sélectionnée.")
    if len(ids) > 200:
        raise HTTPException(status_code=400, detail="Maximum 200 factures par lot.")

    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for inv_id in ids:
            inv = await _db.citadelle_invoices.find_one({"_id": inv_id})
            if not inv:
                continue
            pdf_bytes = _build_pdf(inv)
            filename  = f"{inv.get('invoice_number', inv_id)}.pdf"
            zf.writestr(filename, pdf_bytes)

    zip_buf.seek(0)
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    return StreamingResponse(
        zip_buf,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="factures-citadelle-{today}.zip"'},
    )


# ─────────────────────────────────────────────────────────────────────────────
# Routes admin — Configuration TVA
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/admin/billing-config")
async def admin_get_billing_config(request: Request):
    """Retourne la configuration de facturation (TVA activée / franchise)."""
    _check_db()
    await _get_admin_user(request)
    config = await _get_billing_config()
    return {"tva_enabled": config.get("tva_enabled", False)}


@router.patch("/admin/billing-config")
async def admin_update_billing_config(request: Request):
    """Active ou désactive la TVA sur les nouvelles factures."""
    _check_db()
    await _get_admin_user(request)
    body = await request.json()
    tva_enabled = bool(body.get("tva_enabled", False))
    await _db.citadelle_billing_config.update_one(
        {"_id": "default"},
        {"$set": {"tva_enabled": tva_enabled, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    logger.info(f"Config TVA mise à jour : tva_enabled={tva_enabled}")
    return {"tva_enabled": tva_enabled}
