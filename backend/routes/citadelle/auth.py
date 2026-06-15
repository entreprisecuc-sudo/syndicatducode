"""
Routes d'authentification — La Citadelle Numérique
Inscription, connexion, reset mot de passe INDÉPENDANTS du Syndicat du Code
platform: "citadelle" — isolation stricte
"""

from fastapi import APIRouter, HTTPException, status, Request, UploadFile, File, Depends
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime, timezone, timedelta
from pathlib import Path as FilePath
import logging
import re
import uuid

from services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    generate_user_id,
    generate_reset_token,
    verify_reset_token,
    is_token_expired,
)
from services.email_service import (
    send_citadelle_reset_password_email,
    send_citadelle_admin_new_user_email,
)

from utils.request_utils import get_client_ip

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Citadelle Auth"])

# Base de données injectée depuis server.py
db = None

def set_database(database):
    global db
    db = database


# ============================================
# MODÈLES
# ============================================

class CitadelleRegister(BaseModel):
    """Inscription sur La Citadelle Numérique"""
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    cgu_accepted: bool = False

    def validate_password(self):
        p = self.password
        if not re.search(r'[A-Z]', p):
            raise ValueError("Le mot de passe doit contenir au moins une majuscule")
        if not re.search(r'[a-z]', p):
            raise ValueError("Le mot de passe doit contenir au moins une minuscule")
        if not re.search(r'\d', p):
            raise ValueError("Le mot de passe doit contenir au moins un chiffre")


