"""
Routes publiques pour la zone membres
Affichage des développeurs avec abonnement actif
"""

from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/members", tags=["Membres"])

# Variable globale pour la base de données
db = None

def set_database(database):
    """Injecte la connexion à la base de données"""
    global db
    db = database


@router.get("/public")
async def get_public_members(
    skill: Optional[str] = None,
    experience: Optional[str] = None,
    city: Optional[str] = None,
    limit: int = Query(default=50, le=100)
):
    """
    Récupère la liste des développeurs avec un abonnement actif
    pour affichage public sur la zone membres
    
    Filtres optionnels :
    - skill: filtrer par compétence
    - experience: filtrer par années d'expérience
    - city: filtrer par ville
    """
    
    # 1. Récupérer les user_ids avec abonnement actif
    active_subscriptions = await db.subscriptions.find(
        {"status": "active"},
        {"user_id": 1, "_id": 0}
    ).to_list(500)
    
    active_user_ids = [sub["user_id"] for sub in active_subscriptions]
    
    if not active_user_ids:
        return {"members": [], "total": 0}
    
    # 2. Récupérer les utilisateurs développeurs actifs avec abonnement
    users_query = {
        "id": {"$in": active_user_ids},
        "role": "developer",
        "status": "active"
    }
    
    users = await db.users.find(
        users_query,
        {"_id": 0, "password_hash": 0, "reset_token": 0}
    ).to_list(500)
    
    user_ids = [u["id"] for u in users]
    
    if not user_ids:
        return {"members": [], "total": 0}
    
    # 3. Récupérer les profils correspondants
    profile_query = {"user_id": {"$in": user_ids}}
    
    # Appliquer les filtres sur le profil
    if skill:
        profile_query["skills"] = {"$in": [skill]}
    if experience:
        profile_query["experience"] = experience
    if city:
        profile_query["city"] = {"$regex": city, "$options": "i"}
    
    profiles = await db.profiles.find(
        profile_query,
        {"_id": 0}
    ).to_list(500)
    
    # 4. Récupérer les portfolios
    portfolios = await db.portfolio.find(
        {"user_id": {"$in": user_ids}},
        {"_id": 0}
    ).to_list(1000)
    
    # Grouper les projets par user_id
    portfolio_by_user = {}
    for project in portfolios:
        uid = project["user_id"]
        if uid not in portfolio_by_user:
            portfolio_by_user[uid] = []
        portfolio_by_user[uid].append(project)
    
    # 5. Construire la réponse combinée
    members = []
    profile_map = {p["user_id"]: p for p in profiles}
    
    for user in users:
        user_id = user["id"]
        profile = profile_map.get(user_id, {})
        
        # Vérifier que le profil correspond aux filtres (si profil existe)
        if skill and skill not in profile.get("skills", []):
            continue
        if experience and profile.get("experience") != experience:
            continue
        if city and city.lower() not in profile.get("city", "").lower():
            continue
        
        member_data = {
            "id": user_id,
            "email": user["email"],
            "created_at": user.get("created_at"),
            "profile": {
                "first_name": profile.get("first_name"),
                "last_name": profile.get("last_name"),
                "photo_url": profile.get("photo_url"),
                "city": profile.get("city"),
                "bio": profile.get("bio"),
                "experience": profile.get("experience"),
                "availability": profile.get("availability"),
                "skills": profile.get("skills", []),
                "github": profile.get("github"),
                "linkedin": profile.get("linkedin"),
                "portfolio": profile.get("portfolio")
            },
            "projects": portfolio_by_user.get(user_id, [])[:6]  # Max 6 projets
        }
        
        members.append(member_data)
    
    # Limiter le nombre de résultats
    members = members[:limit]
    
    return {
        "members": members,
        "total": len(members)
    }


@router.get("/public/{member_id}")
async def get_public_member_detail(member_id: str):
    """
    Récupère le profil détaillé d'un membre (si abonnement actif)
    """
    
    # Vérifier que le membre a un abonnement actif
    subscription = await db.subscriptions.find_one({
        "user_id": member_id,
        "status": "active"
    })
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membre non trouvé ou abonnement inactif"
        )
    
    # Récupérer l'utilisateur
    user = await db.users.find_one(
        {"id": member_id, "role": "developer", "status": "active"},
        {"_id": 0, "password_hash": 0}
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membre non trouvé"
        )
    
    # Récupérer le profil
    profile = await db.profiles.find_one(
        {"user_id": member_id},
        {"_id": 0}
    ) or {}
    
    # Récupérer tous les projets du portfolio
    projects = await db.portfolio.find(
        {"user_id": member_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    
    return {
        "id": user["id"],
        "email": user["email"],
        "created_at": user.get("created_at"),
        "profile": profile,
        "projects": projects
    }


@router.get("/skills")
async def get_available_skills():
    """
    Récupère la liste des compétences disponibles parmi les membres actifs
    """
    
    # Récupérer les user_ids avec abonnement actif
    active_subscriptions = await db.user_subscriptions.find(
        {"status": "active"},
        {"user_id": 1, "_id": 0}
    ).to_list(500)
    
    active_user_ids = [sub["user_id"] for sub in active_subscriptions]
    
    if not active_user_ids:
        return {"skills": []}
    
    # Agréger les compétences uniques
    pipeline = [
        {"$match": {"user_id": {"$in": active_user_ids}}},
        {"$unwind": "$skills"},
        {"$group": {"_id": "$skills", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    
    result = await db.profiles.aggregate(pipeline).to_list(100)
    
    skills = [{"name": r["_id"], "count": r["count"]} for r in result if r["_id"]]
    
    return {"skills": skills}
