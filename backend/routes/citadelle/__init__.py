"""
Module routes La Citadelle Numérique
Plateforme indépendante d'achat/vente d'actifs numériques
"""

from fastapi import APIRouter
from routes.citadelle.auth import router as citadelle_auth_router, set_database as set_citadelle_auth_db
from routes.citadelle.listings import router as citadelle_listings_router, set_database as set_citadelle_listings_db
from routes.citadelle.transactions import router as citadelle_transactions_router, set_database as set_citadelle_transactions_db
from routes.citadelle.messages import router as citadelle_messages_router, set_database as set_citadelle_messages_db

router = APIRouter(prefix="/citadelle", tags=["La Citadelle Numérique"])
router.include_router(citadelle_auth_router)
router.include_router(citadelle_listings_router)
router.include_router(citadelle_transactions_router)
router.include_router(citadelle_messages_router)

_db = None

def set_database(database):
    global _db
    _db = database
    set_citadelle_auth_db(database)
    set_citadelle_listings_db(database)
    set_citadelle_transactions_db(database)
    set_citadelle_messages_db(database)
