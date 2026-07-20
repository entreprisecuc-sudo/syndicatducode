"""
Routes blog — La Citadelle Numérique
CMS d'articles : lecture publique + gestion admin (CRUD Markdown)
Fonctionnalités : stats de vues, planification, SEO, slug personnalisé
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone, timedelta
import uuid
import re
import unicodedata
import logging

from routes.citadelle.dependencies import require_admin

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Citadelle Blog"])

db = None

def set_database(database):
    global db
    db = database


# ── Constantes ─────────────────────────────────────────────────────────────────

BLOG_CATEGORIES = [
    "actualites", "conseils", "tutoriels", "marche", "juridique",
    "vendre-un-site", "acheter-un-site", "estimation", "seo",
    "securite", "migration", "business", "ecommerce", "saas",
    "vente-applications", "reseaux-sociaux", "marketplace",
    "chroniques-la-garde", "guide-la-citadelle"
]


# ── Helpers ────────────────────────────────────────────────────────────────────

def _slugify(text: str) -> str:
    """Convertit un titre en slug URL-friendly (sans accents, sans espaces)"""
    text = unicodedata.normalize("NFD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s-]+", "-", text).strip("-")
    return text or "article"


async def _unique_slug(raw: str, exclude_id: str = None) -> str:
    """Génère un slug unique en ajoutant un suffixe numérique si nécessaire"""
    base = _slugify(raw)
    slug = base
    n = 1
    while True:
        query = {"slug": slug}
        if exclude_id:
            query["id"] = {"$ne": exclude_id}
        existing = await db.citadelle_blog_posts.find_one(query, {"_id": 0, "id": 1})
        if not existing:
            return slug
        slug = f"{base}-{n}"
        n += 1


# require_admin importé depuis routes/citadelle/dependencies (DRY)


# ── Modèles Pydantic ───────────────────────────────────────────────────────────

class AeoQuestion(BaseModel):
    """Paire question/réponse pour l'optimisation AEO (featured snippets, voice search)."""
    question: str
    answer: str


class BlogPostCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    excerpt: str = Field(default="", max_length=500)
    content_md: str = Field(min_length=10)
    category: str = Field(default="actualites")
    author_name: str = Field(default="La Citadelle Numérique", max_length=100)
    partner_link: Optional[str] = Field(None, max_length=500)
    cover_image_url: Optional[str] = Field(None, max_length=500)
    is_published: bool = False
    scheduled_at: Optional[str] = None
    seo_title: Optional[str] = Field(None, max_length=200)
    seo_description: Optional[str] = Field(None, max_length=300)
    seo_slug: Optional[str] = Field(None, max_length=200)
    seo_keywords: Optional[list[str]] = Field(default=None)
    geo_keywords: Optional[list[str]] = Field(default=None)
    aeo_questions: Optional[list[AeoQuestion]] = Field(default=None)


class BlogPostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    excerpt: Optional[str] = Field(None, max_length=500)
    content_md: Optional[str] = Field(None, min_length=10)
    category: Optional[str] = None
    author_name: Optional[str] = Field(None, max_length=100)
    partner_link: Optional[str] = Field(None, max_length=500)
    cover_image_url: Optional[str] = Field(None, max_length=500)
    is_published: Optional[bool] = None
    scheduled_at: Optional[str] = None
    seo_title: Optional[str] = Field(None, max_length=200)
    seo_description: Optional[str] = Field(None, max_length=300)
    seo_slug: Optional[str] = Field(None, max_length=200)
    seo_keywords: Optional[list[str]] = None
    geo_keywords: Optional[list[str]] = None
    aeo_questions: Optional[list[AeoQuestion]] = None


# ── Routes publiques ───────────────────────────────────────────────────────────

