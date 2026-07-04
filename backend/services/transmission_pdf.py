"""
Génération PDF — Attestation de Transmission (La Garde de La Citadelle Numérique).

Deux rendus :
- build_attestation_pdf(data, full=True)  → acheteur & admin (avec accès/codes)
- build_attestation_pdf(data, full=False) → vendeur (Titre de Cession, SANS accès)
"""
import io
import os
from datetime import datetime

import qrcode
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader

# Import différé du schéma (évite tout cycle d'import via le package routes.citadelle)
def _schema():
    from routes.citadelle import transmission_schema as ts
    return ts

NAVY  = HexColor("#0B1E33")
NAVY2 = HexColor("#0F2747")
GOLD  = HexColor("#C9A45C")
LIGHT = HexColor("#F3F4F6")
MUTED = HexColor("#6B7280")
DARK  = HexColor("#1F2937")
GREEN = HexColor("#16A34A")

SEAL_PATH = os.path.join(os.path.dirname(__file__), "..", "static", "sceau-la-garde.png")


def _fmt_date(iso: str) -> str:
    try:
        return datetime.fromisoformat(iso.replace("Z", "")).strftime("%d/%m/%Y")
    except Exception:
        return (iso or "")[:10]


def _qr_image(url: str):
    qr = qrcode.QRCode(box_size=8, border=1)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0B1E33", back_color="white")
    b = io.BytesIO()
    img.save(b, format="PNG")
    b.seek(0)
    return b


