"""
Tests du filtre anti-coordonnées sur les annonces Citadelle.
Vérifie POST/PATCH /api/citadelle/listings — masquage automatique des
adresses email et numéros de téléphone dans short_description/description,
présence systématique du champ security_notice, et non-régression du contrôle
d'accès (403 non propriétaire, 404 introuvable).
"""
import os
import pytest
import requests
from pathlib import Path

def _load_backend_url():
    url = os.environ.get("REACT_APP_BACKEND_URL")
    if not url:
        env_path = Path("/app/frontend/.env")
        if env_path.exists():
            for line in env_path.read_text().splitlines():
                if line.startswith("REACT_APP_BACKEND_URL="):
                    url = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    if not url:
        raise RuntimeError("REACT_APP_BACKEND_URL introuvable")
    return url.rstrip("/")

BASE_URL = _load_backend_url()
API = f"{BASE_URL}/api/citadelle"

OWNER = {"email": "marie.testui@citadelle-test.fr", "password": "TestUI2026!"}
OTHER = {"email": "test.acheteur@citadelle.fr", "password": "DemoAcheteur2026!"}

MASQUE = "[contact masqué par La Citadelle]"


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def owner_token():
    r = requests.post(f"{API}/auth/login", json=OWNER, timeout=15)
    assert r.status_code == 200, f"Login owner failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def other_token():
    r = requests.post(f"{API}/auth/login", json=OTHER, timeout=15)
    assert r.status_code == 200, f"Login other failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def created_ids():
    ids = []
    yield ids
    # Cleanup — best effort
    try:
        r = requests.post(f"{API}/auth/login", json=OWNER, timeout=15)
        tok = r.json().get("access_token")
        if tok:
            for lid in ids:
                requests.delete(
                    f"{API}/listings/{lid}",
                    headers={"Authorization": f"Bearer {tok}"},
                    timeout=15,
                )
    except Exception as e:
        print(f"Cleanup error: {e}")


def _base_payload(**over):
    payload = {
        "type": "blog",
        "title": "Blog tech test filtre",
        "short_description": "Un blog tech français de qualité pour tester le filtre anti coordonnees ici.",
        "description": (
            "Description longue et légitime de plus de cinquante caractères "
            "présentant un projet éditorial sérieux et sans coordonnées."
        ),
        "price": 5000,
        "price_negotiable": False,
        "niche": "tech",
        "allow_social_share": True,
        "is_adult": False,
        "is_auction": False,
    }
    payload.update(over)
    return payload


def _create(token, payload):
    return requests.post(
        f"{API}/listings",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
        timeout=20,
    )


# ── 1. Création avec email + téléphone → masqués + security_notice ────────────

def test_create_with_email_and_phone_masks_both(owner_token, created_ids):
    payload = _base_payload(
        short_description=(
            "Bonjour, contactez moi à jean.dupont@example.com pour toute info. "
            "Blog tech de qualité."
        ),
        description=(
            "Description complète du blog tech. Vous pouvez m'appeler au "
            "06 12 34 56 78 pour discuter, ou par email vendeur@test.fr. "
            "Contenu de plus de cinquante caractères garanti pour ce test."
        ),
    )
    r = _create(owner_token, payload)
    assert r.status_code == 201, f"Create failed: {r.status_code} {r.text}"
    data = r.json()
    created_ids.append(data["id"])

    assert MASQUE in data["short_description"], data["short_description"]
    assert "jean.dupont@example.com" not in data["short_description"]

    assert MASQUE in data["description"], data["description"]
    assert "vendeur@test.fr" not in data["description"]
    assert "06 12 34 56 78" not in data["description"]

    assert data.get("security_notice"), "security_notice manquant"
    assert isinstance(data["security_notice"], str) and len(data["security_notice"]) > 10


# ── 2. Création sans coordonnées → contenu préservé, security_notice présent ──

def test_create_without_contact_preserves_content(owner_token, created_ids):
    payload = _base_payload(
        title="Blog cuisine propre",
        short_description="Un blog culinaire savoureux sans aucune coordonnée directe ici merci.",
        description=(
            "Description longue et parfaitement propre du blog cuisine, "
            "présentant les recettes et l'audience fidèle sans coordonnées."
        ),
    )
    r = _create(owner_token, payload)
    assert r.status_code == 201, r.text
    data = r.json()
    created_ids.append(data["id"])

    assert data["short_description"] == payload["short_description"]
    assert data["description"] == payload["description"]
    assert MASQUE not in data["short_description"]
    assert MASQUE not in data["description"]
    assert data.get("security_notice"), "security_notice doit être systématique"


# ── 3. Le titre et la niche NE sont PAS filtrés ───────────────────────────────

