"""
Tests des pièces jointes de messagerie — La Citadelle Numérique
Formats JPG/PNG/WebP + PDF, max 25 Mo, max 5 par message.
Couvre : upload endpoint, envoi via 3 messageries (tx / pré-vente / litige),
validations (URL forgée, >5, vide sans PJ), régressions texte simple + sanitizer.
"""
import io
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://code-syndicate-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api/citadelle"

BUYER = ("test.acheteur@citadelle.fr", "DemoAcheteur2026!")
SELLER = ("test.vendeur@citadelle.fr", "DemoVendeur2026!")

# 1x1 PNG minimal
_PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\xcf"
    b"\xc0\x00\x00\x00\x03\x00\x01\xdd\x8a\xdb\x8a\x00\x00\x00\x00IEND\xaeB`\x82"
)
_PDF_BYTES = b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"


def _make_pdf(text: str) -> bytes:
    """Génère un PDF avec reportlab contenant `text`."""
    from reportlab.pdfgen import canvas
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    c.drawString(100, 750, text)
    c.save()
    return buf.getvalue()


def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def buyer_token():
    return _login(*BUYER)


@pytest.fixture(scope="module")
def seller_token():
    return _login(*SELLER)


@pytest.fixture(scope="module")
def buyer_headers(buyer_token):
    return {"Authorization": f"Bearer {buyer_token}"}


@pytest.fixture(scope="module")
def seller_headers(seller_token):
    return {"Authorization": f"Bearer {seller_token}"}


@pytest.fixture(scope="module")
def transaction_id(buyer_headers):
    # Prend la 1re transaction non-terminée où le buyer est acheteur
    r = requests.get(f"{API}/transactions/my", headers=buyer_headers)
    assert r.status_code == 200
    txs = r.json()["transactions"]
    for tx in txs:
        if tx.get("status") in ("offer_sent", "offer_countered", "offer_accepted", "payment_done"):
            return tx["id"]
    pytest.skip("Aucune transaction test active")


# ── Upload endpoint ───────────────────────────────────────────────────────────

