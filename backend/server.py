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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory
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

# Config from env
CONTACT_EMAIL = os.environ.get('CONTACT_EMAIL', '')
COMPANY_PHONE = os.environ.get('COMPANY_PHONE', '')
COMPANY_CITY = os.environ.get('COMPANY_CITY', '')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
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

# Routes
@api_router.get("/")
async def root():
    return {"message": "Le Syndicat du Code API", "status": "online"}

@api_router.get("/config")
async def get_config():
    return {
        "email": CONTACT_EMAIL
    }

def send_email_notification(name: str, email: str, phone: str, message: str, files: List[str]):
    """Envoie un email de notification pour une nouvelle demande de devis"""
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = CONTACT_EMAIL
        msg['Subject'] = f"Nouvelle demande de devis - {name}"
        
        # Corps de l'email
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
        
        # Connexion SMTP SSL
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

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
