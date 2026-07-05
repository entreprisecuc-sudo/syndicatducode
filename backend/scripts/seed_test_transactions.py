"""
Seed de transactions de test — La Citadelle Numérique.
Crée 5 transactions couvrant tous les statuts testables entre :
  - Acheteur : test.acheteur@citadelle.fr
  - Vendeur  : test.vendeur@citadelle.fr

Permet de tester depuis l'espace membre :
  1. offer_sent      → acheteur : "Abandonner ma proposition" | vendeur : Accepter/Refuser/Contre-offre
  2. offer_countered → acheteur : Accepter la contre-offre OU abandonner
  3. offer_accepted  → acheteur : Payer OU "Abandonner ma proposition" (cas clé, sans frais)
  4. payment_done    → acheteur : Ouvrir litige / Annuler | vendeur : Transmettre les accès
  5. completed        → acheteur : Voir les accès transmis | vendeur : gains encaissés

Idempotent : marqueur {"test_scenario_seed": True}, purgé puis réinséré.
Aucune donnée réelle n'est touchée.

Usage : cd /app/backend && python3 scripts/seed_test_transactions.py
"""
import os
import uuid
from datetime import datetime, timezone, timedelta

from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

db = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]

BUYER_ID, BUYER_EMAIL = "45b701fd-6ac6-4075-a3df-42c60d4475e3", "test.acheteur@citadelle.fr"
SELLER_ID, SELLER_EMAIL = "fa8184cd-a9bd-4536-a674-7af73b13ff34", "test.vendeur@citadelle.fr"

MARK = {"test_scenario_seed": True}


def iso(days_ago=0, hours_ago=0):
    return (datetime.now(timezone.utc) - timedelta(days=days_ago, hours=hours_ago)).isoformat()


def sys_msg(content, when):
    return {"id": str(uuid.uuid4()), "sender_id": "system", "sender_email": "système",
            "content": content, "sent_at": when, "type": "system"}


def user_msg(sender_id, sender_email, content, when):
    return {"id": str(uuid.uuid4()), "sender_id": sender_id, "sender_email": sender_email,
            "content": content, "sent_at": when, "type": "message"}


def commission(amount, rate=0.05, minimum=49.0):
    c = max(amount * rate, minimum)
    return round(c, 2), round(amount - c, 2)


# ── Purge des anciennes données de test ───────────────────────────────────────
print("Purge des anciennes transactions de test…")
db.citadelle_listings.delete_many(MARK)
db.citadelle_transactions.delete_many(MARK)


def new_listing(title, ltype, price, status, revenue, niche, short, days=12):
    lid = str(uuid.uuid4())
    slug = title.lower().replace(" ", "-").replace("—", "").replace("é", "e")[:40] + "-" + lid[:8]
    return {
        "id": lid, "slug": slug, "title": title, "type": ltype,
        "short_description": short, "description": short + " Actif rentable, transfert accompagné par La Garde.",
        "seller_id": SELLER_ID, "seller_email": SELLER_EMAIL,
        "status": status, "price": float(price), "price_negotiable": True,
        "monthly_revenue": float(revenue), "monthly_traffic": 15000, "age_months": 28,
        "niche": niche, "technologies": ["WordPress", "Stripe"], "url_preview": None, "images": [],
        "is_featured": False, "is_verified": True, "views_count": 37, "favorites_count": 4,
        "rejection_reason": None, "created_at": iso(days), "updated_at": iso(1),
        "published_at": iso(days), "expires_at": iso(-60),
        "garde_verified": True, "garde_verified_at": iso(days),
        **MARK,
    }


# ── ANNONCES (toutes détenues par le vendeur de test) ─────────────────────────
l1 = new_listing("[TEST] Blog Cuisine Végétarienne", "website", 6000, "active", 900, "Cuisine",
                 "Blog de recettes végétariennes, 900 €/mois via affiliation et AdSense.")
l2 = new_listing("[TEST] SaaS Gestion de Factures", "saas", 14000, "active", 2100, "SaaS",
                 "Logiciel de facturation pour TPE, 120 abonnés payants.")
l3 = new_listing("[TEST] Boutique Déco Scandinave", "ecommerce", 10000, "active", 1800, "E-commerce",
                 "Boutique Shopify de décoration scandinave, marges élevées.")
l4 = new_listing("[TEST] Newsletter Crypto (5k abonnés)", "other", 8000, "sold", 1300, "Finance",
                 "Newsletter crypto de 5 000 abonnés, sponsors récurrents.")
l5 = new_listing("[TEST] Chaîne YouTube Voyage", "other", 16000, "sold", 2400, "Voyage",
                 "Chaîne YouTube voyage de 80 000 abonnés, revenus AdSense + partenariats.")

db.citadelle_listings.insert_many([l1, l2, l3, l4, l5])


