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


async def _statut_membre(user_id: str) -> dict:
    """Relit en base le statut du membre (source de vérité, pas seulement le token)."""
    if _db is None:
        return {}
    membre = await _db.users.find_one({"id": user_id}, {"_id": 0, "status": 1, "suspended_until": 1})
    return membre or {}


async def require_citadelle_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Autorise les membres Citadelle (ou un admin). Bloque uniquement les comptes BANNIS
    (les suspendus conservent l'accès en consultation ; le blocage des actions d'achat/vente/
    enchère est géré par `require_can_transact`)."""
    if current_user.get("platform") != "citadelle" and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux membres Citadelle",
        )
    if current_user.get("role") != "admin":
        membre = await _statut_membre(current_user.get("sub"))
        if membre.get("status") == "banned":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Votre compte a été banni. Accès limité à vos factures et documents de transmission.",
            )
    return current_user


async def require_can_transact(current_user: dict = Depends(require_citadelle_user)) -> dict:
    """Autorise uniquement les membres pouvant AGIR (acheter, vendre, enchérir).
    Bloque les suspendus (les bannis sont déjà bloqués par `require_citadelle_user`)."""
    if current_user.get("role") == "admin":
        return current_user
    membre = await _statut_membre(current_user.get("sub"))
    if membre.get("status") == "suspended":
        until = membre.get("suspended_until")
        if until and datetime.now(timezone.utc).isoformat() < until:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Compte suspendu jusqu'au {until[:10]} — achat, vente et enchère indisponibles.",
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
