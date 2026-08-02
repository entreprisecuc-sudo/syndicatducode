"""
Génération du contenu du Centre d'aide via Claude (clé Emergent Universal).
Usage :
  cd /app/backend && python -m scripts.gen_help_center transactions-securisees
  cd /app/backend && python -m scripts.gen_help_center transactions-securisees --force
  cd /app/backend && python -m scripts.gen_help_center all
Idempotent : ignore les questions déjà générées sauf --force.
"""
import asyncio
import os
import sys
import json
import re
import uuid
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

from config.help_center import CATEGORIES, build_registry, get_category  # noqa: E402
from emergentintegrations.llm.chat import LlmChat, UserMessage  # noqa: E402

EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
MODEL = ("anthropic", "claude-sonnet-4-6")

FACTS = """FAITS OFFICIELS SUR LA PLATEFORME (à respecter strictement, ne rien inventer d'autre) :
- La Citadelle Numérique est une marketplace francophone sécurisée dédiée à l'ACHAT, la VENTE, l'ESTIMATION et la TRANSMISSION d'actifs numériques (sites internet, boutiques e-commerce, SaaS, applications, noms de domaine, chaînes YouTube, comptes et pages de réseaux sociaux, serveurs Discord, newsletters, podcasts, API, plugins/thèmes, etc.).
- SÉQUESTRE DES FONDS : l'acheteur paie via la plateforme, les fonds sont bloqués (séquestre) et ne sont versés au vendeur qu'une fois l'actif transmis et vérifié. Le séquestre est assuré techniquement via Stripe Connect.
- LA GARDE DE LA CITADELLE : tiers de confiance de la plateforme qui supervise le séquestre, vérifie les éléments de la transaction, valide la bonne transmission et libère les fonds. Elle protège les deux parties en cas de litige.
- LIVRABLE DE TRANSMISSION : ensemble structuré des accès, identifiants, fichiers, nom de domaine, comptes tiers et documentation remis à l'acheteur. Sa vérification déclenche la libération des fonds.
- ENCHÈRES : certaines annonces sont aux enchères avec un prix de réserve CONFIDENTIEL fixé par le vendeur.
- PAIEMENTS : carte bancaire via Stripe ; le virement SEPA est prévu pour les gros montants. Une commission est prélevée sur les ventes.
- SERVICES : Estimation Standard (rapide) et Estimation Expert (rapport détaillé), audit SEO, audit de sécurité, migration, refonte, création de site.
- La plateforme met en relation, accompagne et sécurise. Elle N'EST PAS un hébergeur, ni un registrar, ni un réseau social, et NE GARANTIT PAS la rentabilité d'un actif.
- Éditée par Joerke.B (SIREN 892 906 728) dans le cadre du Syndicat du Code. Contact : lagarde@lacitadellenumerique.fr.
- Espace francophone (France, Belgique, Suisse, Luxembourg, Québec, Monaco…).
- NE JAMAIS inventer de chiffres précis, de statistiques, de tarifs exacts, de délais fermes ni de multiples de valorisation présentés comme officiels. Rester factuel et prudent."""

SYSTEM = f"""Tu es le rédacteur du Centre d'aide de La Citadelle Numérique. Tu écris en français, sur un ton clair, professionnel, utile et neutre (non commercial, sans superlatifs excessifs).
{FACTS}

Pour la question fournie, tu produis un article de Centre d'aide optimisé pour le SEO, le GEO et l'AEO (moteurs de recherche et assistants IA).

Contraintes de rédaction :
- La toute première phrase doit répondre directement et clairement à la question (exploitable en featured snippet / réponse IA).
- Longueur du corps : entre 600 et 1200 mots selon le sujet.
- Structure en HTML SIMPLE uniquement : <p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>. PAS de <h1>, pas de styles, pas de classes, pas de liens <a>.
- Contenu concret, étape par étape quand c'est pertinent, avec les spécificités de la plateforme (séquestre, La Garde, Livrable de Transmission).
- Pas de bourrage de mots-clés. Français correct et fluide.

Tu réponds STRICTEMENT avec un objet JSON valide (aucun texte avant/après, pas de balises Markdown), au format :
{{
  "meta_title": "titre SEO <= 60 caractères, sans nom de marque répété",
  "meta_description": "meta description unique 130-155 caractères, incitative et factuelle",
  "lead": "réponse directe en 1 à 2 phrases (<= 280 caractères)",
  "answer_html": "le corps de l'article en HTML simple (600-1200 mots)",
  "faq": [{{"q":"question complémentaire","a":"réponse concise 40-70 mots"}}, {{"q":"...","a":"..."}}, {{"q":"...","a":"..."}}]
}}
La FAQ doit contenir 3 ou 4 questions complémentaires pertinentes et distinctes de la question principale."""


def _extract_json(text: str) -> dict:
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```[a-zA-Z]*\n?", "", t)
        t = re.sub(r"\n?```$", "", t.strip())
    # Tenter direct, sinon extraire le premier objet {...}
    try:
        return json.loads(t)
    except Exception:
        m = re.search(r"\{.*\}", t, re.S)
        if m:
            return json.loads(m.group(0))
        raise


async def generate_one(question: str) -> dict:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"help-{uuid.uuid4()}",
        system_message=SYSTEM,
    ).with_model(*MODEL)
    text = await chat.send_message(UserMessage(text=f"Question : {question}"))
    return _extract_json(text)


async def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    force = "--force" in sys.argv
    target = args[0] if args else "transactions-securisees"

    if target == "all":
        cats = [c["key"] for c in CATEGORIES]
    else:
        if not get_category(target):
            print(f"Catégorie inconnue : {target}")
            print("Catégories :", ", ".join(c["key"] for c in CATEGORIES))
            return
        cats = [target]

    db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
    flat, by_slug, by_category = build_registry()
    created = updated = skipped = failed = 0

    for cat_key in cats:
        cat = get_category(cat_key)
        print(f"\n=== Catégorie : {cat['label']} ({len(by_category[cat_key])} questions) ===")
        for it in by_category[cat_key]:
            slug, question = it["slug"], it["question"]
            existing = await db.citadelle_help_articles.find_one({"slug": slug}, {"_id": 0, "id": 1})
            if existing and not force:
                skipped += 1
                print(f"  ↷ déjà présent : {slug}")
                continue
            try:
                data = await generate_one(question)
            except Exception as e:
                failed += 1
                print(f"  ✗ ÉCHEC {slug} : {e}")
                continue
            now = datetime.now(timezone.utc).isoformat()
            doc = {
                "slug": slug,
                "category_key": cat_key,
                "question": question,
                "meta_title": (data.get("meta_title") or question)[:70],
                "meta_description": (data.get("meta_description") or "")[:160],
                "lead": (data.get("lead") or "")[:300],
                "answer_html": data.get("answer_html") or "",
                "faq": [{"q": f.get("q", ""), "a": f.get("a", "")} for f in (data.get("faq") or [])][:4],
                "view_count": (existing or {}).get("view_count", 0) if existing else 0,
                "updated_at": now,
            }
            if existing:
                await db.citadelle_help_articles.update_one({"slug": slug}, {"$set": doc})
                updated += 1
                print(f"  ↻ mis à jour : {slug}")
            else:
                doc["id"] = str(uuid.uuid4())
                doc["created_at"] = now
                await db.citadelle_help_articles.insert_one(doc)
                created += 1
                print(f"  ✓ créé : {slug}")

    print(f"\nTerminé — {created} créé(s), {updated} mis à jour, {skipped} ignoré(s), {failed} échec(s).")


if __name__ == "__main__":
    asyncio.run(main())
