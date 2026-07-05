"""
Dépendances d'authentification — La Citadelle Numérique.
Centralise les contrôles d'accès partagés par les routes Citadelle (DRY).
Ne concerne QUE la plateforme Citadelle ; le Syndicat utilise middleware/auth.py.
"""

from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status

from middleware.auth import get_current_user

_db = None


def set_database(database):
    global _db
    _db = database


async def _statut_membre_ok(user_id: str) -> None:
    """Revérifie en base le statut du membre (banni / suspendu) pour ne pas se fier au seul token."""
    if _db is None:
        return
    membre = await _db.users.find_one({"id": user_id}, {"_id": 0, "status": 1, "suspended_until": 1})
    if not membre:
        return
    statut = membre.get("status", "active")
    if statut == "banned":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Votre compte a été banni. Contactez le support.")
    if statut == "suspended":
        until = membre.get("suspended_until")
        if until and datetime.now(timezone.utc).isoformat() < until:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail=f"Votre compte est suspendu jusqu'au {until[:10]}.")


async def require_citadelle_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Autorise les membres de la plateforme Citadelle (ou un administrateur)."""
    if current_user.get("platform") != "citadelle" and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux membres Citadelle",
        )
    if current_user.get("role") != "admin":
        await _statut_membre_ok(current_user.get("sub"))
    return current_user


async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Autorise uniquement les administrateurs."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs",
        )
    return current_user
