"""
Dépendances d'authentification — La Citadelle Numérique.
Centralise les contrôles d'accès partagés par les routes Citadelle (DRY).
Ne concerne QUE la plateforme Citadelle ; le Syndicat utilise middleware/auth.py.
"""

from fastapi import Depends, HTTPException, status

from middleware.auth import get_current_user


async def require_citadelle_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Autorise les membres de la plateforme Citadelle (ou un administrateur)."""
    if current_user.get("platform") != "citadelle" and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux membres Citadelle",
        )
    return current_user


async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Autorise uniquement les administrateurs."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs",
        )
    return current_user
