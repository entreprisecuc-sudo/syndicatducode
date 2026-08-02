# CHANGELOG — La Citadelle Numérique

> Journal des sessions. Le PRD historique complet reste dans PRD.md.

## ✨ Session 02/08/2026 — Centre d'aide (Phase 1 : architecture + catégorie exemple)
Base de connaissances premium optimisée UX / SEO / GEO / AEO, rendue en HTML côté serveur (lisible par Google et les IA sans JS).

**Architecture (validée par le client : rendu backend + Claude + phasage + charte Citadelle + les 2 liens footer cohabitent)**
- `config/help_center.py` : registre central unique (11 catégories, ~130 questions, slugs, icônes FontAwesome). Source de vérité pour l'index, les pages et le sitemap.
- `routes/help_center.py` : rendu HTML côté serveur.
  - `GET /aide` (monté sous `/api/aide`) : hero, FAQ, **moteur de recherche instantané** (JS léger sur index JSON), **questions les plus consultées** (view_count), **consultés récemment** (localStorage), grille de catégories à icônes, listes par catégorie (liens actifs si générés, sinon « bientôt »), maillage interne.
  - `GET /aide/{slug}` : H1 unique, meta title/description propres, lead (réponse directe AEO), corps HTML (H2/H3), FAQ complémentaire, **Schema.org FAQPage + BreadcrumbList**, fil d'Ariane, « Questions associées », maillage (Guides, Chroniques, Blog, Services, Marketplace). Incrémente view_count. Page « en cours de rédaction » (noindex) si non encore générée.
- `server.py` : router `help_center` enregistré. `.env` : ajout `EMERGENT_LLM_KEY`.
- `routes/sitemaps.py` : ajout de `/aide` + toutes les pages d'aide générées au sitemap Citadelle.
- Footer React (`CitadelleLayout.js`) : lien **« Aide & FAQ »** (`/aide`) ajouté à côté de « Informations pour les IA ».

**Génération de contenu (Claude `claude-sonnet-4-6` via clé Emergent)**
- `scripts/gen_help_center.py` : génère les articles (600-1200 mots, HTML propre, meta, lead, FAQ 3-4 Q) à partir d'un prompt système bourré de faits plateforme (séquestre, La Garde, Livrable, Stripe Connect, pas de garantie de rentabilité, etc.). Idempotent (`--force`), par catégorie ou `all`.
- **Phase 1 livrée** : catégorie **« Transactions sécurisées »** (8/8 articles générés, ~800 mots chacun, 4 FAQ, qualité factuelle validée). Index unique MongoDB sur `slug` (dédoublonnage effectué).

**Validé (Règle 6 respectée : aucun testing_agent)** : curl (HTTP 200, 2 JSON-LD valides, canonical/H1/fil d'Ariane/maillage OK) + screenshots (index premium à la charte, recherche instantanée = 1 résultat pour « sequestre », page article complète).

### ⚠️ Déploiement (VPS)
- `git pull` + rebuild backend/frontend.
- **Nginx** : ajouter une règle pour servir les URLs propres `/aide` via le backend, ex. `location /aide { proxy_pass http://127.0.0.1:8001/api/aide; }` (comme `/sitemap.xml`). Les liens internes des pages pointent vers `/aide/...` (fonctionnels en prod après cette règle). En preview, tester via `/api/aide` et `/api/aide/{slug}`.
- Lancer la génération des autres catégories : `cd /app/backend && python -m scripts.gen_help_center all` (ou catégorie par catégorie).

## ✨ Session 02/08/2026 — Hub "Informations pour les IA" (AEO/GEO) finalisé
Objectif : positionner La Citadelle comme source de référence lisible par les IA, en contournant les limites du rendu CSR de React via des fichiers statiques.

- **Page statique** `/app/frontend/public/informations-pour-les-ia/index.html` (déjà créée) : HTML pur, Schema.org (Organization, WebSite, Service, BreadcrumbList, FAQPage), sommaire, sections (présentation, mission, vision, services, actifs, transaction, enchères, Garde, Livrable, sécurité), FAQ, définitions, infos officielles. Validée (screenshot : titre, H1, sommaire, charte graphique OK).
- **`/app/frontend/public/llms.txt`** créé : format standard llms.txt (Markdown) → pointe vers le Hub, les pages clés, le sitemap et le Syndicat du Code. HTTP 200 en preview.
- **`/app/frontend/public/robots.txt`** mis à jour : autorisation explicite des bots IA (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-Web, anthropic-ai, PerplexityBot, Google-Extended, Applebot-Extended, CCBot) + Disallow espaces privés conservés + Sitemaps.
- **`/app/backend/routes/sitemaps.py`** : ajout de `https://lacitadellenumerique.fr/informations-pour-les-ia` (priority 0.7, monthly) dans le sitemap dynamique Citadelle. Validé (curl : URL présente).
- **`CitadelleLayout.js`** (footer) : lien discret « Informations pour les IA » (`<a href="/informations-pour-les-ia">` — balise `<a>` classique pour navigation full-page vers le fichier statique). Validé (screenshot : présent colonne INFORMATIONS).

- **Règle 6 respectée** : aucun testing_agent, aucun email de test. Validation par screenshot + curl uniquement.

### ⚠️ Points de déploiement (VPS)
- `git pull` + `yarn build` pour publier les fichiers `public/` (index.html du Hub, llms.txt, robots.txt).
- **Nginx** : s'assurer que `try_files $uri $uri/ /index.html;` est présent afin que `/informations-pour-les-ia` (et `/informations-pour-les-ia/`) serve le fichier statique AVANT le fallback SPA React.
- Le `robots.txt` servi en preview vient du proxy de l'environnement Emergent (content-signals Cloudflare) ; en production c'est bien `public/robots.txt` qui sera servi.

### Déploiement encore en attente (session précédente)
- `CitadelleCreateListing.js` : badge "Recommandé" sur l'Estimation Expert + suppression de la case "Afficher le prix de réserve". En attente de `git pull` + `yarn build` sur le VPS.
