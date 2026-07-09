"""
Routes d'authentification
Inscription, connexion, mot de passe oublié, réinitialisation
"""

from fastapi import APIRouter, HTTPException, status, Depends, Request
from datetime import datetime, timezone, timedelta
import uuid
import logging

from models.user import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    RoleChoice,
    ForgotPassword,
    ResetPassword
)
from services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    get_access_token_expiry,
    generate_reset_token,
    verify_reset_token,
    get_reset_token_expiry,
    is_token_expired,
    generate_user_id
)
from services.email_service import send_reset_password_email, send_welcome_email
from middleware.auth import get_current_user
from config.settings import UserStatus

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentification"])

# Variable globale pour la base de données (injectée depuis server.py)
db = None

def set_database(database):
    """Injecte la connexion à la base de données"""
    global db
    db = database


def _get_client_ip(request: Request) -> str:
    """Extrait l'IP réelle du client (gère les proxys)"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def _check_brute_force(ip: str) -> None:
    """Vérifie si l'IP est bloquée par la protection anti-brute force"""
    config = await db.brute_force_config.find_one({}, {"_id": 0})
    if not config:
        config = {"max_attempts": 5, "block_duration_minutes": 15, "window_minutes": 5, "is_active": True}

    if not config.get("is_active", True):
        return

    now = datetime.now(timezone.utc)

    # Vérifier si déjà bloqué
    blocked = await db.blocked_ips.find_one({"ip": ip}, {"_id": 0})
    if blocked:
        blocked_until = datetime.fromisoformat(blocked["blocked_until"])
        if blocked_until > now:
            remaining = max(1, int((blocked_until - now).total_seconds() / 60) + 1)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Trop de tentatives de connexion. Réessayez dans {remaining} minute(s)."
            )
        else:
            await db.blocked_ips.delete_one({"ip": ip})

    # Compter les tentatives récentes
    window_start = (now - timedelta(minutes=config["window_minutes"])).isoformat()
    count = await db.login_attempts.count_documents({
        "ip": ip,
        "timestamp": {"$gte": window_start}
    })

    if count >= config["max_attempts"]:
        block_duration = config["block_duration_minutes"]
        blocked_until = (now + timedelta(minutes=block_duration)).isoformat()
        await db.blocked_ips.update_one(
            {"ip": ip},
            {"$set": {
                "ip": ip,
                "blocked_at": now.isoformat(),
                "blocked_until": blocked_until,
                "attempts_count": count
            }},
            upsert=True
        )
        logger.warning(f"IP bloquée pour brute force: {ip} ({count} tentatives)")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Trop de tentatives de connexion. IP bloquée pour {block_duration} minute(s)."
        )


async def _log_failed_attempt(ip: str, email: str) -> None:
    """Enregistre une tentative de connexion échouée"""
    now = datetime.now(timezone.utc)
    await db.login_attempts.insert_one({
        "ip": ip,
        "email": email,
        "timestamp": now.isoformat(),
        "created_at": now
    })


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    """
    Inscription d'un nouvel utilisateur
    
    - Email unique obligatoire
    - Mot de passe sécurisé (8 chars min, majuscule, minuscule, chiffre)
    - Compte créé sans rôle (à choisir à la première connexion)
    """
    # Vérifier si l'email existe déjà sur la plateforme Syndicat
    existing_user = await db.users.find_one({"email": user_data.email.lower(), "platform": "syndicat"})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un compte existe déjà avec cet email"
        )
    
    # Créer l'utilisateur
    now = datetime.now(timezone.utc).isoformat()
    user_id = generate_user_id()
    
    user_doc = {
        "id": user_id,
        "email": user_data.email.lower(),
        "password_hash": hash_password(user_data.password),
        "role": None,  # Pas de rôle initial
        "platform": "syndicat",
        "status": UserStatus.PENDING,
        "created_at": now,
        "updated_at": now,
        "first_login": True
    }
    
    await db.users.insert_one(user_doc)
    
    # Envoyer email de bienvenue (asynchrone, ne bloque pas)
    send_welcome_email(user_data.email)
    
    logger.info(f"Nouvel utilisateur inscrit: {user_data.email}")
    
    return UserResponse(
        id=user_id,
        email=user_data.email.lower(),
        role=None,
        status=UserStatus.PENDING,
        created_at=now,
        first_login=True
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, request: Request):
    """
    Connexion utilisateur

    - Retourne un token JWT
    - Indique si c'est la première connexion (choix du rôle requis)
    - Protégé contre le brute force (rate limiting par IP)
    """
    ip = _get_client_ip(request)

    # Vérification anti-brute force
    await _check_brute_force(ip)

    # Rechercher l'utilisateur sur la plateforme Syndicat
    user = await db.users.find_one({"email": credentials.email.lower(), "platform": "syndicat"})

    if not user:
        await _log_failed_attempt(ip, credentials.email.lower())
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )

    # Vérifier le mot de passe
    if not verify_password(credentials.password, user["password_hash"]):
        await _log_failed_attempt(ip, credentials.email.lower())
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )

    # Vérifier le statut du compte
    if user.get("status") == UserStatus.SUSPENDED:
        suspension_reason = user.get("suspension_reason", "")
        detail_message = "Votre compte a été suspendu."
        if suspension_reason:
            detail_message += f"\n\nMotif : {suspension_reason}"
        detail_message += "\n\nUn email vous a été envoyé avec plus de détails. Si vous pensez qu'il s'agit d'une erreur, contactez-nous à contact@syndicatducode.fr"
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail_message
        )
    
    # Enregistrement de la dernière connexion (audit)
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_login_at": datetime.now(timezone.utc).isoformat()}}
    )

    # Créer le token JWT
    token_data = {
        "sub": user["id"],
        "email": user["email"],
        "role": user.get("role"),
        "status": user.get("status")
    }
    access_token = create_access_token(token_data, get_access_token_expiry(credentials.remember_me))
    
    logger.info(f"Connexion réussie: {user['email']}")
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            role=user.get("role"),
            status=user.get("status", UserStatus.PENDING),
            created_at=user["created_at"],
            first_login=user.get("first_login", True)
        )
    )


