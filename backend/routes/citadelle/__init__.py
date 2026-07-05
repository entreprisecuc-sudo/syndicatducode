"""
Module routes La Citadelle Numérique
Plateforme indépendante d'achat/vente d'actifs numériques
"""

from fastapi import APIRouter
from routes.citadelle.dependencies import set_database as set_citadelle_dependencies_db
from routes.citadelle.auth import router as citadelle_auth_router, set_database as set_citadelle_auth_db
from routes.citadelle.listings import router as citadelle_listings_router, set_database as set_citadelle_listings_db
from routes.citadelle.transactions import router as citadelle_transactions_router, set_database as set_citadelle_transactions_db
from routes.citadelle.messages import router as citadelle_messages_router, set_database as set_citadelle_messages_db
from routes.citadelle.services import router as citadelle_services_router, set_database as set_citadelle_services_db
from routes.citadelle.newsletter import router as citadelle_newsletter_router, set_database as set_citadelle_newsletter_db
from routes.citadelle.blog import router as citadelle_blog_router, set_database as set_citadelle_blog_db
from routes.citadelle.contact import router as citadelle_contact_router
from routes.citadelle.settings import router as citadelle_settings_router, set_database as set_citadelle_settings_db
from routes.citadelle.payments import router as citadelle_payments_router, set_database as set_citadelle_payments_db
from routes.citadelle.connect import router as citadelle_connect_router, set_database as set_citadelle_connect_db
from routes.citadelle.estimation import router as citadelle_estimation_router, set_database as set_citadelle_estimation_db
from routes.citadelle.invoices import router as citadelle_invoices_router, set_database as set_citadelle_invoices_db
from routes.citadelle.stripe_connect import router as citadelle_stripe_connect_router, set_database as set_citadelle_stripe_connect_db
from routes.citadelle.transmissions import router as citadelle_transmissions_router, set_database as set_citadelle_transmissions_db
from routes.citadelle.reports import router as citadelle_reports_router, set_database as set_citadelle_reports_db
from routes.citadelle.moderation import router as citadelle_moderation_router, set_database as set_citadelle_moderation_db

router = APIRouter(prefix="/citadelle", tags=["La Citadelle Numérique"])
router.include_router(citadelle_auth_router)
router.include_router(citadelle_listings_router)
router.include_router(citadelle_transactions_router)
router.include_router(citadelle_messages_router)
router.include_router(citadelle_services_router)
router.include_router(citadelle_newsletter_router)
router.include_router(citadelle_blog_router)
router.include_router(citadelle_contact_router)
router.include_router(citadelle_settings_router)
router.include_router(citadelle_payments_router)
router.include_router(citadelle_connect_router)
router.include_router(citadelle_estimation_router)
router.include_router(citadelle_invoices_router)
router.include_router(citadelle_stripe_connect_router)
router.include_router(citadelle_transmissions_router)
router.include_router(citadelle_reports_router)
router.include_router(citadelle_moderation_router)

_db = None

def set_database(database):
    global _db
    _db = database
    set_citadelle_auth_db(database)
    set_citadelle_listings_db(database)
    set_citadelle_transactions_db(database)
    set_citadelle_messages_db(database)
    set_citadelle_services_db(database)
    set_citadelle_newsletter_db(database)
    set_citadelle_blog_db(database)
    set_citadelle_settings_db(database)
    set_citadelle_payments_db(database)
    set_citadelle_connect_db(database)
    set_citadelle_estimation_db(database)
    set_citadelle_invoices_db(database)
    set_citadelle_stripe_connect_db(database)
    set_citadelle_transmissions_db(database)
    set_citadelle_reports_db(database)
    set_citadelle_moderation_db(database)
    set_citadelle_dependencies_db(database)