class CitadelleLogin(BaseModel):
    """Connexion sur La Citadelle Numérique"""
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    """Demande de réinitialisation de mot de passe"""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Réinitialisation du mot de passe avec le token"""
    token: str
    new_password: str = Field(..., min_length=8)

    def validate_password(self):
        p = self.new_password
        if not re.search(r'[A-Z]', p):
            raise ValueError("Le mot de passe doit contenir au moins une majuscule")
        if not re.search(r'[a-z]', p):
            raise ValueError("Le mot de passe doit contenir au moins une minuscule")
        if not re.search(r'\d', p):
            raise ValueError("Le mot de passe doit contenir au moins un chiffre")


class CitadelleUserResponse(BaseModel):
    """Réponse utilisateur Citadelle (sans données sensibles)"""
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    platform: str
    status: str
    created_at: str
    seller_verified: bool = False
    seller_score: float = 0.0
    buyer_score: float = 0.0


class CitadelleTokenResponse(BaseModel):
    """Réponse token JWT pour la Citadelle"""
    access_token: str
    token_type: str = "bearer"
    user: CitadelleUserResponse


# ============================================
# HELPERS — BRUTE FORCE & RESET TOKEN
# ============================================

async def _check_brute_force(ip: str) -> None:
    """
    Vérifie si l'IP est bloquée.
    Réutilise les collections login_attempts et blocked_ips du Syndicat.
    La config brute_force_config est partagée (1 seule config pour les 2 plateformes).
    """
    config = await db.brute_force_config.find_one({}, {"_id": 0})
    if not config:
        config = {"max_attempts": 5, "block_duration_minutes": 15, "window_minutes": 5, "is_active": True}

    if not config.get("is_active", True):
        return

    now = datetime.now(timezone.utc)

    blocked = await db.blocked_ips.find_one({"ip": ip}, {"_id": 0})
    if blocked:
        blocked_until = datetime.fromisoformat(blocked["blocked_until"])
        if blocked_until > now:
            remaining = max(1, int((blocked_until - now).total_seconds() / 60) + 1)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Trop de tentatives de connexion. Réessayez dans {remaining} minute(s)."
            )
        else:
            await db.blocked_ips.delete_one({"ip": ip})

    window_start = (now - timedelta(minutes=config["window_minutes"])).isoformat()
    count = await db.login_attempts.count_documents({
        "ip": ip,
        "timestamp": {"$gte": window_start}
    })

    if count >= config["max_attempts"]:
        block_duration = config["block_duration_minutes"]
        blocked_until = (now + timedelta(minutes=block_duration)).isoformat()
        await db.blocked_ips.update_one(
            {"ip": ip},
            {"$set": {
                "ip": ip,
                "blocked_at": now.isoformat(),
                "blocked_until": blocked_until,
                "attempts_count": count,
                "platform": "citadelle"
            }},
            upsert=True
        )
        logger.warning(f"[Citadelle] IP bloquée pour brute force: {ip} ({count} tentatives)")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Trop de tentatives de connexion. IP bloquée pour {block_duration} minute(s)."
        )


async def _log_failed_attempt(ip: str, email: str) -> None:
    """Enregistre une tentative de connexion échouée (collection partagée)"""
    now = datetime.now(timezone.utc)
    await db.login_attempts.insert_one({
        "ip": ip,
        "email": email,
        "timestamp": now.isoformat(),
        "created_at": now,
        "platform": "citadelle"
    })


# Helpers de reset token mutualisés dans services/auth_service.py (DRY)
# (generate_reset_token / verify_reset_token / is_token_expired)


# ============================================
# ROUTES
# ============================================

@router.post("/register", response_model=CitadelleUserResponse, status_code=status.HTTP_201_CREATED)
async def citadelle_register(user_data: CitadelleRegister, request: Request):
    """
    Inscription sur La Citadelle Numérique.
    Crée un compte INDÉPENDANT avec platform='citadelle'.
    L'email doit être unique au sein de la plateforme Citadelle.
    Enregistre l'acceptation CGU/CGV avec horodatage et adresse IP.
    """
    # Validation acceptation CGU obligatoire
    if not user_data.cgu_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous devez accepter les CGU et CGV pour créer un compte."
        )

    # Validation mot de passe
    try:
        user_data.validate_password()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Vérifier unicité email sur la plateforme Citadelle uniquement
    existing = await db.users.find_one(
        {"email": user_data.email.lower(), "platform": "citadelle"},
        {"_id": 0, "email": 1}
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un compte existe déjà avec cet email"
        )

    # Capture de l'IP réelle (derrière proxy/Kubernetes)
    client_ip = get_client_ip(request)

    now = datetime.now(timezone.utc).isoformat()
    user_id = generate_user_id()

    user_doc = {
        "id": user_id,
        "email": user_data.email.lower(),
        "first_name": user_data.first_name.strip(),
        "last_name": user_data.last_name.strip(),
        "password_hash": hash_password(user_data.password),
        "role": "citadelle_user",
        "platform": "citadelle",
        "status": "active",
        "seller_verified": False,
        "seller_score": 0.0,
        "buyer_score": 0.0,
        "created_at": now,
        "updated_at": now,
        "first_login": False,
        # Consentement CGU/CGV
        "cgu_accepted": True,
        "cgu_accepted_at": now,
        "cgu_ip_address": client_ip,
        "cgu_version": "1.0",
    }

    await db.users.insert_one(user_doc)
    logger.info(f"[Citadelle] Nouvel utilisateur inscrit: {user_data.email} — IP: {client_ip}")

    # Notification admin — nouveau compte
    send_citadelle_admin_new_user_email(
        prenom=user_data.first_name.strip(),
        nom=user_data.last_name.strip(),
        email=user_data.email.lower(),
    )

    return CitadelleUserResponse(
        id=user_id,
        email=user_data.email.lower(),
        first_name=user_data.first_name.strip(),
        last_name=user_data.last_name.strip(),
        role="citadelle_user",
        platform="citadelle",
        status="active",
        created_at=now
    )


@router.post("/login", response_model=CitadelleTokenResponse)
async def citadelle_login(credentials: CitadelleLogin, request: Request):
    """
    Connexion sur La Citadelle Numérique.
    N'authentifie QUE les utilisateurs avec platform='citadelle'.
    Protégé contre le brute force (rate limiting par IP).
    """
    ip = get_client_ip(request)

    # Protection anti-brute force
    await _check_brute_force(ip)

    # Rechercher l'utilisateur par email ET platform citadelle uniquement
    user = await db.users.find_one(
        {"email": credentials.email.lower(), "platform": "citadelle"},
        {"_id": 0}
    )

    if not user or not verify_password(credentials.password, user["password_hash"]):
        await _log_failed_attempt(ip, credentials.email.lower())
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )

    if user.get("status") == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Votre compte a été suspendu. Contactez le support."
        )

    # Créer le token JWT (même structure que le Syndicat)
    token_data = {
        "sub": user["id"],
        "email": user["email"],
        "role": user.get("role", "citadelle_user"),
        "platform": "citadelle",
        "status": user.get("status", "active")
    }
    access_token = create_access_token(token_data)

    logger.info(f"[Citadelle] Connexion réussie: {user['email']}")

    return CitadelleTokenResponse(
        access_token=access_token,
        user=CitadelleUserResponse(
            id=user["id"],
            email=user["email"],
            first_name=user.get("first_name", ""),
            last_name=user.get("last_name", ""),
            role=user.get("role", "citadelle_user"),
            platform="citadelle",
            status=user.get("status", "active"),
            created_at=user["created_at"],
            seller_verified=user.get("seller_verified", False),
            seller_score=user.get("seller_score", 0.0),
            buyer_score=user.get("buyer_score", 0.0)
        )
    )


@router.get("/me")
async def citadelle_me(request: Request):
    """Profil de l'utilisateur Citadelle connecté (via token JWT)"""
    from middleware.auth import get_current_user
    from fastapi import Depends
    # Utilise le middleware d'auth existant — le token est le même format
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token manquant")

    try:
        payload = decode_access_token(auth_header.replace("Bearer ", ""))
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")

    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")

    if payload.get("platform") != "citadelle":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux utilisateurs Citadelle")

    user = await db.users.find_one({"id": payload["sub"], "platform": "citadelle"}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")

    return user


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def citadelle_forgot_password(data: ForgotPasswordRequest):
    """
    Demande de réinitialisation de mot de passe pour un compte Citadelle.
    - Cherche uniquement dans platform='citadelle'
    - Ne révèle pas si l'email existe (sécurité)
    - Envoie un email avec le branding La Citadelle Numérique
    """
    response_message = "Si un compte Citadelle existe avec cet email, un lien de réinitialisation a été envoyé."

    user = await db.users.find_one(
        {"email": data.email.lower(), "platform": "citadelle"},
        {"_id": 0, "id": 1, "email": 1}
    )

    if user:
        raw_token, token_hash = generate_reset_token()
        now = datetime.now(timezone.utc)
        expires_at = (now + timedelta(hours=1)).isoformat()

        await db.password_resets.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "token_hash": token_hash,
            "created_at": now.isoformat(),
            "expires_at": expires_at,
            "used": False,
            "platform": "citadelle"
        })

        send_citadelle_reset_password_email(user["email"], raw_token)
        logger.info(f"[Citadelle] Token de réinitialisation généré pour: {user['email']}")

    return {"message": response_message}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def citadelle_reset_password(data: ResetPasswordRequest):
    """
    Réinitialise le mot de passe avec le token reçu par email.
    - Token valide 1 heure, à usage unique
    - Vérifie que le token appartient à un compte Citadelle
    """
    try:
        data.validate_password()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Récupérer les tokens Citadelle non utilisés
    reset_tokens = await db.password_resets.find(
        {"used": False, "platform": "citadelle"},
        {"_id": 0}
    ).to_list(100)

    valid_reset = None
    for reset in reset_tokens:
        if verify_reset_token(data.token, reset["token_hash"]):
            valid_reset = reset
            break

    if not valid_reset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lien de réinitialisation invalide ou déjà utilisé"
        )

    if is_token_expired(valid_reset["expires_at"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le lien de réinitialisation a expiré. Veuillez en demander un nouveau."
        )

    now = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {"id": valid_reset["user_id"], "platform": "citadelle"},
        {"$set": {"password_hash": hash_password(data.new_password), "updated_at": now}}
    )

    await db.password_resets.update_one(
        {"id": valid_reset["id"]},
        {"$set": {"used": True, "used_at": now}}
    )

    logger.info(f"[Citadelle] Mot de passe réinitialisé pour user_id: {valid_reset['user_id']}")
    return {"message": "Mot de passe modifié avec succès. Vous pouvez maintenant vous connecter."}


