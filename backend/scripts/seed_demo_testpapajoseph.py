"""
Seed de démonstration pour le profil testpapajoseph@gmail.com (La Citadelle).
Peuple annonces, conversations (dialogues), offres et ventes afin de visualiser
les panneaux du dashboard membre : "À traiter", "Mes gains", messagerie.

Idempotent : toutes les données créées portent le marqueur {"demo_seed": True}
et sont purgées avant réinsertion. Aucune donnée réelle n'est touchée.

Usage : cd /app/backend && python3 scripts/seed_demo_testpapajoseph.py
"""
import os
import sys
import uuid
from datetime import datetime, timezone, timedelta

from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

client = MongoClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

SELLER_ID = "7c3bc7dc-408d-4179-b538-0856317944c2"
SELLER_EMAIL = "testpapajoseph@gmail.com"

# Interlocuteurs fictifs
MARC_ID, MARC_EMAIL = "demo-buyer-marc", "marc.investisseur@gmail.com"
SOPHIE_ID, SOPHIE_EMAIL = "demo-buyer-sophie", "sophie.durand@outlook.fr"

# Vendeur tiers (annonce que testpapajoseph achète) — utilisateur existant
OTHER_SELLER_ID = "8ca17828-b6aa-4a59-a38d-f5d461c030e9"
OTHER_SELLER_EMAIL = "jean.test.citadelle@test.fr"


def iso(days_ago=0, hours_ago=0, minutes_ago=0):
    return (datetime.now(timezone.utc) - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)).isoformat()


def sys_msg(content, when):
    return {"id": str(uuid.uuid4()), "sender_id": "system", "sender_email": "système",
            "content": content, "sent_at": when, "type": "system"}


def user_msg(sender_id, sender_email, content, when, mtype="message"):
    return {"id": str(uuid.uuid4()), "sender_id": sender_id, "sender_email": sender_email,
            "content": content, "sent_at": when, "type": mtype}


def commission(amount, rate=0.05, minimum=49.0):
    c = max(amount * rate, minimum)
    return round(c, 2), round(amount - c, 2)


# ── Purge des anciennes données de démo ──────────────────────────────────────
print("Purge des anciennes données de démo…")
db.citadelle_listings.delete_many({"demo_seed": True})
db.citadelle_conversations.delete_many({"demo_seed": True})
db.citadelle_transactions.delete_many({"demo_seed": True})


def new_listing(title, ltype, price, status, revenue, traffic, niche, short, days=10):
    lid = str(uuid.uuid4())
    slug = title.lower().replace(" ", "-").replace("—", "").replace("é", "e")[:40] + "-" + lid[:8]
    return {
        "id": lid, "slug": slug, "title": title, "type": ltype,
        "short_description": short, "description": short + " Actif rentable, transfert accompagné.",
        "seller_id": SELLER_ID, "seller_email": SELLER_EMAIL,
        "status": status, "price": float(price), "price_negotiable": True,
        "monthly_revenue": float(revenue), "monthly_traffic": traffic, "age_months": 30,
        "niche": niche, "technologies": ["WordPress", "Stripe"], "url_preview": None, "images": [],
        "is_featured": False, "is_verified": True, "views_count": 42, "favorites_count": 5,
        "rejection_reason": None, "created_at": iso(days), "updated_at": iso(1),
        "published_at": iso(days), "expires_at": iso(-60),
        "garde_verified": True, "garde_verified_at": iso(days),
        "demo_seed": True,
    }


# ── ANNONCES ──────────────────────────────────────────────────────────────────
l1 = new_listing("Boutique Shopify — Cosmétiques Bio", "ecommerce", 12000, "active", 3200, 18000, "Beauté",
                 "Boutique e-commerce de cosmétiques bio, 3200€/mois de CA.")
l2 = new_listing("SaaS Prise de RDV Coiffeurs", "saas", 8500, "active", 1400, 6000, "SaaS",
                 "Logiciel SaaS de réservation pour salons de coiffure, 90 abonnés payants.")
l3 = new_listing("Blog Finance Perso — 1800€/mois", "website", 22000, "sold", 1800, 55000, "Finance",
                 "Blog de finances personnelles monétisé AdSense + affiliation.")
l4 = new_listing("Chaîne YouTube Tech — 50k abonnés", "other", 18000, "sold", 2100, 120000, "Tech",
                 "Chaîne YouTube tech, 50 000 abonnés, revenus AdSense + sponsors.")

db.citadelle_listings.insert_many([l1, l2, l3, l4])

