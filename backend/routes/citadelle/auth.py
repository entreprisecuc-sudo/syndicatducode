"""
Routes d'authentification — La Citadelle Numérique
Inscription, connexion, reset mot de passe INDÉPENDANTS du Syndicat du Code
platform: "citadelle" — isolation stricte
"""

from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime, timezone, timedelta
import logging
import re
import uuid
import hashlib
import secrets

from services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    generate_user_id
)
from services.email_service import send_citadelle_reset_password_email

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


def _generate_reset_token() -> tuple[str, str]:
    """Génère un token sécurisé et son hash SHA-256. Retourne (token_brut, token_hash)."""
    raw = secrets.token_urlsafe(48)
    hashed = hashlib.sha256(raw.encode()).hexdigest()
    return raw, hashed


def _verify_reset_token(raw_token: str, token_hash: str) -> bool:
    """Vérifie un token brut contre son hash stocké."""
    return hashlib.sha256(raw_token.encode()).hexdigest() == token_hash


def _is_token_expired(expires_at: str) -> bool:
    """Vérifie si un token est expiré."""
    expiry = datetime.fromisoformat(expires_at)
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    return expiry < datetime.now(timezone.utc)


# ============================================
# ROUTES
# ============================================

@router.post("/register", response_model=CitadelleUserResponse, status_code=status.HTTP_201_CREATED)
async def citadelle_register(user_data: CitadelleRegister):
    """
    Inscription sur La Citadelle Numérique.
    Crée un compte INDÉPENDANT avec platform='citadelle'.
    L'email doit être unique dans toute la base (Syndicat + Citadelle).
    """
    # Validation mot de passe
    try:
        user_data.validate_password()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Vérifier unicité email (globale — un email = un seul compte sur toutes les plateformes)
    existing = await db.users.find_one({"email": user_data.email.lower()}, {"_id": 0, "email": 1})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un compte existe déjà avec cet email"
        )

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
        "first_login": False
    }

    await db.users.insert_one(user_doc)
    logger.info(f"[Citadelle] Nouvel utilisateur inscrit: {user_data.email}")

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
    ip = request.client.host if request.client else "unknown"

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
        raw_token, token_hash = _generate_reset_token()
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
        if _verify_reset_token(data.token, reset["token_hash"]):
            valid_reset = reset
            break

    if not valid_reset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lien de réinitialisation invalide ou déjà utilisé"
        )

    if _is_token_expired(valid_reset["expires_at"]):
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
