"""
Script de mise à jour des multiples de valorisation dans les articles de blog.
Corrige les anciens multiples (marchés US/UK, trop élevés)
vers les multiples réalistes du marché français 2026.

Usage : python3 update_blog_multiples.py
"""

import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv(".env")
client = MongoClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

# ── Table des corrections par slug ────────────────────────────────────────────
CORRECTIONS = {

    # ── Combien vaut une boutique Shopify ? ───────────────────────────────────
    "combien-vaut-une-boutique-shopify": [
        ("entre **20x et 40x**",
         "entre **8x et 28x**"),
        ("| Dropshipping pur, marges faibles | 12x – 18x |",
         "| Dropshipping pur, marges faibles | 8x – 12x |"),
        ("| Marque propre, bon SEO | 24x – 32x |",
         "| Marque propre, bon SEO | 15x – 22x |"),
        ("| DTC établi, communauté fidèle | 32x – 48x |",
         "| DTC établi, communauté fidèle | 20x – 28x |"),
        ("- Multiple appliqué : 28x (bonne marque, 35% SEO organique)",
         "- Multiple appliqué : 20x (bonne marque, 35% SEO organique)"),
        ("- **Valeur estimée : 5 500 × 28 = 154 000 €**",
         "- **Valeur estimée : 5 500 × 20 = 110 000 €**"),
        # FAQ bas de page
        ("Entre 20x et 40x le bénéfice net mensuel selon la marque, le SEO et les marges.",
         "Entre 8x et 28x le bénéfice net mensuel selon la marque, le SEO et les marges."),
    ],

    # ── Les tendances 2026 ────────────────────────────────────────────────────
    "tendances-marche-sites-internet-2026": [
        ("- Multiple moyen : **4x à 8x l'ARR**",
         "- Multiple moyen : **1,5x à 2,5x l'ARR** (18x à 30x mensuel)"),
        ("- Multiple moyen : **28x à 38x le bénéfice mensuel**",
         "- Multiple moyen : **14x à 22x le bénéfice mensuel**"),
        ("- Multiple moyen : **24x à 36x le bénéfice mensuel**",
         "- Multiple moyen : **15x à 25x le bénéfice mensuel**"),
        ("- Multiple moyen : **3x à 6x l'ARR**",
         "- Multiple moyen : **1x à 2,5x l'ARR** (12x à 30x mensuel)"),
    ],

    # ── Comment fixer le bon prix ─────────────────────────────────────────────
    "fixer-prix-vente-business-en-ligne": [
        ("**Valeur = SDE mensuel moyen × Multiple**",
         "**Valeur = SDE mensuel moyen × Multiple**"),  # pas de changement sur cette ligne
        ("| Faible (< 1 an, revenus instables) | 12x – 18x |",
         "| Faible (< 1 an, revenus instables) | 8x – 12x |"),
        ("| Moyenne (1-3 ans, revenus stables) | 20x – 28x |",
         "| Moyenne (1-3 ans, revenus stables) | 12x – 18x |"),
        ("| Bonne (3+ ans, croissance, marque) | 30x – 40x |",
         "| Bonne (3+ ans, croissance, marque) | 18x – 26x |"),
        ("| Excellente (leader de niche, récurrence forte) | 40x – 60x |",
         "| Excellente (leader de niche, récurrence forte) | 22x – 30x |"),
        ("SDE mensuel × Multiple (20x à 40x selon la qualité) + vérification par les transactions comparables.",
         "SDE mensuel × Multiple (8x à 28x selon la qualité) + vérification par les transactions comparables."),
    ],

    # ── Comment vendre un SaaS ? ──────────────────────────────────────────────
    "comment-vendre-un-saas": [
        ("| Churn > 5%/mois, stagnation | 2x – 3x ARR |",
         "| Churn > 5%/mois, stagnation | 0,8x – 1,2x ARR |"),
        ("| Churn < 3%/mois, croissance modérée | 3x – 5x ARR |",
         "| Churn < 3%/mois, croissance modérée | 1,2x – 2x ARR |"),
        ("| Churn < 1%/mois, forte croissance | 5x – 8x ARR |",
         "| Churn < 1%/mois, forte croissance | 2x – 2,5x ARR |"),
        ("Valorisation = ARR × Multiple (3x à 8x selon le churn et la croissance).",
         "Valorisation = ARR × Multiple (0,8x à 2,5x selon le churn et la croissance)."),
    ],
}

# ── Exécution ─────────────────────────────────────────────────────────────────

def main():
    total_updated = 0
    for slug, replacements in CORRECTIONS.items():
        doc = db.citadelle_blog_posts.find_one({"slug": slug})
        if not doc:
            print(f"  ⚠️  Article non trouvé : {slug}")
            continue

        content = doc.get("content_md", "")
        changes = 0
        for old, new in replacements:
            if old == new:
                continue  # ligne no-op volontaire
            if old in content:
                content = content.replace(old, new, 1)
                changes += 1
            else:
                print(f"  ⚠️  Passage non trouvé dans [{slug}] : {old[:60]}…")

        if changes > 0:
            db.citadelle_blog_posts.update_one(
                {"slug": slug},
                {"$set": {"content_md": content}}
            )
            print(f"  ✅ {slug} — {changes} remplacement(s) effectué(s)")
            total_updated += 1
        else:
            print(f"  ℹ️  {slug} — aucun changement nécessaire")

    print(f"\n✅ Mise à jour terminée — {total_updated} article(s) modifié(s).")


if __name__ == "__main__":
    main()
