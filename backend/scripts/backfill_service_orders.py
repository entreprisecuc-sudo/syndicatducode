"""
Backfill des commandes de service — La Citadelle Numérique
-----------------------------------------------------------
Le vrai flux Stripe (payment_transactions) créait la facture mais PAS la commande
visible côté admin (citadelle_service_orders). Ce script crée, pour chaque paiement
« paid » sans commande associée, l'enregistrement manquant.

Idempotent : on n'insère que si aucune commande n'existe déjà pour la session_id.
Usage : python -m scripts.backfill_service_orders   (depuis /app/backend, venv actif)
"""

import asyncio
import os
import uuid
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()


async def main():
    db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]

    paid = await db.payment_transactions.find({"payment_status": "paid"}).to_list(1000)
    created, skipped = 0, 0

    for tx in paid:
        session_id = tx.get("session_id")
        if not session_id:
            skipped += 1
            continue
        exists = await db.citadelle_service_orders.find_one({"session_id": session_id})
        if exists:
            skipped += 1
            continue
        now = datetime.now(timezone.utc).isoformat()
        await db.citadelle_service_orders.insert_one({
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "service_id": tx.get("service_id", ""),
            "service_title": tx.get("service_title", ""),
            "amount": tx.get("amount", 0),
            "client_name": tx.get("client_name", ""),
            "client_email": tx.get("client_email", ""),
            "client_message": tx.get("client_message", ""),
            "status": "en_attente",
            "admin_note": "",
            "payment_method": "stripe",
            "user_id": tx.get("user_id", ""),
            # On conserve la date du paiement d'origine pour l'ordre chronologique
            "created_at": tx.get("created_at", now),
            "updated_at": now,
        })
        created += 1

    print(f"Backfill terminé — {created} commande(s) créée(s), {skipped} ignorée(s) (déjà présentes ou sans session).")


if __name__ == "__main__":
    asyncio.run(main())