@router.get("/blog", summary="Liste des articles publiés")
async def list_posts(
    category: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=200),
    skip: int = Query(0, ge=0)
):
    """Retourne les articles publiés, triés par date de publication décroissante"""
    query = {"is_published": True}
    if category:
        query["category"] = category
    else:
        # Les rubriques premium (Chroniques, Guides) ont leur propre page dédiée : on les exclut du blog général.
        query["category"] = {"$nin": ["chroniques-la-garde", "guide-la-citadelle"]}
    cursor = db.citadelle_blog_posts.find(
        query, {"_id": 0, "content_md": 0}
    ).sort("published_at", -1).skip(skip).limit(limit)
    posts = await cursor.to_list(limit)
    total = await db.citadelle_blog_posts.count_documents(query)
    return {"posts": posts, "total": total}


@router.get("/blog/next-scheduled", summary="Prochain article programmé d'une rubrique (teaser)")
async def next_scheduled(category: str = Query("chroniques-la-garde")):
    """Retourne le teaser du prochain article programmé d'une rubrique (sans contenu)."""
    now = datetime.now(timezone.utc).isoformat()
    post = await db.citadelle_blog_posts.find_one(
        {
            "category": category,
            "is_published": False,
            "scheduled_at": {"$gt": now},
        },
        {"_id": 0, "slug": 1, "title": 1, "excerpt": 1, "cover_image_url": 1, "scheduled_at": 1},
        sort=[("scheduled_at", 1)],
    )
    return {"next": post}


@router.get("/blog/{slug}", summary="Lecture d'un article publié — incrémente les vues")
async def get_post(slug: str):
    """
    Retourne un article publié par son slug.
    Incrémente atomiquement le compteur de vues (view_count).
    """
    post = await db.citadelle_blog_posts.find_one_and_update(
        {"slug": slug, "is_published": True},
        {"$inc": {"view_count": 1}},
        projection={"_id": 0},
        return_document=True,
    )
    if not post:
        raise HTTPException(status_code=404, detail="Article introuvable")
    return post


@router.get("/blog/{slug}/related", summary="Articles liés à un article")
async def get_related_posts(slug: str):
    """
    Retourne jusqu'à 3 articles liés à l'article donné.
    Priorité : 1) même catégorie, 2) mots-clés SEO communs, 3) articles récents.
    """
    post = await db.citadelle_blog_posts.find_one(
        {"slug": slug, "is_published": True},
        {"_id": 0, "id": 1, "category": 1, "seo_keywords": 1}
    )
    if not post:
        raise HTTPException(status_code=404, detail="Article introuvable")

    projection = {"_id": 0, "content_md": 0}
    related = []

    # 1. Même catégorie
    cursor = db.citadelle_blog_posts.find(
        {"is_published": True, "slug": {"$ne": slug}, "category": post.get("category")},
        projection
    ).sort("view_count", -1).limit(3)
    related = await cursor.to_list(3)

    # 2. Compléter avec des articles partageant des mots-clés SEO
    if len(related) < 3:
        seen_ids = {r["id"] for r in related} | {post["id"]}
        keywords = post.get("seo_keywords") or []
        if keywords:
            cursor2 = db.citadelle_blog_posts.find(
                {
                    "is_published": True,
                    "slug": {"$ne": slug},
                    "id": {"$nin": list(seen_ids)},
                    "seo_keywords": {"$in": keywords}
                },
                projection
            ).sort("view_count", -1).limit(3 - len(related))
            more = await cursor2.to_list(3 - len(related))
            related.extend(more)

    # 3. Fallback : articles récents
    if len(related) < 3:
        seen_ids = {r["id"] for r in related} | {post["id"]}
        cursor3 = db.citadelle_blog_posts.find(
            {"is_published": True, "slug": {"$ne": slug}, "id": {"$nin": list(seen_ids)}},
            projection
        ).sort("published_at", -1).limit(3 - len(related))
        more = await cursor3.to_list(3 - len(related))
        related.extend(more)

    return {"related": related[:3]}


# ── Routes admin ───────────────────────────────────────────────────────────────

_ANALYTICS_COLLECTION = "citadelle_analytics_events"
_STATS_PERIODS = {"7d": 7, "30d": 30, "90d": 90, "365d": 365, "all": None}


def _stats_period_start(period: str):
    days = _STATS_PERIODS.get(period, 30)
    if days is None:
        return None
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()


