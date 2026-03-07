"""
Routes d'administration - Module principal
Exporte le routeur combiné pour l'admin
"""

from fastapi import APIRouter

from routes.admin.users import router as users_router, set_database as set_users_db
from routes.admin.portfolio import router as portfolio_router, set_database as set_portfolio_db
from routes.admin.stats import router as stats_router, set_database as set_stats_db

router = APIRouter(prefix="/admin", tags=["Administration"])

# Inclure les sous-routeurs
router.include_router(users_router)
router.include_router(portfolio_router)
router.include_router(stats_router)


def set_database(database):
    """Injecte la connexion à la base de données dans tous les sous-modules"""
    set_users_db(database)
    set_portfolio_db(database)
    set_stats_db(database)