@router.post("/choose-role", response_model=TokenResponse)
async def choose_role(
    role_data: RoleChoice,
    current_user: dict = Depends(get_current_user)
):
    """
    Choix du rôle (première connexion uniquement)
    
    - commercial: Partenaire commercial (apporteur d'affaires)
    - developer: Partenaire développeur (freelance)
    
    Le choix est DÉFINITIF et ne peut être modifié que par un admin.
    """
    user_id = current_user.get("sub")
    
    # Récupérer l'utilisateur
    user = await db.users.find_one({"id": user_id})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    # Vérifier que l'utilisateur n'a pas déjà un rôle
    if user.get("role") is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous avez déjà choisi un rôle. Ce choix est définitif."
        )
    
    # Mettre à jour le rôle
    now = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {"id": user_id},
        {
            "$set": {
                "role": role_data.role,
                "status": UserStatus.ACTIVE,
                "first_login": False,
                "updated_at": now
            }
        }
    )
    
    # Créer un nouveau token avec le rôle
    token_data = {
        "sub": user["id"],
        "email": user["email"],
        "role": role_data.role,
        "status": UserStatus.ACTIVE
    }
    access_token = create_access_token(token_data)
    
    logger.info(f"Rôle choisi pour {user['email']}: {role_data.role}")
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            role=role_data.role,
            status=UserStatus.ACTIVE,
            created_at=user["created_at"],
            first_login=False
        )
    )


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(data: ForgotPassword):
    """
    Demande de réinitialisation de mot de passe
    
    - Envoie un email avec un lien de réinitialisation
    - Le lien est valable 1 heure et à usage unique
    - Pour des raisons de sécurité, on ne révèle pas si l'email existe
    """
    # Rechercher l'utilisateur (mais ne pas révéler s'il existe)
    user = await db.users.find_one({"email": data.email.lower(), "platform": "syndicat"})
    
    # Message générique dans tous les cas
    response_message = "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé."
    
    if user:
        # Générer le token
        raw_token, token_hash = generate_reset_token()
        
        # Stocker le token en BDD
        reset_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "token_hash": token_hash,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": get_reset_token_expiry(),
            "used": False
        }
        await db.password_resets.insert_one(reset_doc)
        
        # Envoyer l'email
        send_reset_password_email(user["email"], raw_token)
        
        logger.info(f"Token de réinitialisation généré pour: {user['email']}")
    
    return {"message": response_message}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(data: ResetPassword):
    """
    Réinitialisation du mot de passe avec le token
    
    - Le token doit être valide et non expiré
    - Le token ne peut être utilisé qu'une seule fois
    """
    # Rechercher tous les tokens non utilisés
    reset_tokens = await db.password_resets.find({"used": False}).to_list(100)
    
    # Vérifier le token
    valid_reset = None
    for reset in reset_tokens:
        if verify_reset_token(data.token, reset["token_hash"]):
            valid_reset = reset
            break
    
    if not valid_reset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lien de réinitialisation invalide ou déjà utilisé"
        )
    
    # Vérifier l'expiration
    if is_token_expired(valid_reset["expires_at"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le lien de réinitialisation a expiré. Veuillez en demander un nouveau."
        )
    
    # Mettre à jour le mot de passe
    now = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {"id": valid_reset["user_id"]},
        {
            "$set": {
                "password_hash": hash_password(data.new_password),
                "updated_at": now
            }
        }
    )
    
    # Marquer le token comme utilisé
    await db.password_resets.update_one(
        {"id": valid_reset["id"]},
        {"$set": {"used": True}}
    )
    
    # Invalider tous les autres tokens de cet utilisateur
    await db.password_resets.update_many(
        {"user_id": valid_reset["user_id"], "used": False},
        {"$set": {"used": True}}
    )
    
    logger.info(f"Mot de passe réinitialisé pour user_id: {valid_reset['user_id']}")
    
    return {"message": "Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter."}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    Récupère les informations de l'utilisateur connecté
    """
    user_id = current_user.get("sub")
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    return UserResponse(
        id=user["id"],
        email=user["email"],
        role=user.get("role"),
        status=user.get("status", UserStatus.PENDING),
        created_at=user["created_at"],
        first_login=user.get("first_login", True)
    )