def base_tx(listing, status, amount, extra_msgs, **kw):
    now_created = iso(4)
    tx = {
        "id": str(uuid.uuid4()),
        "listing_id": listing["id"], "listing_title": listing["title"], "listing_slug": listing["slug"],
        "buyer_id": BUYER_ID, "buyer_email": BUYER_EMAIL,
        "seller_id": SELLER_ID, "seller_email": SELLER_EMAIL,
        "status": status, "offer_amount": float(amount),
        "offer_message": f"Bonjour, je vous propose {amount:,.0f} € pour cet actif. Cordialement.",
        "counter_amount": None, "counter_message": None,
        "payment_id": None, "payment_amount": None,
        "credentials": None, "credentials_transmitted": False,
        "messages": [
            sys_msg(f"Offre de {amount:,.0f} € envoyée par l'acheteur.", now_created),
            user_msg(BUYER_ID, BUYER_EMAIL, f"Bonjour, je vous propose {amount:,.0f} € pour cet actif. Cordialement.", now_created),
        ] + extra_msgs,
        "created_at": now_created, "updated_at": iso(1),
        "completed_at": None, "paid_at": None,
        "disputed_at": None, "dispute_reason": None, "dispute_messages": [],
        **MARK,
    }
    tx.update(kw)
    return tx


# 1. offer_sent — acheteur peut abandonner ; vendeur peut accepter/refuser/contre-offrer
txA = base_tx(l1, "offer_sent", 5500, [])

# 2. offer_countered — vendeur a contre-proposé ; acheteur peut accepter OU abandonner
txB = base_tx(
    l2, "offer_countered", 12000,
    [
        sys_msg("Contre-offre du vendeur : 13 000 €.", iso(1)),
        user_msg(SELLER_ID, SELLER_EMAIL, "Merci pour votre offre. Je peux descendre à 13 000 € pour une vente rapide.", iso(1)),
    ],
    counter_amount=13000.0,
    counter_message="Merci pour votre offre. Je peux descendre à 13 000 € pour une vente rapide.",
)

# 3. offer_accepted — CAS CLÉ : acheteur peut payer OU abandonner (sans frais)
txC = base_tx(
    l3, "offer_accepted", 9500,
    [sys_msg("Offre acceptée par le vendeur. Montant convenu : 9 500 €. En attente du paiement.", iso(1))],
    payment_amount=9500.0,
)

# 4. payment_done — fonds en séquestre : acheteur peut ouvrir un litige / annuler ; vendeur transmet les accès
txD = base_tx(
    l4, "payment_done", 8000,
    [
        sys_msg("Offre acceptée par le vendeur. Montant convenu : 8 000 €. En attente du paiement.", iso(9)),
        sys_msg("Paiement de 8 000 € effectué. Fonds placés en séquestre. En attente de la transmission des accès par le vendeur.", iso(8)),
    ],
    payment_amount=8000.0,
    payment_id="pi_test_" + uuid.uuid4().hex[:16],
    paid_at=iso(8),  # > 7 jours → annulation acheteur immédiatement testable
)

# 5. completed — vente finalisée : acheteur voit les accès, vendeur voit ses gains
e_comm, e_net = commission(16000.0)
txE = base_tx(
    l5, "completed", 16000,
    [
        sys_msg("Offre acceptée par le vendeur. Montant convenu : 16 000 €.", iso(11)),
        sys_msg("Paiement de 16 000 € effectué. Fonds placés en séquestre.", iso(10)),
        sys_msg(f"Vente finalisée ! Virement de {e_net:,.0f} € effectué vers le vendeur. Commission plateforme : {e_comm:,.0f} €. Les accès sont maintenant disponibles pour l'acheteur.", iso(6)),
    ],
    payment_amount=16000.0,
    payment_id="pi_test_" + uuid.uuid4().hex[:16],
    paid_at=iso(10),
    completed_at=iso(6),
    commission_amount=e_comm, net_seller_amount=e_net,
    credentials={
        "data": "URL admin : https://exemple-actif.fr/wp-admin\nIdentifiant : admin_test\nMot de passe : DemoAcces2026!\nInstructions : transférez le nom de domaine via le registrar sous 48h.",
        "submitted_at": iso(7), "verified_by_admin": True, "verified_at": iso(6), "admin_notes": None,
    },
    credentials_transmitted=True, credentials_transmitted_at=iso(6),
)

db.citadelle_transactions.insert_many([txA, txB, txC, txD, txE])

print("Seed terminé ✓")
print(f"  Acheteur : {BUYER_EMAIL}")
print(f"  Vendeur  : {SELLER_EMAIL}")
print("  Transactions créées :")
print(f"    1. offer_sent      (Blog Cuisine, 5 500 €)      → {txA['id']}")
print(f"    2. offer_countered (SaaS Factures, 13 000 €)    → {txB['id']}")
print(f"    3. offer_accepted  (Boutique Déco, 9 500 €)     → {txC['id']}  [test retrait]")
print(f"    4. payment_done    (Newsletter Crypto, 8 000 €) → {txD['id']}")
print(f"    5. completed        (YouTube Voyage, 16 000 €)   → {txE['id']}")
