"""
Middleware d'authentification
Protection des routes par JWT et rôle
"""

from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List

from services.auth_service import decode_access_token

# Schéma de sécurité Bearer Token
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Récupère l'utilisateur courant depuis le token JWT
    
    Raises:
        HTTPException 401: Si le token est invalide ou expiré
    
    Returns:
        Données de l'utilisateur décodées du token
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return payload


def require_role(allowed_roles: List[str]):
    """
    Décorateur de dépendance pour vérifier le rôle de l'utilisateur
    
    Args:
        allowed_roles: Liste des rôles autorisés
    
    Usage:
        @router.get("/admin", dependencies=[Depends(require_role(["admin"]))])
    """
    async def role_checker(
        current_user: dict = Depends(get_current_user)
    ) -> dict:
        user_role = current_user.get("role")
        
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès non autorisé pour ce rôle"
            )
        
        return current_user
    
    return role_checker


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    )
) -> Optional[dict]:
    """
    Récupère l'utilisateur courant si un token est fourni (optionnel)
    
    Returns:
        Données de l'utilisateur ou None
    """
    if credentials is None:
        return None
    
    token = credentials.credentials
    return decode_access_token(token)


class RoleChecker:
    """
    Classe pour vérifier les rôles de manière plus flexible
    
    Usage:
        role_checker = RoleChecker(["admin", "commercial"])
        @router.get("/protected", dependencies=[Depends(role_checker)])
    """
    
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles
    
    async def __call__(
        self,
        current_user: dict = Depends(get_current_user)
    ) -> dict:
        user_role = current_user.get("role")
        
        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Accès réservé aux rôles: {', '.join(self.allowed_roles)}"
            )
        
        return current_user


async def require_admin(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Vérifie que l'utilisateur est un administrateur
    
    Raises:
        HTTPException 403: Si l'utilisateur n'est pas admin
    
    Returns:
        Données de l'utilisateur admin
    """
    user_role = current_user.get("role")
    
    if user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs"
        )
    
    return current_user
