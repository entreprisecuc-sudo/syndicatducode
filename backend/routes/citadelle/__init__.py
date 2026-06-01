"""
Module routes La Citadelle Numérique
Plateforme indépendante d'achat/vente d'actifs numériques
"""

from fastapi import APIRouter
from routes.citadelle.auth import router as citadelle_auth_router, set_database as set_citadelle_auth_db

router = APIRouter(prefix="/citadelle", tags=["La Citadelle Numérique"])
router.include_router(citadelle_auth_router)

# Référence db pour injection
_db = None

def set_database(database):
    """Injecte la base de données dans tous les sous-modules Citadelle"""
    global _db
    _db = database
    set_citadelle_auth_db(database)
