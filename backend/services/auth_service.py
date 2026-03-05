"""
Service d'authentification
Gestion des mots de passe, JWT, et tokens de réinitialisation
"""

from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid
import secrets
import hashlib

from passlib.context import CryptContext
from jose import jwt, JWTError

from config.settings import (
    JWT_SECRET_KEY,
    JWT_ALGORITHM,
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
    JWT_RESET_TOKEN_EXPIRE_MINUTES
)

# Contexte pour le hashage des mots de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash un mot de passe avec bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie un mot de passe contre son hash"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crée un token JWT
    
    Args:
        data: Données à encoder dans le token
        expires_delta: Durée de validité personnalisée
    
    Returns:
        Token JWT encodé
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Décode et vérifie un token JWT
    
    Args:
        token: Token JWT à décoder
    
    Returns:
        Données décodées ou None si invalide
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


def generate_reset_token() -> tuple[str, str]:
    """
    Génère un token de réinitialisation de mot de passe
    
    Returns:
        Tuple (token_brut, token_hashé)
        - token_brut: à envoyer par email
        - token_hashé: à stocker en BDD
    """
    # Génère un token aléatoire sécurisé
    raw_token = secrets.token_urlsafe(32)
    
    # Hash le token pour le stockage (on ne stocke jamais le token brut)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    
    return raw_token, token_hash


def verify_reset_token(raw_token: str, stored_hash: str) -> bool:
    """
    Vérifie un token de réinitialisation
    
    Args:
        raw_token: Token reçu de l'utilisateur
        stored_hash: Hash stocké en BDD
    
    Returns:
        True si le token est valide
    """
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    return secrets.compare_digest(token_hash, stored_hash)


def get_reset_token_expiry() -> str:
    """
    Calcule la date d'expiration d'un token de réinitialisation
    
    Returns:
        Date d'expiration en ISO format
    """
    expiry = datetime.now(timezone.utc) + timedelta(minutes=JWT_RESET_TOKEN_EXPIRE_MINUTES)
    return expiry.isoformat()


def is_token_expired(expires_at: str) -> bool:
    """
    Vérifie si un token est expiré
    
    Args:
        expires_at: Date d'expiration en ISO format
    
    Returns:
        True si le token est expiré
    """
    expiry = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
    return datetime.now(timezone.utc) > expiry


def generate_user_id() -> str:
    """Génère un ID unique pour un utilisateur"""
    return str(uuid.uuid4())