@router.patch("/profile", status_code=status.HTTP_200_OK)
async def citadelle_update_profile(request: Request):
    """
    Mise à jour du profil — utilisateur Citadelle connecté.
    Permet de modifier :
    - Prénom et/ou nom
    - Mot de passe (avec vérification de l'actuel)
    """
    payload = await request.json()
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token manquant")

    token = auth_header.split(" ")[1]
    try:
        decoded = decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")

    if decoded is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")

    user = await db.users.find_one(
        {"id": decoded["sub"], "platform": "citadelle"},
        {"_id": 0}
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")

    updates = {}
    now = datetime.now(timezone.utc).isoformat()

    # Mise à jour prénom / nom
    first_name = payload.get("first_name", "").strip()
    last_name = payload.get("last_name", "").strip()
    if first_name and len(first_name) >= 2:
        updates["first_name"] = first_name
    if last_name and len(last_name) >= 2:
        updates["last_name"] = last_name

    # Changement de mot de passe (optionnel)
    current_password = payload.get("current_password", "")
    new_password = payload.get("new_password", "")
    if new_password:
        if not current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le mot de passe actuel est requis pour en définir un nouveau"
            )
        if not verify_password(current_password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mot de passe actuel incorrect"
            )
        if len(new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le nouveau mot de passe doit contenir au moins 8 caractères"
            )
        import re as _re
        if not _re.search(r'[A-Z]', new_password) or not _re.search(r'[a-z]', new_password) or not _re.search(r'\d', new_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre"
            )
        updates["password_hash"] = hash_password(new_password)

    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Aucune modification fournie")

    updates["updated_at"] = now
    await db.users.update_one({"id": user["id"], "platform": "citadelle"}, {"$set": updates})

    # Retourner l'utilisateur mis à jour (sans le hash)
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    logger.info(f"[Citadelle] Profil mis à jour pour: {user['email']}")
    return {"message": "Profil mis à jour avec succès", "user": updated}


