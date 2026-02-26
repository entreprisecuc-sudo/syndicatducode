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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

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
    return {"message": "Joerke B API", "status": "online"}

@api_router.get("/config")
async def get_config():
    return {
        "phone": COMPANY_PHONE,
        "city": COMPANY_CITY,
        "email": CONTACT_EMAIL
    }

@api_router.post("/contact", response_model=ContactResponse)
async def create_contact(data: ContactRequest):
    contact_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    
    doc = {
        "id": contact_id,
        "name": data.name,
        "email": data.email,
        "phone": data.phone,
        "message": data.message,
        "created_at": created_at,
        "status": "pending"
    }
    
    await db.contacts.insert_one(doc)
    
    return ContactResponse(
        id=contact_id,
        name=data.name,
        email=data.email,
        phone=data.phone,
        message=data.message,
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
