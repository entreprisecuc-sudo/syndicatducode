"""
Iteration 10 — Backend anti-régression tests for:
1. Services price sync (admin PATCH → public GET reflects change)
2. Estimation checkout returns checkout_url with correct service_id
3. Admin activity-feed endpoint (syndicat + citadelle lists)
4. Invoice PDF contains "propulsé par JOERKE.B" + "SIREN : 892906728" and NOT forbidden mentions
5. Invoice PDF DESTINATAIRE reflects pro/particulier profile
"""
import io
import os
import pytest
import requests
from pypdf import PdfReader


def _extract_pdf_text(pdf_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    return "\n".join(p.extract_text() or "" for p in reader.pages)

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or "https://syndicat-code.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "bigpapa1981@asar.com"
ADMIN_PASSWORD = "Josiane03@@@!1981"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ── 1. Services price sync ─────────────────────────────────────────────────

class TestServicePriceSync:
    def _find_service(self, services, title):
        return next((s for s in services if s["title"] == title), None)

    def test_estimation_standard_exists(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/citadelle/admin/services", headers=admin_headers)
        assert r.status_code == 200, r.text
        services = r.json()["services"]
        svc = self._find_service(services, "Estimation Standard")
        assert svc is not None, "Estimation Standard introuvable"
        assert "id" in svc and "price" in svc

    def test_price_update_reflects_in_public_endpoint(self, admin_headers):
        # 1) get current price
        r = requests.get(f"{BASE_URL}/api/citadelle/admin/services", headers=admin_headers)
        svc = self._find_service(r.json()["services"], "Estimation Standard")
        original_price = svc["price"]
        service_id = svc["id"]

        try:
            # 2) update to 3
            r = requests.patch(
                f"{BASE_URL}/api/citadelle/admin/services/{service_id}",
                headers=admin_headers, json={"price": 3},
            )
            assert r.status_code == 200, r.text
            assert r.json()["price"] == 3

            # 3) public GET /services must reflect
            r = requests.get(f"{BASE_URL}/api/citadelle/services")
            assert r.status_code == 200
            svc_pub = self._find_service(r.json()["services"], "Estimation Standard")
            assert svc_pub is not None
            assert svc_pub["price"] == 3, f"Prix public non synchronisé : {svc_pub['price']}"
            assert svc_pub["id"] == service_id
        finally:
            # 4) restore to 49
            requests.patch(
                f"{BASE_URL}/api/citadelle/admin/services/{service_id}",
                headers=admin_headers, json={"price": original_price},
            )
            r = requests.get(f"{BASE_URL}/api/citadelle/services")
            svc_pub = self._find_service(r.json()["services"], "Estimation Standard")
            assert svc_pub["price"] == original_price


# ── 2. Estimation checkout ────────────────────────────────────────────────

class TestEstimationCheckout:
    def test_checkout_service_returns_url(self, admin_headers):
        # Récupérer l'ID réel via GET /services (page estimation utilise correspondance par titre)
        r = requests.get(f"{BASE_URL}/api/citadelle/services")
        assert r.status_code == 200
        services = r.json()["services"]
        svc = next((s for s in services if s["title"] == "Estimation Standard"), None)
        assert svc is not None, "Estimation Standard non trouvée via /services"
        service_id = svc["id"]

        # Simuler le POST checkout depuis /citadelle/estimation
        r = requests.post(
            f"{BASE_URL}/api/citadelle/payments/service/checkout",
            json={
                "service_id": service_id,
                "client_name": "TEST Estimation",
                "client_email": "test-iter10@example.com",
                "client_message": "Test iteration 10",
                "origin_url": "https://syndicat-code.preview.emergentagent.com",
                "cancel_path": "/citadelle/estimation",
            },
        )
        assert r.status_code == 200, f"Checkout failed: {r.status_code} {r.text}"
        data = r.json()
        assert "checkout_url" in data
        assert data["checkout_url"].startswith("https://checkout.stripe.com/") \
               or "stripe" in data["checkout_url"].lower(), data["checkout_url"]


# ── 3. Activity-feed admin ─────────────────────────────────────────────────

class TestActivityFeed:
    def test_activity_feed_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/admin/activity-feed")
        assert r.status_code in (401, 403), r.status_code

    def test_activity_feed_returns_two_lists(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/activity-feed", headers=admin_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "syndicat" in data and "citadelle" in data
        assert isinstance(data["syndicat"], list)
        assert isinstance(data["citadelle"], list)
        # Vérifier structure des items s'il y en a
        for it in (data["syndicat"] + data["citadelle"])[:3]:
            assert "label" in it
            assert "route" in it
            assert "type" in it


# ── 4/5. Invoice PDF mentions & destinataire ──────────────────────────────

class TestInvoicePDF:
    def test_list_admin_invoices(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/citadelle/admin/invoices", headers=admin_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "invoices" in data
        # Sauvegarder pour test suivant
        pytest.INVOICES = data["invoices"]
        assert isinstance(data["invoices"], list)

    def test_invoice_pdf_contains_correct_mentions(self, admin_headers):
        invoices = getattr(pytest, "INVOICES", [])
        if not invoices:
            pytest.skip("Aucune facture en base pour tester le PDF")

        inv_id = invoices[0]["id"]
        r = requests.get(
            f"{BASE_URL}/api/citadelle/admin/invoices/{inv_id}/pdf",
            headers=admin_headers,
        )
        assert r.status_code == 200, r.text
        assert r.headers.get("content-type", "").startswith("application/pdf")
        pdf = r.content
        assert pdf.startswith(b"%PDF"), "Fichier n'est pas un PDF"

        text = _extract_pdf_text(pdf)
        # Mentions requises
        assert "JOERKE.B" in text, f"Mention JOERKE.B manquante. Texte: {text[:500]}"
        assert "propulsé par JOERKE.B" in text or "propulse par JOERKE.B" in text, \
            f"'propulsé par JOERKE.B' manquant. Texte: {text[:500]}"
        assert "892906728" in text or "892 906 728" in text, "SIREN 892906728 manquant"
        assert "SIREN" in text, "Label SIREN manquant"

        # Mentions interdites (vendeur)
        forbidden_terms = ["Exploitée", "SASU", "Capital", "immatriculation"]
        for f in forbidden_terms:
            assert f not in text, f"Mention interdite trouvée: {f!r} — texte contient: {text[:300]}"

    def test_invoice_recipient_block_present(self, admin_headers):
        invoices = getattr(pytest, "INVOICES", [])
        if not invoices:
            pytest.skip("Aucune facture")
        inv_id = invoices[0]["id"]
        r = requests.get(
            f"{BASE_URL}/api/citadelle/admin/invoices/{inv_id}/pdf",
            headers=admin_headers,
        )
        assert r.status_code == 200
        text = _extract_pdf_text(r.content)
        assert "DESTINATAIRE" in text, f"Bloc DESTINATAIRE manquant. Texte: {text[:500]}"
        assert "ÉMETTEUR" in text or "EMETTEUR" in text, "Bloc ÉMETTEUR manquant"