# Annonce d'un tiers que testpapajoseph achète
l5 = {
    "id": str(uuid.uuid4()), "slug": "application-mobile-fitness-" + uuid.uuid4().hex[:8],
    "title": "Application Mobile Fitness", "type": "app",
    "short_description": "App fitness iOS/Android, 12 000 utilisateurs actifs.",
    "description": "Application mobile de coaching fitness, abonnements récurrents.",
    "seller_id": OTHER_SELLER_ID, "seller_email": OTHER_SELLER_EMAIL,
    "status": "active", "price": 9500.0, "price_negotiable": True,
    "monthly_revenue": 1600.0, "monthly_traffic": 12000, "age_months": 24, "niche": "Sport",
    "technologies": ["React Native"], "url_preview": None, "images": [],
    "is_featured": False, "is_verified": True, "views_count": 30, "favorites_count": 3,
    "rejection_reason": None, "created_at": iso(15), "updated_at": iso(2),
    "published_at": iso(15), "expires_at": iso(-50),
    "garde_verified": True, "garde_verified_at": iso(15), "demo_seed": True,
}
db.citadelle_listings.insert_one(l5)


# ── CONVERSATION 1 (pré-vente) : Marc pose des questions sur la Boutique Shopify
# → messages non lus par testpapajoseph → apparaît dans "À traiter"
conv1 = {
    "id": str(uuid.uuid4()), "listing_id": l1["id"], "listing_title": l1["title"],
    "listing_slug": l1["slug"], "buyer_id": MARC_ID, "buyer_email": MARC_EMAIL,
    "seller_id": SELLER_ID, "seller_email": SELLER_EMAIL,
    "messages": [
        user_msg(MARC_ID, MARC_EMAIL, "Bonjour, votre boutique m'intéresse beaucoup. Les fournisseurs sont-ils transférables ?", iso(2, 3)),
        user_msg(SELLER_ID, SELLER_EMAIL, "Bonjour Marc ! Oui, tous les contrats fournisseurs sont transférables sans frais.", iso(2, 1)),
        user_msg(MARC_ID, MARC_EMAIL, "Parfait. Et concernant la marge nette, elle est de combien environ ?", iso(0, 4)),
        user_msg(MARC_ID, MARC_EMAIL, "Je serais prêt à faire une offre rapidement si les chiffres tiennent la route.", iso(0, 3, 45)),
    ],
    "last_read": {SELLER_ID: iso(2, 0), MARC_ID: iso(0, 3)},
    "created_at": iso(2, 3), "updated_at": iso(0, 3, 45),
    "seller_notified_at": None, "reminder_sent_at": None, "demo_seed": True,
}

# ── CONVERSATION 2 (pré-vente) : Sophie sur le SaaS coiffeurs (1 message non lu)
conv2 = {
    "id": str(uuid.uuid4()), "listing_id": l2["id"], "listing_title": l2["title"],
    "listing_slug": l2["slug"], "buyer_id": SOPHIE_ID, "buyer_email": SOPHIE_EMAIL,
    "seller_id": SELLER_ID, "seller_email": SELLER_EMAIL,
    "messages": [
        user_msg(SOPHIE_ID, SOPHIE_EMAIL, "Bonjour, le SaaS est-il livré avec la base clients actuelle ?", iso(1, 2)),
    ],
    "last_read": {SOPHIE_ID: iso(1, 2)},
    "created_at": iso(1, 2), "updated_at": iso(1, 2),
    "seller_notified_at": None, "reminder_sent_at": None, "demo_seed": True,
}

db.citadelle_conversations.insert_many([conv1, conv2])


# ── TRANSACTION A : Sophie fait une OFFRE sur le SaaS coiffeurs (offer_sent)
# → "Proposition d'achat reçue" (urgent) dans "À traiter" du vendeur
txA = {
    "id": str(uuid.uuid4()), "listing_id": l2["id"], "listing_title": l2["title"], "listing_slug": l2["slug"],
    "buyer_id": SOPHIE_ID, "buyer_email": SOPHIE_EMAIL, "seller_id": SELLER_ID, "seller_email": SELLER_EMAIL,
    "status": "offer_sent", "offer_amount": 7500.0,
    "offer_message": "Je vous propose 7 500 € pour un achat rapide, paiement immédiat via séquestre.",
    "counter_amount": None, "counter_message": None, "payment_id": None, "payment_amount": None,
    "credentials": None, "credentials_transmitted": False,
    "messages": [
        sys_msg("Offre de 7 500 € envoyée par l'acheteur.", iso(0, 6)),
        user_msg(SOPHIE_ID, SOPHIE_EMAIL, "Je vous propose 7 500 € pour un achat rapide, paiement immédiat via séquestre.", iso(0, 6)),
    ],
    "created_at": iso(0, 6), "updated_at": iso(0, 6), "completed_at": None, "paid_at": None,
    "disputed_at": None, "dispute_reason": None, "dispute_messages": [], "demo_seed": True,
}

