"""
Serveur principal Le Syndicat du Code
API FastAPI avec authentification et gestion des contacts
"""

from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
import uuid
from datetime import datetime, timezone
import shutil
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configuration
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Uploads directory
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# SMTP Configuration
SMTP_HOST = os.environ.get('SMTP_HOST', '')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 465))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
CONTACT_EMAIL = os.environ.get('CONTACT_EMAIL', '')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI App
app = FastAPI(
    title="Le Syndicat du Code API",
    description="API pour le site Le Syndicat du Code",
    version="2.0.0"
)

# Router principal
api_router = APIRouter(prefix="/api")


# ============================================
# MODÈLES CONTACT (existants)
# ============================================

class ContactRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    phone: Optional[str] = None
    message: str = Field(..., min_length=10)


class ContactResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: str
    phone: Optional[str]
    message: str
    files: List[str] = []
    created_at: str
    status: str = "pending"


# ============================================
# ROUTES EXISTANTES (Contact)
# ============================================

@api_router.get("/")
async def root():
    return {"message": "Le Syndicat du Code API", "status": "online", "version": "2.0.0"}


@api_router.get("/config")
async def get_config():
    return {"email": CONTACT_EMAIL}


def send_email_notification(name: str, email: str, phone: str, message: str, files: List[str]):
    """Envoie un email de notification pour une nouvelle demande de devis"""
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = CONTACT_EMAIL
        msg['Subject'] = f"Nouvelle demande de devis - {name}"
        
        body = f"""
Nouvelle demande de devis reçue sur le site Le Syndicat du Code.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 NOM : {name}
📧 EMAIL : {email}
📞 TÉLÉPHONE : {phone or 'Non renseigné'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💬 MESSAGE :

{message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📎 FICHIERS JOINTS : {len(files)} fichier(s)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Notre loi. Unis par le code.
        """
        
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Email envoyé pour la demande de {name}")
        return True
    except Exception as e:
        logger.error(f"Erreur envoi email: {e}")
        return False


@api_router.post("/contact", response_model=ContactResponse)
async def create_contact(
    name: str = Form(...),
    email: str = Form(...),
    phone: Optional[str] = Form(None),
    message: str = Form(...),
    files: List[UploadFile] = File(default=[])
):
    contact_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    
    # Save uploaded files
    saved_files = []
    for file in files:
        if file.filename:
            file_ext = Path(file.filename).suffix
            file_id = f"{contact_id}_{uuid.uuid4().hex[:8]}{file_ext}"
            file_path = UPLOADS_DIR / file_id
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            saved_files.append(file_id)
    
    doc = {
        "id": contact_id,
        "name": name,
        "email": email,
        "phone": phone,
        "message": message,
        "files": saved_files,
        "created_at": created_at,
        "status": "pending"
    }
    
    await db.contacts.insert_one(doc)
    
    # Envoyer notification par email
    send_email_notification(name, email, phone or "", message, saved_files)
    
    return ContactResponse(
        id=contact_id,
        name=name,
        email=email,
        phone=phone,
        message=message,
        files=saved_files,
        created_at=created_at,
        status="pending"
    )


@api_router.get("/contacts")
async def get_contacts():
    contacts = await db.contacts.find({}, {"_id": 0}).to_list(100)
    return contacts


# ============================================
# IMPORT DES ROUTES D'AUTHENTIFICATION
# ============================================

from routes.auth import router as auth_router, set_database as set_auth_db
from routes.admin import router as admin_router, set_database as set_admin_db
from routes.projects import router as projects_router, set_database as set_projects_db
from routes.announcements import router as announcements_router, set_database as set_announcements_db
from routes.alerts import router as alerts_router, set_database as set_alerts_db
from routes.subscriptions import router as subscriptions_router, set_database as set_subscriptions_db
from routes.partners import router as partners_router, set_database as set_partners_db
from routes.profile import router as profile_router, set_database as set_profile_db
from routes.members import router as members_router, set_database as set_members_db
from routes.messages import router as messages_router, set_database as set_messages_db
from routes.notifications import router as notifications_router, set_database as set_notifications_db
from routes.project_rooms import router as project_rooms_router, set_database as set_project_rooms_db

# Injecter la base de données dans les modules
set_auth_db(db)
set_admin_db(db)
set_projects_db(db)
set_announcements_db(db)
set_alerts_db(db)
set_subscriptions_db(db)
set_partners_db(db)
set_profile_db(db)
set_members_db(db)
set_messages_db(db)
set_notifications_db(db)
set_project_rooms_db(db)

# Inclure les routes
api_router.include_router(auth_router)
api_router.include_router(admin_router)
api_router.include_router(projects_router)
api_router.include_router(announcements_router)
api_router.include_router(alerts_router)
api_router.include_router(subscriptions_router)
api_router.include_router(partners_router)
api_router.include_router(profile_router)
api_router.include_router(members_router)
api_router.include_router(messages_router)
api_router.include_router(notifications_router)


# ============================================
# INCLUSION DU ROUTER PRINCIPAL
# ============================================

app.include_router(api_router)


# ============================================
# MIDDLEWARE CORS
# ============================================

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# ÉVÉNEMENTS
# ============================================

@app.on_event("startup")
async def startup_event():
    """Initialisation au démarrage"""
    # Créer les index pour la collection users
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.password_resets.create_index("user_id")
    await db.password_resets.create_index("expires_at")
    # Index pour les annonces
    await db.announcements.create_index("id", unique=True)
    await db.announcements.create_index([("is_pinned", -1), ("created_at", -1)])
    # Index pour les alertes
    await db.alerts.create_index("id", unique=True)
    await db.alerts.create_index("is_active")
    # Index pour les abonnements
    await db.subscription_plans.create_index("id", unique=True)
    await db.subscriptions.create_index("id", unique=True)
    await db.subscriptions.create_index("user_id")
    await db.subscriptions.create_index([("user_id", 1), ("status", 1)])
    # Index pour les profils
    await db.profiles.create_index("user_id", unique=True)
    logger.info("Indexes créés pour toutes les collections")


@app.on_event("shutdown")
async def shutdown_db_client():
    """Fermeture de la connexion MongoDB"""
    client.close()