def _classify_referrer(ref: str) -> str:
    if not ref:
        return "Accès direct"
    r = ref.lower()
    if any(s in r for s in ("google.", "bing.", "duckduckgo", "yahoo", "qwant", "ecosia")):
        return "Moteurs de recherche"
    if any(s in r for s in ("facebook", "instagram", "twitter", "x.com", "t.co", "linkedin", "youtube", "tiktok", "reddit", "pinterest", "whatsapp", "telegram")):
        return "Réseaux sociaux"
    if any(s in r for s in ("lacitadellenumerique", "syndicatducode")):
        return "Navigation interne"
    return "Autres sites"


@router.get("/admin/blog", summary="Admin — Articles paginés + filtre statut")
async def admin_list_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    status: str = Query("all", pattern="^(all|published|pending)$"),
    current_user: dict = Depends(require_admin),
):
    """Admin : liste paginée des articles (10/page) avec filtre par statut."""
    base = {}
    if status == "published":
        base = {"is_published": True}
    elif status == "pending":
        base = {"is_published": False}

    total = await db.citadelle_blog_posts.count_documents(base)
    counts = {
        "all": await db.citadelle_blog_posts.count_documents({}),
        "published": await db.citadelle_blog_posts.count_documents({"is_published": True}),
        "pending": await db.citadelle_blog_posts.count_documents({"is_published": False}),
    }
    cursor = (
        db.citadelle_blog_posts.find({**base}, {"_id": 0, "content_md": 0})
        .sort("created_at", -1)
        .skip((page - 1) * limit)
        .limit(limit)
    )
    posts = await cursor.to_list(limit)
    return {"posts": posts, "total": total, "page": page, "limit": limit, "counts": counts}


@router.get("/admin/blog/top", summary="Admin — Top articles les plus consultés")
async def admin_top_posts(
    limit: int = Query(10, ge=1, le=20),
    current_user: dict = Depends(require_admin),
):
    """Admin : classement des articles par nombre de vues cumulées."""
    cursor = (
        db.citadelle_blog_posts.find(
            {}, {"_id": 0, "id": 1, "title": 1, "slug": 1, "category": 1, "view_count": 1, "is_published": 1}
        )
        .sort("view_count", -1)
        .limit(limit)
    )
    posts = await cursor.to_list(limit)
    return {"posts": posts}


@router.get("/admin/blog/{post_id}", summary="Admin — Détail complet d'un article")
async def admin_get_post(
    post_id: str,
    current_user: dict = Depends(require_admin)
):
    """Admin : récupère un article complet par son ID (avec content_md)"""
    post = await db.citadelle_blog_posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Article introuvable")
    return post


@router.get("/admin/blog/{post_id}/stats", summary="Admin — Statistiques d'un article")
async def admin_post_stats(
    post_id: str,
    period: str = Query("30d", pattern="^(7d|30d|90d|365d|all)$"),
    current_user: dict = Depends(require_admin),
):
    """
    Statistiques d'audience d'un article : impressions, visiteurs uniques,
    provenance de l'audience et répartition par appareil (via analytics maison).
    """
    post = await db.citadelle_blog_posts.find_one(
        {"id": post_id}, {"_id": 0, "slug": 1, "title": 1, "view_count": 1}
    )
    if not post:
        raise HTTPException(status_code=404, detail="Article introuvable")

    path = f"/citadelle/blog/{post['slug']}"
    events = db[_ANALYTICS_COLLECTION]
    match = {"path": path}
    since = _stats_period_start(period)
    if since:
        match["created_at"] = {"$gte": since}

    impressions = await events.count_documents(match)
    unique_visitors = len(await events.distinct("ip_hash", match))
    devices = {d: await events.count_documents({**match, "device": d}) for d in ("mobile", "desktop")}

    # Provenance de l'audience (catégorisation des referrers)
    provenance = {}
    async for e in events.find(match, {"_id": 0, "referrer": 1}):
        cat = _classify_referrer(e.get("referrer"))
        provenance[cat] = provenance.get(cat, 0) + 1
    provenance_list = sorted(
        [{"source": k, "count": v} for k, v in provenance.items()],
        key=lambda x: x["count"], reverse=True
    )

    # Courbe temporelle (vues par jour)
    ts_pipeline = [
        {"$match": match},
        {"$group": {"_id": {"$substrCP": ["$created_at", 0, 10]}, "views": {"$sum": 1}}},
        {"$project": {"day": "$_id", "views": 1, "_id": 0}},
        {"$sort": {"day": 1}},
    ]
    timeseries = await events.aggregate(ts_pipeline).to_list(400)

    return {
        "post_id": post_id,
        "title": post.get("title"),
        "period": period,
        "view_count_total": post.get("view_count", 0),
        "impressions": impressions,
        "unique_visitors": unique_visitors,
        "devices": devices,
        "provenance": provenance_list,
        "timeseries": timeseries,
    }