class _Doc:
    """Petit moteur de mise en page avec gestion des sauts de page."""

    def __init__(self, c, title):
        self.c = c
        self.W, self.H = A4
        self.title = title
        self.y = self.H - 30 * mm

    def _ensure(self, need_mm):
        if self.y - need_mm * mm < 25 * mm:
            self._footer()
            self.c.showPage()
            self.y = self.H - 25 * mm
            self._page_header()

    def _page_header(self):
        c = self.c
        c.setFillColor(NAVY)
        c.rect(0, self.H - 16 * mm, self.W, 16 * mm, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(15 * mm, self.H - 10.5 * mm, "LA GARDE — La Citadelle Numérique")
        c.setFillColor(white)
        c.setFont("Helvetica", 8)
        c.drawRightString(self.W - 15 * mm, self.H - 10.5 * mm, self.title)
        self.y = self.H - 24 * mm

    def _footer(self):
        c = self.c
        c.setStrokeColor(HexColor("#E5E7EB"))
        c.setLineWidth(0.5)
        c.line(15 * mm, 16 * mm, self.W - 15 * mm, 16 * mm)
        c.setFont("Helvetica", 7)
        c.setFillColor(MUTED)
        c.drawCentredString(self.W / 2, 12 * mm,
                            "Document officiel émis par La Garde — La Citadelle Numérique")

    def section_title(self, txt):
        self._ensure(16)
        c = self.c
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(15 * mm, self.y, txt)
        c.setStrokeColor(GOLD)
        c.setLineWidth(1.2)
        c.line(15 * mm, self.y - 2.5 * mm, self.W - 15 * mm, self.y - 2.5 * mm)
        self.y -= 9 * mm

    def kv(self, label, value):
        value = "" if value is None else str(value)
        if not value.strip():
            return
        self._ensure(7)
        c = self.c
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(DARK)
        c.drawString(18 * mm, self.y, f"{label} :")
        c.setFont("Helvetica", 9)
        c.setFillColor(HexColor("#374151"))
        # wrap long values
        maxw = self.W - 80 * mm
        words = value.replace("\r", "").split("\n")
        first = True
        for para in words:
            line = ""
            for w in para.split(" "):
                test = (line + " " + w).strip()
                if c.stringWidth(test, "Helvetica", 9) > maxw and line:
                    c.drawString(70 * mm, self.y, line)
                    self.y -= 5 * mm
                    self._ensure(6)
                    line = w
                else:
                    line = test
            c.drawString(70 * mm, self.y, line)
            self.y -= 5 * mm
            first = False
        self.y -= 1 * mm

    def bullet(self, txt, checked=None):
        self._ensure(6)
        c = self.c
        if checked is True:
            c.setFillColor(GREEN); c.setFont("Helvetica-Bold", 9); mark = "OK"
        elif checked is False:
            c.setFillColor(MUTED); c.setFont("Helvetica", 9); mark = "—"
        else:
            c.setFillColor(GOLD); c.setFont("Helvetica-Bold", 9); mark = "•"
        c.drawString(18 * mm, self.y, mark)
        c.setFillColor(DARK); c.setFont("Helvetica", 9)
        c.drawString(26 * mm, self.y, txt)
        self.y -= 6 * mm

    def paragraph(self, txt):
        if not txt:
            return
        c = self.c
        maxw = self.W - 33 * mm
        for para in txt.replace("\r", "").split("\n"):
            line = ""
            for w in para.split(" "):
                test = (line + " " + w).strip()
                if c.stringWidth(test, "Helvetica", 9.5) > maxw and line:
                    self._ensure(6); c.setFont("Helvetica", 9.5); c.setFillColor(DARK)
                    c.drawString(18 * mm, self.y, line); self.y -= 5.5 * mm
                    line = w
                else:
                    line = test
            self._ensure(6); c.setFont("Helvetica", 9.5); c.setFillColor(DARK)
            c.drawString(18 * mm, self.y, line); self.y -= 5.5 * mm


def _cover(c, data, subtitle, verify_url):
    W, H = A4
    c.setFillColor(NAVY)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setStrokeColor(GOLD)
    c.setLineWidth(1.5)
    c.rect(14 * mm, 14 * mm, W - 28 * mm, H - 28 * mm, fill=0, stroke=1)

    if os.path.exists(SEAL_PATH):
        s = 46 * mm
        c.drawImage(SEAL_PATH, (W - s) / 2, H - 78 * mm, width=s, height=s, mask="auto")

    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(W / 2, H - 100 * mm, "Attestation de Transmission")
    c.setFillColor(white)
    c.setFont("Helvetica", 12)
    c.drawCentredString(W / 2, H - 110 * mm, subtitle)

    c.setStrokeColor(GOLD)
    c.setLineWidth(0.8)
    c.line(60 * mm, H - 118 * mm, W - 60 * mm, H - 118 * mm)

    g = data.get("general", {})
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(W / 2, H - 132 * mm, f"Dossier N° {data.get('dossier_number', '—')}")
    c.setFont("Helvetica", 10)
    c.setFillColor(HexColor("#C9D3E0"))
    c.drawCentredString(W / 2, H - 140 * mm, f"Actif : {g.get('asset_title', '—')}")
    c.drawCentredString(W / 2, H - 147 * mm, f"Émis le {_fmt_date(g.get('date', ''))}")

    # QR
    qr = _qr_image(verify_url)
    c.drawImage(ImageReader(qr), (W - 28 * mm) / 2, 30 * mm,
                width=28 * mm, height=28 * mm)
    c.setFont("Helvetica", 7.5)
    c.setFillColor(HexColor("#9CA3AF"))
    c.drawCentredString(W / 2, 26 * mm, "Vérifiez l'authenticité de ce document")
    c.showPage()


def build_attestation_pdf(data: dict, full: bool, verify_url: str) -> bytes:
    ts = _schema()
    SECTIONS = ts.SECTIONS
    DEFAULT_CHECKLIST = ts.DEFAULT_CHECKLIST
    SERVICE_LABELS = {s["key"]: s["label"] for s in ts.RECOMMENDED_SERVICES}
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    subtitle = "Émise par La Garde de La Citadelle Numérique" if full else \
               "Titre de Cession — La Garde de La Citadelle Numérique"
    c.setTitle(("Attestation" if full else "Titre de cession") + f" {data.get('dossier_number','')}")

    _cover(c, data, subtitle, verify_url)

    doc = _Doc(c, "Attestation de Transmission" if full else "Titre de Cession")
    doc._page_header()

    g = data.get("general", {})
    a = data.get("asset", {})

    # 1. Informations générales
    doc.section_title("1. Informations générales")
    doc.kv("Dossier", data.get("dossier_number", ""))
    doc.kv("Transaction", g.get("transaction_ref", ""))
    doc.kv("Date", _fmt_date(g.get("date", "")))
    doc.kv("Acheteur", g.get("buyer", ""))
    doc.kv("Vendeur", g.get("seller", ""))
    doc.kv("Prix de vente", f"{g.get('price', 0):,.2f} €".replace(",", " "))
    doc.kv("Commission", f"{g.get('commission', 0):,.2f} €".replace(",", " "))
    doc.kv("Type d'actif", g.get("asset_type_label", g.get("asset_type", "")))

    # 2. Présentation de l'actif
    doc.section_title("2. Présentation de l'actif")
    doc.kv("Nom", a.get("name", ""))
    doc.kv("URL", a.get("url", ""))
    doc.kv("Catégorie", a.get("category", ""))
    doc.kv("Date de création", a.get("creation_date", ""))
    doc.kv("Technologies", a.get("technologies", ""))
    doc.kv("Version", a.get("version", ""))
    if a.get("description"):
        doc.paragraph(a.get("description", ""))

    # 3. Accès transmis — UNIQUEMENT version complète (acheteur/admin)
    if full:
        doc.section_title("3. Accès transmis")
        access = data.get("access", {})  # déjà déchiffré par l'appelant
        any_access = False
        for sec_key, fields in access.items():
            sec = SECTIONS.get(sec_key, {"title": sec_key})
            printed_header = False
            for fkey, fval in (fields or {}).items():
                if not fval:
                    continue
                if not printed_header:
                    doc._ensure(10)
                    c.setFont("Helvetica-Bold", 10)
                    c.setFillColor(GOLD)
                    c.drawString(16 * mm, doc.y, sec["title"])
                    doc.y -= 6.5 * mm
                    printed_header = True
                    any_access = True
                label = next((f["label"] for f in sec.get("fields", []) if f["key"] == fkey), fkey)
                doc.kv(label, fval)
        if not any_access:
            doc.paragraph("Aucun accès renseigné.")

    # 4. Checklist
    doc.section_title(("4." if full else "3.") + " Checklist de transmission")
    checklist = data.get("checklist", {})
    for item in DEFAULT_CHECKLIST:
        doc.bullet(item["label"], checked=bool(checklist.get(item["key"])))

    # 5. Observations
    obs = data.get("observations", "")
    if obs:
        doc.section_title(("5." if full else "4.") + " Observations")
        doc.paragraph(obs)

    # 6. Services recommandés
    services = data.get("recommended_services", [])
    if services:
        doc.section_title(("6." if full else "5.") + " Services recommandés")
        for s in services:
            doc.bullet(SERVICE_LABELS.get(s, s))

    # Signatures
    doc._ensure(30)
    doc.y -= 6 * mm
    c.setStrokeColor(HexColor("#E5E7EB")); c.setLineWidth(0.5)
    c.line(15 * mm, doc.y, doc.W - 15 * mm, doc.y)
    doc.y -= 10 * mm
    c.setFont("Helvetica-Bold", 9); c.setFillColor(DARK)
    c.drawString(18 * mm, doc.y, "La Garde de La Citadelle Numérique")
    c.drawRightString(doc.W - 18 * mm, doc.y, f"Le {_fmt_date(g.get('date', ''))}")
    doc.y -= 5 * mm
    c.setFont("Helvetica-Oblique", 8); c.setFillColor(MUTED)
    c.drawString(18 * mm, doc.y, "Transmission vérifiée et sécurisée par La Garde.")

    doc._footer()
    c.save()
    return buf.getvalue()