def test_title_and_niche_not_filtered(owner_token, created_ids):
    payload = _base_payload(
        title="Contact vendeur@titre.com 0612345678 blog",
        niche="tech-0612345678",
        short_description="Description courte parfaitement propre sans coordonnées ici merci beaucoup.",
        description=(
            "Description longue propre présentant un projet éditorial "
            "sérieux sans coordonnées directes de plus de 50 caractères."
        ),
    )
    r = _create(owner_token, payload)
    assert r.status_code == 201, r.text
    data = r.json()
    created_ids.append(data["id"])

    assert data["title"] == payload["title"], "Le titre ne doit pas être filtré"
    assert data["niche"] == payload["niche"], "La niche ne doit pas être filtrée"
    assert "vendeur@titre.com" in data["title"]
    assert "0612345678" in data["niche"]


# ── 4. Édition description avec email + téléphone → masqué + security_notice ──

def test_patch_description_with_contact_masks(owner_token, created_ids):
    # créer d'abord une annonce propre
    r = _create(owner_token, _base_payload(title="A éditer 1"))
    assert r.status_code == 201, r.text
    lid = r.json()["id"]
    created_ids.append(lid)

    new_desc = (
        "Nouvelle description éditée avec email admin@test.fr et téléphone "
        "06.12.34.56.78 pour vérifier le masquage. Contenu >= 50 caractères."
    )
    r2 = requests.patch(
        f"{API}/listings/{lid}",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={"description": new_desc},
        timeout=20,
    )
    assert r2.status_code == 200, r2.text
    data = r2.json()
    assert MASQUE in data["description"]
    assert "admin@test.fr" not in data["description"]
    assert "06.12.34.56.78" not in data["description"]
    assert data.get("security_notice"), "security_notice manquant sur PATCH"


# ── 5. Édition short_description seule → description inchangée ────────────────

def test_patch_only_short_description(owner_token, created_ids):
    r = _create(owner_token, _base_payload(title="A éditer 2"))
    assert r.status_code == 201, r.text
    created = r.json()
    lid = created["id"]
    original_description = created["description"]
    created_ids.append(lid)

    new_short = "Courte description éditée avec email test@abc.fr à masquer svp merci."
    r2 = requests.patch(
        f"{API}/listings/{lid}",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={"short_description": new_short},
        timeout=20,
    )
    assert r2.status_code == 200, r2.text
    data = r2.json()
    assert MASQUE in data["short_description"]
    assert "test@abc.fr" not in data["short_description"]
    # description non modifiée doit rester intacte
    assert data["description"] == original_description
    assert data.get("security_notice")


# ── 6. Formats variés de téléphone et d'email ─────────────────────────────────

@pytest.mark.parametrize("phone,raw_digits", [
    ("06 12 34 56 78", "12345678"),
    ("06.12.34.56.78", "12345678"),
    ("0612345678", "0612345678"),
    ("+33 6 12 34 56 78", "12345678"),
])
def test_various_phone_formats_masked(owner_token, created_ids, phone, raw_digits):
    payload = _base_payload(
        title=f"Test phone {raw_digits}",
        description=(
            f"Contactez-moi rapidement au numéro {phone} pour discuter du projet, "
            "contenu de plus de cinquante caractères assuré ici merci."
        ),
    )
    r = _create(owner_token, payload)
    assert r.status_code == 201, r.text
    data = r.json()
    created_ids.append(data["id"])
    # La séquence principale de chiffres doit être masquée
    assert raw_digits not in data["description"], (
        f"Format '{phone}' non masqué: {data['description']}"
    )
    assert MASQUE in data["description"]


@pytest.mark.parametrize("email", [
    "simple@example.com",
    "prenom.nom+tag@sub.domain.co.uk",
    "USER_123@Test-Domain.FR",
])
def test_various_email_formats_masked(owner_token, created_ids, email):
    payload = _base_payload(
        title=f"Test email {email[:15]}",
        description=(
            f"Vous pouvez m'écrire à {email} pour toute information complémentaire "
            "sur ce projet éditorial de plus de cinquante caractères."
        ),
    )
    r = _create(owner_token, payload)
    assert r.status_code == 201, r.text
    data = r.json()
    created_ids.append(data["id"])
    assert email not in data["description"], f"Email non masqué: {data['description']}"
    assert MASQUE in data["description"]


# ── 7. Non-régression contrôle d'accès ────────────────────────────────────────

def test_patch_by_non_owner_returns_403(owner_token, other_token, created_ids):
    r = _create(owner_token, _base_payload(title="A éditer 403"))
    assert r.status_code == 201, r.text
    lid = r.json()["id"]
    created_ids.append(lid)

    r2 = requests.patch(
        f"{API}/listings/{lid}",
        headers={"Authorization": f"Bearer {other_token}"},
        json={"short_description": "Nouvelle description propre sans coordonnées ici merci."},
        timeout=20,
    )
    assert r2.status_code == 403, f"Attendu 403, reçu {r2.status_code}: {r2.text}"


def test_patch_not_found_returns_404(owner_token):
    r = requests.patch(
        f"{API}/listings/does-not-exist-xyz-123",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={"short_description": "test description propre sans coordonnées ici merci beaucoup."},
        timeout=20,
    )
    assert r.status_code == 404, f"Attendu 404, reçu {r.status_code}: {r.text}"
