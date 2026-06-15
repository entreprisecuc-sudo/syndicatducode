"""
Modèles Pydantic pour les utilisateurs
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    """Modèle pour l'inscription"""
    email: EmailStr
    password: str = Field(..., min_length=8)
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Le mot de passe doit contenir au moins 8 caractères')
        if not any(c.isupper() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins une majuscule')
        if not any(c.islower() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins une minuscule')
        if not any(c.isdigit() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins un chiffre')
        return v


class UserLogin(BaseModel):
    """Modèle pour la connexion"""
    email: EmailStr
    password: str
    remember_me: bool = False


class UserResponse(BaseModel):
    """Modèle de réponse utilisateur (sans mot de passe)"""
    id: str
    email: str
    role: Optional[str] = None
    status: str
    created_at: str
    first_login: bool = True


class UserInDB(BaseModel):
    """Modèle utilisateur en base de données"""
    id: str
    email: str
    password_hash: str
    role: Optional[str] = None
    status: str = "pending"
    created_at: str
    updated_at: str
    first_login: bool = True


class TokenResponse(BaseModel):
    """Modèle de réponse avec token"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class RoleChoice(BaseModel):
    """Modèle pour le choix du rôle"""
    role: str
    
    @field_validator('role')
    @classmethod
    def validate_role(cls, v):
        allowed_roles = ['commercial', 'developer']
        if v not in allowed_roles:
            raise ValueError(f'Rôle invalide. Choix possibles: {", ".join(allowed_roles)}')
        return v


class ForgotPassword(BaseModel):
    """Modèle pour mot de passe oublié"""
    email: EmailStr


class ResetPassword(BaseModel):
    """Modèle pour réinitialisation du mot de passe"""
    token: str
    new_password: str = Field(..., min_length=8)
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Le mot de passe doit contenir au moins 8 caractères')
        if not any(c.isupper() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins une majuscule')
        if not any(c.islower() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins une minuscule')
        if not any(c.isdigit() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins un chiffre')
        return v


class PasswordResetToken(BaseModel):
    """Modèle pour le token de réinitialisation en BDD"""
    id: str
    user_id: str
    token_hash: str
    created_at: str
    expires_at: str
    used: bool = False