class TestUploadAttachment:
    def test_upload_png_ok(self, buyer_headers):
        files = {"file": ("test.png", io.BytesIO(_PNG_BYTES), "image/png")}
        r = requests.post(f"{API}/messages/upload-attachment", files=files, headers=buyer_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["url"].startswith("/uploads/citadelle/attachments/")
        assert data["content_type"] == "image/png"
        assert data["size"] == len(_PNG_BYTES)
        # Fichier accessible publiquement
        public = f"{BASE_URL}/api{data['url']}"
        r2 = requests.get(public)
        assert r2.status_code == 200

    def test_upload_pdf_ok(self, buyer_headers):
        files = {"file": ("doc.pdf", io.BytesIO(_PDF_BYTES), "application/pdf")}
        r = requests.post(f"{API}/messages/upload-attachment", files=files, headers=buyer_headers)
        assert r.status_code == 200
        assert r.json()["content_type"] == "application/pdf"

    def test_upload_txt_rejected(self, buyer_headers):
        files = {"file": ("bad.txt", io.BytesIO(b"hello"), "text/plain")}
        r = requests.post(f"{API}/messages/upload-attachment", files=files, headers=buyer_headers)
        assert r.status_code == 400

    def test_upload_too_large(self, buyer_headers):
        big = b"x" * (26 * 1024 * 1024)
        files = {"file": ("big.pdf", io.BytesIO(big), "application/pdf")}
        r = requests.post(f"{API}/messages/upload-attachment", files=files, headers=buyer_headers)
        assert r.status_code == 413

    def test_upload_requires_auth(self):
        files = {"file": ("test.png", io.BytesIO(_PNG_BYTES), "image/png")}
        r = requests.post(f"{API}/messages/upload-attachment", files=files)
        assert r.status_code in (401, 403)


# ── Anti-contournement PDF : refus si coordonnées ─────────────────────────────

class TestPdfAntiContact:
    def test_pdf_with_email_rejected(self, buyer_headers):
        pdf = _make_pdf("Ecrivez moi a jean.dupont@gmail.com")
        files = {"file": ("email.pdf", io.BytesIO(pdf), "application/pdf")}
        r = requests.post(f"{API}/messages/upload-attachment", files=files, headers=buyer_headers)
        assert r.status_code == 400, r.text
        detail = (r.json().get("detail") or "").lower()
        assert "coordonn" in detail, detail

    def test_pdf_with_phone_spaces_rejected(self, buyer_headers):
        pdf = _make_pdf("Appelez le 06 12 34 56 78 pour info")
        files = {"file": ("tel.pdf", io.BytesIO(pdf), "application/pdf")}
        r = requests.post(f"{API}/messages/upload-attachment", files=files, headers=buyer_headers)
        assert r.status_code == 400, r.text
        assert "coordonn" in (r.json().get("detail") or "").lower()

    def test_pdf_with_phone_compact_rejected(self, buyer_headers):
        pdf = _make_pdf("Numero: 0612345678")
        files = {"file": ("tel2.pdf", io.BytesIO(pdf), "application/pdf")}
        r = requests.post(f"{API}/messages/upload-attachment", files=files, headers=buyer_headers)
        assert r.status_code == 400, r.text
        assert "coordonn" in (r.json().get("detail") or "").lower()

    def test_pdf_clean_accepted(self, buyer_headers):
        pdf = _make_pdf("Document propre sans aucune information de contact.")
        files = {"file": ("clean.pdf", io.BytesIO(pdf), "application/pdf")}
        r = requests.post(f"{API}/messages/upload-attachment", files=files, headers=buyer_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["content_type"] == "application/pdf"
        assert data["size"] == len(pdf)
        assert data["url"].startswith("/uploads/citadelle/attachments/")
        assert data["name"] == "clean.pdf"

    def test_image_with_contact_visual_accepted(self, buyer_headers):
        """Une image n'est PAS analysée (pas d'OCR) : toujours acceptée."""
        files = {"file": ("photo.png", io.BytesIO(_PNG_BYTES), "image/png")}
        r = requests.post(f"{API}/messages/upload-attachment", files=files, headers=buyer_headers)
        assert r.status_code == 200, r.text

    def test_pdf_corrupted_accepted(self, buyer_headers):
        """PDF illisible : le contrôle contact est ignoré, upload accepté."""
        files = {"file": ("bad.pdf", io.BytesIO(_PDF_BYTES), "application/pdf")}
        r = requests.post(f"{API}/messages/upload-attachment", files=files, headers=buyer_headers)
        assert r.status_code == 200, r.text

    def test_message_with_clean_pdf_still_works(self, buyer_headers, transaction_id):
        pdf = _make_pdf("Rapport propre.")
        files = {"file": ("ok.pdf", io.BytesIO(pdf), "application/pdf")}
        up = requests.post(f"{API}/messages/upload-attachment", files=files, headers=buyer_headers)
        assert up.status_code == 200
        att = up.json()
        r = requests.post(
            f"{API}/transactions/{transaction_id}/message",
            json={"content": "", "attachments": [att]},
            headers=buyer_headers,
        )
        assert r.status_code == 200, r.text
        assert r.json()["attachments"][0]["content_type"] == "application/pdf"


# ── Helper: upload et retourne l'objet Attachment ─────────────────────────────

def _upload(headers, content_type="image/png", data=_PNG_BYTES, name="test.png"):
    files = {"file": (name, io.BytesIO(data), content_type)}
    r = requests.post(f"{API}/messages/upload-attachment", files=files, headers=headers)
    assert r.status_code == 200, r.text
    return r.json()


# ── Messagerie transaction ────────────────────────────────────────────────────

class TestTransactionMessage:
    def test_message_with_attachment_no_text(self, buyer_headers, transaction_id):
        att = _upload(buyer_headers)
        r = requests.post(
            f"{API}/transactions/{transaction_id}/message",
            json={"content": "", "attachments": [att]},
            headers=buyer_headers,
        )
        assert r.status_code == 200, r.text
        assert r.json().get("attachments"), r.json()
        assert r.json()["attachments"][0]["url"].startswith("/uploads/citadelle/attachments/")

    def test_message_text_only_ok(self, buyer_headers, transaction_id):
        r = requests.post(
            f"{API}/transactions/{transaction_id}/message",
            json={"content": "Bonjour texte simple"},
            headers=buyer_headers,
        )
        assert r.status_code == 200

    def test_message_empty_no_attachment_400(self, buyer_headers, transaction_id):
        r = requests.post(
            f"{API}/transactions/{transaction_id}/message",
            json={"content": "", "attachments": []},
            headers=buyer_headers,
        )
        assert r.status_code == 400

    def test_message_forged_url_400(self, buyer_headers, transaction_id):
        forged = {"url": "/uploads/other/hack.png", "name": "hack.png", "content_type": "image/png", "size": 10}
        r = requests.post(
            f"{API}/transactions/{transaction_id}/message",
            json={"content": "hi", "attachments": [forged]},
            headers=buyer_headers,
        )
        assert r.status_code == 400

    def test_message_too_many_attachments(self, buyer_headers, transaction_id):
        att = _upload(buyer_headers)
        r = requests.post(
            f"{API}/transactions/{transaction_id}/message",
            json={"content": "x", "attachments": [att] * 6},
            headers=buyer_headers,
        )
        assert r.status_code == 400

    def test_sanitizer_still_works(self, buyer_headers, transaction_id):
        r = requests.post(
            f"{API}/transactions/{transaction_id}/message",
            json={"content": "contact moi test@example.com"},
            headers=buyer_headers,
        )
        assert r.status_code == 200
        # sanitized flag ou content masqué
        body = r.json()
        assert body.get("sanitized") or "@" not in (body.get("content", "") or "example.com")


# ── Messagerie pré-vente ──────────────────────────────────────────────────────

class TestPreSaleMessage:
    @pytest.fixture(scope="class")
    def conversation_id(self, buyer_headers, seller_headers):
        # Récupérer une conversation existante ou en créer une
        r = requests.get(f"{API}/messages/my", headers=buyer_headers)
        assert r.status_code == 200
        for c in r.json().get("conversations", []):
            if not c.get("is_blocked"):
                return c["id"]
        # Sinon créer via une annonce active du vendeur test
        r = requests.get(f"{BASE_URL}/api/citadelle/listings?status=active&limit=50")
        assert r.status_code == 200
        listings = r.json().get("listings") or r.json().get("items") or []
        last_err = ""
        for l in listings:
            if l.get("seller_email") != SELLER[0]:
                continue
            rr = requests.post(
                f"{API}/messages/send",
                json={"listing_id": l["id"], "content": "Bonjour, question test PJ"},
                headers=buyer_headers,
            )
            if rr.status_code == 201:
                return rr.json()["conversation_id"]
            last_err = f"{rr.status_code} {rr.text}"
        pytest.skip(f"Impossible de créer conversation pré-vente: {last_err}")

    def test_reply_with_attachment_no_text(self, buyer_headers, conversation_id):
        att = _upload(buyer_headers, content_type="application/pdf", data=_PDF_BYTES, name="d.pdf")
        r = requests.post(
            f"{API}/messages/{conversation_id}/reply",
            json={"content": "", "attachments": [att]},
            headers=buyer_headers,
        )
        assert r.status_code == 200, r.text
        assert r.json()["message"]["attachments"][0]["content_type"] == "application/pdf"

    def test_reply_empty_400(self, buyer_headers, conversation_id):
        r = requests.post(
            f"{API}/messages/{conversation_id}/reply",
            json={"content": "", "attachments": []},
            headers=buyer_headers,
        )
        assert r.status_code == 400

    def test_reply_forged_url_400(self, buyer_headers, conversation_id):
        forged = {"url": "https://evil.com/x.png", "name": "x", "content_type": "image/png", "size": 1}
        r = requests.post(
            f"{API}/messages/{conversation_id}/reply",
            json={"content": "hi", "attachments": [forged]},
            headers=buyer_headers,
        )
        assert r.status_code == 400

    def test_reply_text_only_ok(self, buyer_headers, conversation_id):
        r = requests.post(
            f"{API}/messages/{conversation_id}/reply",
            json={"content": "texte simple"},
            headers=buyer_headers,
        )
        assert r.status_code == 200


# ── Chat litige (dispute-messages) ────────────────────────────────────────────

class TestDisputeMessage:
    @pytest.fixture(scope="class")
    def disputed_tx_id(self, buyer_headers):
        # Récupère ou crée une transaction en litige
        r = requests.get(f"{API}/transactions/my", headers=buyer_headers)
        for tx in r.json()["transactions"]:
            if tx["status"] == "disputed":
                return tx["id"]
        # Trouver une tx payment_done et ouvrir litige
        for tx in r.json()["transactions"]:
            if tx["status"] == "payment_done":
                r2 = requests.post(
                    f"{API}/transactions/{tx['id']}/open-dispute",
                    json={"reason": "Test litige pièces jointes automatisé."},
                    headers=buyer_headers,
                )
                if r2.status_code == 200:
                    return tx["id"]
        pytest.skip("Impossible d'obtenir une transaction en litige")

    def test_dispute_msg_with_attachment(self, seller_headers, disputed_tx_id):
        att = _upload(seller_headers)
        r = requests.post(
            f"{API}/transactions/{disputed_tx_id}/dispute-messages",
            json={"content": "", "attachments": [att]},
            headers=seller_headers,
        )
        assert r.status_code == 200, r.text
        assert r.json()["attachments"][0]["url"].startswith("/uploads/citadelle/attachments/")

    def test_dispute_msg_empty_400(self, seller_headers, disputed_tx_id):
        r = requests.post(
            f"{API}/transactions/{disputed_tx_id}/dispute-messages",
            json={"content": "", "attachments": []},
            headers=seller_headers,
        )
        assert r.status_code == 400

    def test_dispute_msg_forged_400(self, seller_headers, disputed_tx_id):
        forged = {"url": "/hack/x.png", "name": "x", "content_type": "image/png", "size": 1}
        r = requests.post(
            f"{API}/transactions/{disputed_tx_id}/dispute-messages",
            json={"content": "x", "attachments": [forged]},
            headers=seller_headers,
        )
        assert r.status_code == 400
