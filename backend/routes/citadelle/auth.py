"""
Routes d'authentification — La Citadelle Numérique
Inscription et connexion INDÉPENDANTS du Syndicat du Code
platform: "citadelle" — isolation stricte
"""

from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime, timezone
import logging
import re

from services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    generate_user_id
)

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
    Un utilisateur Syndicat ne peut pas se connecter ici.
    """
    # Rechercher l'utilisateur par email ET platform citadelle uniquement
    user = await db.users.find_one(
        {"email": credentials.email.lower(), "platform": "citadelle"},
        {"_id": 0}
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )

    if not verify_password(credentials.password, user["password_hash"]):
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
