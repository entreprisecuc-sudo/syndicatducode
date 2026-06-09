"""
Configuration centralisée du backend
Variables d'environnement et constantes
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Charger les variables d'environnement
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME')

# JWT Configuration
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'syndicat-du-code-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 heures
JWT_RESET_TOKEN_EXPIRE_MINUTES = 60  # 1 heure pour reset password

# SMTP Configuration
SMTP_HOST = os.environ.get('SMTP_HOST', '')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 465))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
CONTACT_EMAIL = os.environ.get('CONTACT_EMAIL', '')

# CORS
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')

# URL du frontend (pour les liens dans les emails)
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://syndicatducode.fr')

# La Citadelle Numérique — URL et email expéditeur dédié
# Quand le SMTP lacitadellenumerique.fr sera actif, renseigner CITADELLE_FROM_EMAIL dans .env
CITADELLE_URL = os.environ.get('CITADELLE_URL', 'https://lacitadellenumerique.fr')
CITADELLE_FROM_EMAIL = os.environ.get('CITADELLE_FROM_EMAIL', SMTP_USER)

# Rôles utilisateur
class UserRole:
    NONE = None  # Pas encore de rôle choisi
    COMMERCIAL = "commercial"
    DEVELOPER = "developer"
    ADMIN = "admin"

# Statuts utilisateur
class UserStatus:
    ACTIVE = "active"
    SUSPENDED = "suspended"
    PENDING = "pending"  # En attente de choix de rôle

# Dossiers d'uploads
UPLOADS_DIR = os.environ.get('UPLOADS_DIR')
INVOICES_UPLOAD_DIR = f"{UPLOADS_DIR}/invoices"
PROFILES_UPLOAD_DIR = f"{UPLOADS_DIR}/profiles"
PORTFOLIO_UPLOAD_DIR = f"{UPLOADS_DIR}/portfolio"

# Règles mot de passe
PASSWORD_MIN_LENGTH = 8