# ── TRANSACTION B : testpapajoseph ACHÈTE l'App Fitness (offer_accepted, paiement à faire)
# → "Offre acceptée — paiement à effectuer" (urgent) dans "À traiter" de l'acheteur
txB = {
    "id": str(uuid.uuid4()), "listing_id": l5["id"], "listing_title": l5["title"], "listing_slug": l5["slug"],
    "buyer_id": SELLER_ID, "buyer_email": SELLER_EMAIL, "seller_id": OTHER_SELLER_ID, "seller_email": OTHER_SELLER_EMAIL,
    "status": "offer_accepted", "offer_amount": 8800.0,
    "offer_message": "Bonjour, je propose 8 800 € pour votre application. Cordialement.",
    "counter_amount": None, "counter_message": None, "payment_id": None, "payment_amount": 8800.0,
    "credentials": None, "credentials_transmitted": False,
    "messages": [
        sys_msg("Offre de 8 800 € envoyée par l'acheteur.", iso(3)),
        user_msg(SELLER_ID, SELLER_EMAIL, "Bonjour, je propose 8 800 € pour votre application. Cordialement.", iso(3)),
        sys_msg("Offre acceptée par le vendeur. Montant convenu : 8 800 €. En attente du paiement.", iso(1, 5)),
    ],
    "created_at": iso(3), "updated_at": iso(1, 5), "completed_at": None, "paid_at": None,
    "disputed_at": None, "dispute_reason": None, "dispute_messages": [], "demo_seed": True,
}

# ── TRANSACTION C : Marc a PAYÉ le Blog Finance (payment_done)
# → "Paiement reçu — transmettez les accès" (urgent, vendeur) + gains en attente (séquestre)
c_comm, c_net = commission(21000.0)
txC = {
    "id": str(uuid.uuid4()), "listing_id": l3["id"], "listing_title": l3["title"], "listing_slug": l3["slug"],
    "buyer_id": MARC_ID, "buyer_email": MARC_EMAIL, "seller_id": SELLER_ID, "seller_email": SELLER_EMAIL,
    "status": "payment_done", "offer_amount": 21000.0, "offer_message": "Offre au prix quasi affiché.",
    "counter_amount": None, "counter_message": None,
    "payment_id": "pi_demo_" + uuid.uuid4().hex[:16], "payment_amount": 21000.0,
    "credentials": None, "credentials_transmitted": False,
    "messages": [
        sys_msg("Offre de 21 000 € envoyée par l'acheteur.", iso(5)),
        sys_msg("Offre acceptée par le vendeur. Montant convenu : 21 000 €. En attente du paiement.", iso(4, 12)),
        sys_msg("Paiement de 21 000 € effectué. Fonds placés en séquestre. En attente de la transmission des accès par le vendeur.", iso(0, 8)),
        user_msg(MARC_ID, MARC_EMAIL, "Paiement effectué ! J'attends les accès dès que possible, merci.", iso(0, 7)),
    ],
    "created_at": iso(5), "updated_at": iso(0, 7), "completed_at": None, "paid_at": iso(0, 8),
    "disputed_at": None, "dispute_reason": None, "dispute_messages": [], "demo_seed": True,
}

# ── TRANSACTION D : Vente FINALISÉE de la Chaîne YouTube (completed) → gains encaissés
d_comm, d_net = commission(17500.0)
txD = {
    "id": str(uuid.uuid4()), "listing_id": l4["id"], "listing_title": l4["title"], "listing_slug": l4["slug"],
    "buyer_id": SOPHIE_ID, "buyer_email": SOPHIE_EMAIL, "seller_id": SELLER_ID, "seller_email": SELLER_EMAIL,
    "status": "completed", "offer_amount": 17500.0, "offer_message": "Offre ferme à 17 500 €.",
    "counter_amount": None, "counter_message": None,
    "payment_id": "pi_demo_" + uuid.uuid4().hex[:16], "payment_amount": 17500.0,
    "credentials": {"data": "Accès transmis", "submitted_at": iso(8), "verified_by_admin": True,
                    "verified_at": iso(7), "admin_notes": None},
    "credentials_transmitted": True, "credentials_transmitted_at": iso(6),
    "commission_amount": d_comm, "net_seller_amount": d_net,
    "messages": [
        sys_msg("Offre de 17 500 € envoyée par l'acheteur.", iso(12)),
        sys_msg("Offre acceptée par le vendeur. Montant convenu : 17 500 €.", iso(11)),
        sys_msg("Paiement de 17 500 € effectué. Fonds placés en séquestre.", iso(10)),
        sys_msg(f"Vente finalisée ! Virement de {d_net:,.0f} € effectué vers le vendeur. Commission plateforme : {d_comm:,.0f} €.", iso(6)),
    ],
    "created_at": iso(12), "updated_at": iso(6), "completed_at": iso(6), "paid_at": iso(10),
    "disputed_at": None, "dispute_reason": None, "dispute_messages": [], "demo_seed": True,
}

db.citadelle_transactions.insert_many([txA, txB, txC, txD])

print("Seed terminé ✓")
print(f"  Annonces créées : 5 (4 vendeur + 1 tierce à acheter)")
print(f"  Conversations   : 2 (messages non lus)")
print(f"  Transactions    : offer_sent, offer_accepted(achat), payment_done, completed")
print(f"  Gains attendus  : encaissé {d_net:,.0f} € / séquestre {c_net:,.0f} €")
