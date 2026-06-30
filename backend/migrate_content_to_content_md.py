"""
Migration : copie le champ `content` vers `content_md` pour tous les articles
qui ont `content_md` vide mais `content` rempli.
Lancé une seule fois pour corriger les imports anciens.
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME   = os.environ.get("DB_NAME", "citadelle")


async def migrate():
    client = AsyncIOMotorClient(MONGO_URL)
    db     = client[DB_NAME]

    result = await db.citadelle_blog_posts.update_many(
        {
            "content":    {"$exists": True, "$nin": [None, ""]},
            "$or": [
                {"content_md": {"$exists": False}},
                {"content_md": ""},
                {"content_md": None},
            ],
        },
        [{"$set": {"content_md": "$content"}}]
    )
    print(f"Articles mis à jour : {result.modified_count}")
    client.close()


if __name__ == "__main__":
    asyncio.run(migrate())