@router.post("/admin/blog", status_code=201, summary="Admin — Créer un article")
async def admin_create_post(
    data: BlogPostCreate,
    current_user: dict = Depends(require_admin)
):
    """Admin : crée un nouvel article de blog"""
    now = datetime.now(timezone.utc).isoformat()

    # Slug : personnalisé > généré depuis le titre
    raw_slug = data.seo_slug if data.seo_slug else data.title
    slug = await _unique_slug(raw_slug)

    # Si scheduled_at est défini, l'article n'est pas publié immédiatement
    is_published = data.is_published
    scheduled_at = data.scheduled_at
    if scheduled_at:
        is_published = False  # La planification prend le dessus

    post = {
        "id": str(uuid.uuid4()),
        "slug": slug,
        "title": data.title,
        "excerpt": data.excerpt,
        "content_md": data.content_md,
        "category": data.category,
        "author_name": data.author_name,
        "partner_link": data.partner_link,
        "cover_image_url": data.cover_image_url,
        "is_published": is_published,
        "scheduled_at": scheduled_at,
        "published_at": now if is_published else None,
        "seo_title": data.seo_title,
        "seo_description": data.seo_description,
        "seo_keywords": data.seo_keywords or [],
        "geo_keywords": data.geo_keywords or [],
        "aeo_questions": [q.model_dump() for q in data.aeo_questions] if data.aeo_questions else [],
        "view_count": 0,
        "created_at": now,
        "updated_at": now,
    }
    await db.citadelle_blog_posts.insert_one(post)
    del post["_id"]
    logger.info(f"[Citadelle Blog] Article créé : {post['title']}")
    return post


@router.patch("/admin/blog/{post_id}", summary="Admin — Modifier un article")
async def admin_update_post(
    post_id: str,
    data: BlogPostUpdate,
    current_user: dict = Depends(require_admin)
):
    """Admin : modifie un article existant"""
    post = await db.citadelle_blog_posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Article introuvable")

    updates = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not updates:
        return post

    # Slug personnalisé ou régénéré depuis le titre
    if "seo_slug" in updates and updates["seo_slug"]:
        updates["slug"] = await _unique_slug(updates["seo_slug"], exclude_id=post_id)
    elif "title" in updates:
        updates["slug"] = await _unique_slug(updates["title"], exclude_id=post_id)

    # Planification : si scheduled_at est renseigné, dépublier
    if "scheduled_at" in updates and updates["scheduled_at"]:
        updates["is_published"] = False

    # Enregistrer published_at lors de la première publication manuelle
    if updates.get("is_published") is True and not post.get("published_at"):
        updates["published_at"] = datetime.now(timezone.utc).isoformat()
        updates["scheduled_at"] = None  # Effacer la planification si on publie manuellement

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.citadelle_blog_posts.update_one({"id": post_id}, {"$set": updates})
    updated = await db.citadelle_blog_posts.find_one({"id": post_id}, {"_id": 0})
    logger.info(f"[Citadelle Blog] Article modifié : {updated['title']}")
    return updated


@router.delete("/admin/blog/{post_id}", summary="Admin — Supprimer un article")
async def admin_delete_post(
    post_id: str,
    current_user: dict = Depends(require_admin)
):
    """Admin : supprime définitivement un article"""
    result = await db.citadelle_blog_posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Article introuvable")
    logger.info(f"[Citadelle Blog] Article supprimé : {post_id}")
    return {"message": "Article supprimé"}