# ── Coordonnées bancaires & statut professionnel ───────────────────────────────

class BillingUpdate(BaseModel):
    """Mise à jour des coordonnées bancaires et statut professionnel"""
    # Bancaire
    iban: Optional[str] = Field(None, max_length=34)
    bic: Optional[str] = Field(None, max_length=11)
    bank_name: Optional[str] = Field(None, max_length=100)
    account_holder: Optional[str] = Field(None, max_length=100)
    # Adresse personnelle
    address: Optional[str] = Field(None, max_length=500)
    # Professionnel
    is_professional: Optional[bool] = None
    company_name: Optional[str] = Field(None, max_length=200)
    siren: Optional[str] = Field(None, max_length=9)
    siret: Optional[str] = Field(None, max_length=14)
    vat_number: Optional[str] = Field(None, max_length=20)
    company_address: Optional[str] = Field(None, max_length=500)


@router.patch("/profile/billing", status_code=status.HTTP_200_OK)
async def citadelle_update_billing(
    data: BillingUpdate,
    request: Request
):
    """
    Mise à jour des coordonnées bancaires et du statut professionnel.
    Données sensibles — accessibles uniquement par le propriétaire et l'admin.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token manquant")

    token = auth_header.split(" ")[1]
    try:
        decoded = decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")

    user = await db.users.find_one(
        {"id": decoded["sub"], "platform": "citadelle"},
        {"_id": 0}
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")

    now = datetime.now(timezone.utc).isoformat()
    updates = {}

    # Coordonnées bancaires
    billing = user.get("billing", {})
    if data.iban is not None:
        # Validation IBAN basique (longueur FR = 27 caractères)
        clean_iban = data.iban.replace(" ", "").upper()
        if clean_iban and len(clean_iban) < 15:
            raise HTTPException(status_code=400, detail="IBAN invalide — minimum 15 caractères")
        billing["iban"] = clean_iban
    if data.bic is not None:
        billing["bic"] = data.bic.strip().upper()
    if data.bank_name is not None:
        billing["bank_name"] = data.bank_name.strip()
    if data.account_holder is not None:
        billing["account_holder"] = data.account_holder.strip()
    billing["updated_at"] = now
    updates["billing"] = billing

    # Adresse personnelle
    if data.address is not None:
        updates["address"] = data.address.strip()

    # Statut professionnel
    professional = user.get("professional", {})
    if data.is_professional is not None:
        professional["is_professional"] = data.is_professional
    if data.company_name is not None:
        professional["company_name"] = data.company_name.strip()
    if data.siren is not None:
        clean_siren = data.siren.replace(" ", "")
        if clean_siren and len(clean_siren) != 9:
            raise HTTPException(status_code=400, detail="Le SIREN doit contenir exactement 9 chiffres")
        professional["siren"] = clean_siren
    if data.siret is not None:
        clean_siret = data.siret.replace(" ", "")
        if clean_siret and len(clean_siret) != 14:
            raise HTTPException(status_code=400, detail="Le SIRET doit contenir exactement 14 chiffres")
        professional["siret"] = clean_siret
    if data.vat_number is not None:
        professional["vat_number"] = data.vat_number.strip().upper()
    if data.company_address is not None:
        professional["company_address"] = data.company_address.strip()
    professional["updated_at"] = now
    updates["professional"] = professional

    updates["updated_at"] = now
    await db.users.update_one({"id": user["id"], "platform": "citadelle"}, {"$set": updates})

    logger.info(f"[Citadelle] Infos bancaires/pro mises à jour pour: {user['email']}")
    return {"message": "Informations mises à jour avec succès"}


@router.get("/profile/billing", status_code=status.HTTP_200_OK)
async def citadelle_get_billing(request: Request):
    """
    Récupère les coordonnées bancaires et le statut professionnel.
    Données sensibles — accessibles uniquement par le propriétaire.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token manquant")

    token = auth_header.split(" ")[1]
    try:
        decoded = decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")

    user = await db.users.find_one(
        {"id": decoded["sub"], "platform": "citadelle"},
        {"_id": 0, "billing": 1, "professional": 1, "address": 1, "documents": 1}
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")

    return {
        "billing": user.get("billing", {}),
        "professional": user.get("professional", {}),
        "address": user.get("address", ""),
        "documents": user.get("documents", {}),
    }


# ── Upload de documents sécurisés ──────────────────────────────────────────────

ALLOWED_DOC_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/webp"}
MAX_DOC_SIZE = 10 * 1024 * 1024  # 10 Mo
DOCS_DIR = FilePath(__file__).resolve().parent.parent.parent / "uploads" / "citadelle" / "documents"
DOCS_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/profile/document/{doc_type}", status_code=status.HTTP_200_OK)
async def upload_document(
    doc_type: str,
    request: Request,
    file: UploadFile = File(...)
):
    """
    Upload d'un document sécurisé (carte d'identité, KBIS, RIB).
    doc_type: 'identity' | 'kbis' | 'rib'
    Formats acceptés : PDF, JPEG, PNG, WebP — max 10 Mo
    """
    if doc_type not in ("identity", "kbis", "rib"):
        raise HTTPException(status_code=400, detail="Type de document invalide. Valeurs acceptées : identity, kbis, rib")

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token manquant")
    token = auth_header.split(" ")[1]
    try:
        decoded = decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalide")

    user = await db.users.find_one({"id": decoded["sub"], "platform": "citadelle"}, {"_id": 0, "id": 1, "email": 1})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    if file.content_type not in ALLOWED_DOC_TYPES:
        raise HTTPException(status_code=400, detail="Format non autorisé. Acceptés : PDF, JPEG, PNG, WebP")

    content = await file.read()
    if len(content) > MAX_DOC_SIZE:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (max 10 Mo)")

    ext_map = {".jpg": ".jpg", ".jpeg": ".jpg", ".png": ".png", ".webp": ".webp", ".pdf": ".pdf"}
    raw_ext = FilePath(file.filename).suffix.lower() if file.filename else ".pdf"
    ext = ext_map.get(raw_ext, raw_ext or ".pdf")

    filename = f"doc_{doc_type}_{user['id'][:8]}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = DOCS_DIR / filename
    filepath.write_bytes(content)

    doc_url = f"/uploads/citadelle/documents/{filename}"
    now = datetime.now(timezone.utc).isoformat()

    await db.users.update_one(
        {"id": user["id"], "platform": "citadelle"},
        {"$set": {
            f"documents.{doc_type}": {"url": doc_url, "filename": file.filename, "uploaded_at": now},
            "updated_at": now
        }}
    )

    logger.info(f"[Citadelle] Document '{doc_type}' uploadé par {user['email']}: {filename}")
    return {"url": doc_url, "filename": filename, "type": doc_type}


# ── Route admin : détail utilisateur Citadelle ─────────────────────────────────

from routes.citadelle.dependencies import require_admin

# _require_admin remplacé par require_admin importé depuis dependencies (DRY)


@router.get("/admin/users/{user_id}", status_code=200)
async def admin_get_citadelle_user(
    user_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Admin : détail complet d'un utilisateur Citadelle
    (infos personnelles, bancaires, professionnelles, documents)
    """
    user = await db.users.find_one(
        {"id": user_id, "platform": "citadelle"},
        {"_id": 0, "password_hash": 0}
    )
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur Citadelle introuvable")
    return user


@router.get("/admin/users", status_code=200)
async def admin_list_citadelle_users(
    page: int = 1,
    limit: int = 50,
    search: str = "",
    current_user: dict = Depends(require_admin)
):
    """
    Admin : liste paginée des utilisateurs Citadelle avec données de consentement CGU/CGV.
    """
    query = {"platform": "citadelle"}
    if search.strip():
        query["$or"] = [
            {"email": {"$regex": search.strip(), "$options": "i"}},
            {"first_name": {"$regex": search.strip(), "$options": "i"}},
            {"last_name": {"$regex": search.strip(), "$options": "i"}},
        ]

    total = await db.users.count_documents(query)
    skip = (page - 1) * limit

    cursor = db.users.find(query, {"_id": 0, "password_hash": 0}).sort("created_at", -1).skip(skip).limit(limit)
    users = await cursor.to_list(length=limit)

    return {
        "users": users,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
    }


@router.patch("/accept-cgu", status_code=200)
async def citadelle_accept_cgu(request: Request):
    """
    Enregistre l'acceptation des CGU/CGV pour un utilisateur Citadelle existant.
    Utilisé lors de la première connexion si cgu_accepted=False.
    Capture l'adresse IP et l'horodatage pour conformité RGPD / Stripe Connect.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token manquant")

    token = auth_header.split(" ")[1]
    try:
        decoded = decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")

    if decoded is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")

    if decoded.get("platform") != "citadelle":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux utilisateurs Citadelle")

    user = await db.users.find_one(
        {"id": decoded["sub"], "platform": "citadelle"},
        {"_id": 0, "id": 1}
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")

    # Capture de l'IP réelle (derrière proxy/Kubernetes)
    client_ip = get_client_ip(request)

    now = datetime.now(timezone.utc).isoformat()

    await db.users.update_one(
        {"id": user["id"], "platform": "citadelle"},
        {"$set": {
            "cgu_accepted": True,
            "cgu_accepted_at": now,
            "cgu_ip_address": client_ip,
            "cgu_version": "1.0",
            "updated_at": now,
        }}
    )

    logger.info(f"[Citadelle] CGU/CGV acceptées (connexion) par user_id: {user['id']} — IP: {client_ip}")
    return {"message": "CGU/CGV acceptées avec succès", "cgu_accepted_at": now}
