"""
Script pour créer le compte administrateur initial
Usage: python create_admin.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import uuid
import os
from dotenv import load_dotenv
from pathlib import Path

# Charger les variables d'environnement
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configuration
MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME')

# Email et mot de passe admin par défaut
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@syndicatducode.fr')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'AdminSyndicat2025!')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    """Crée le compte administrateur initial"""
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Vérifier si un admin existe déjà
    existing_admin = await db.users.find_one({"role": "admin"})
    
    if existing_admin:
        print(f"⚠️  Un admin existe déjà: {existing_admin['email']}")
        client.close()
        return
    
    # Créer l'admin
    now = datetime.now(timezone.utc).isoformat()
    admin_doc = {
        "id": str(uuid.uuid4()),
        "email": ADMIN_EMAIL,
        "password_hash": pwd_context.hash(ADMIN_PASSWORD),
        "role": "admin",
        "status": "active",
        "created_at": now,
        "updated_at": now,
        "first_login": False
    }
    
    await db.users.insert_one(admin_doc)
    
    print("✅ Compte administrateur créé avec succès!")
    print(f"   Email: {ADMIN_EMAIL}")
    print(f"   Mot de passe: {ADMIN_PASSWORD}")
    print("")
    print("⚠️  IMPORTANT: Changez ce mot de passe après la première connexion!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
