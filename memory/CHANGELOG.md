# CHANGELOG — La Citadelle Numérique

> Journal des sessions. Le PRD historique complet reste dans PRD.md.

## 🩹 Session 03/08/2026 — Correctif prod : Centre d'aide (/aide) page blanche
- **Cause 1 (routage)** : `/aide` est rendu par le backend (`/api/aide`, pas de route React). Le VPS n'avait AUCUN proxy Nginx `/aide` → le SPA se chargeait sans route → page blanche. Ajout dans `sites-available/lacitadellenumerique.fr` : `location = /aide` + `location ^~ /aide/` → proxy vers `127.0.0.1:8001/api/aide`. nginx -t OK + reload OK. `/aide` renvoie 200 avec « Centre d'aide ».
- **Cause 2 (données)** : la collection `citadelle_help_articles` était VIDE en prod (103 articles générés seulement sur preview, jamais copiés). Export versionné `backend/scripts/seed/help_articles.json` (879 KB, 103 articles) + script idempotent `backend/scripts/seed_help_articles.py` (upsert par slug, lit MONGO_URL/DB_NAME). À exécuter une fois sur le VPS pour peupler /aide.


## 🚀 Session 03/08/2026 — DÉPLOIEMENT VPS RÉUSSI (branche main-projet-9)
- Code déployé : git checkout main-projet-9 + yarn build + pm2 restart syndicat-backend (OK).
- Nginx Dynamic Rendering EN PRODUCTION : `map $lcn_is_bot` dans `/etc/nginx/conf.d/lcn_prerender.conf` + 4 `location` (scope `/citadelle*`) insérées avant `location /api` dans `sites-available/lacitadellenumerique.fr` (sauvegarde `.bak_prerender`). `nginx -t` OK + reload OK.
- Validation prod (curl) : robot /citadelle/annonces → prérendu SSR ✅ ; humain → SPA (`id=root`) ✅ ; robot accueil → title correct ✅ ; /aide 200 ✅ ; /api sitemap 200 ✅.
- ✅ Phase A + Phase B + refonte Hero = TOUT EN LIGNE. Reste optionnel : aligner le contenu SEO riche de l'accueil côté prérendu (`STATIC_PAGES["/citadelle"]`), et demander l'indexation dans Google Search Console.

## 🎨 Session 03/08/2026 (suite 2) — Refonte Hero accueil (UX premium + SEO déplacé)
Le client a jugé le Hero surchargé de texte (« c'est moche »). Rééquilibrage UX/SEO/conversion dans `pages/citadelle/CitadelleHome.js` :
- **Hero épuré** : H1 « Achetez. Vendez. Sécurisez. » conservé + sous-titre court « La marketplace française spécialisée dans la vente de sites internet. » + ligne de catégories à puces dorées (Sites web • E-commerce • SaaS • Applications • Noms de domaine). Les 2 longs paragraphes SEO ont été RETIRÉS du Hero. Rendu premium, aéré, minimaliste.
- **Nouvelle section SEO éditoriale** `SeoContentSection` (composant, ~900 mots) placée APRÈS les catégories : eyebrow + H2 « Acheter ou vendre un site internet en toute sécurité », intro riche (mots-clés naturels : vente/achat de site internet, site internet à vendre, marketplace de sites internet, vente de SaaS/e-commerce/applications, business en ligne), grille « Pourquoi choisir » (4 cartes à icônes), colonnes « Comment vendre » / « Comment acheter » (étapes numérotées + CTA), bandeau navy « Nos garanties ». Design cohérent charte navy/or, non « blog ».
- FAQ (FaqSection + Schema FAQPage) déjà présente, conservée. Vérifié par screenshots desktop (Hero + section SEO). Frontend compilé. Aucune régression backend.


## 🔍 Session 03/08/2026 (suite) — Phase A finalisée + Phase B (Dynamic Rendering) livrée
Reprise du chantier SEO. Règle 6 respectée : validations en muet (screenshots + curl) + 1 passe `testing_agent` sur la Phase A **autorisée explicitement par le client**.

### ✅ Phase A — SEO on-page TERMINÉE (testing_agent iteration_25 : 100% des critères)
- **P7 — noindex pages privées** : nouveau composant DRY `components/citadelle/SeoNoIndex.jsx` (`<meta name="robots" content="noindex, follow">`) ajouté sur Login, Register, ForgotPassword, ResetPassword, GoogleCallback, PaymentSuccess (6/6 vérifiés).
- **P4 — Helmet pages légales** : `<Helmet>` (title littéral + meta description + canonical) sur CGU, CGV, Mentions, Confidentialité, Contact (5/5). Prop `pageTitle` retirée de Contact (conflit hook). URL canonique centralisée : `CITADELLE_PUBLIC_URL` (env `REACT_APP_CITADELLE_URL`, repli domaine) dans `citadelleConstants.js`.
- **P5 — ALT images** : audit complet → **toutes** les images publiques ont déjà un `alt` (0 manquant : 17 sur /annonces, 61 sur /blog). Rien à corriger.
- ⚠️ **Doublon `meta description`** (préexistant) : `index.html` a une description statique NON remplacée par Helmet (Helmet en ajoute une 2ᵉ). Le client a validé de **laisser tel quel** — les bots reçoivent la bonne description unique via le SSR Phase B.

### ✅ Phase B — Dynamic Rendering (Stratégie 2b, sans Puppeteer) — backend LIVRÉ + vérifié (curl Googlebot)
- **`config/seo_theme.py`** (nouveau) : gabarit HTML SEO partagé (STYLE, `render_page`, `maillage_block`, `esc`, `fmt_price`, topnav). ⚠️ Dette technique (Règle 11) : `help_center.py` conserve sa propre copie du gabarit (non refactoré pour ne pas risquer le déployé) — à consolider plus tard.
- **`config/prerender.py`** (nouveau) : libellés types d'actifs + catégories blog + métadonnées (title/description/H1/intro) des pages statiques. Zéro hardcoding (Règle 5).
- **`routes/prerender.py`** (nouveau) : `GET /api/prerender/{path}` (GET+HEAD). Dispatcher → rendus : accueil, annonces (liste+fiche, JSON-LD Product/Offer), blog (liste+article, markdown-it → HTML, JSON-LD Article), guides, chroniques, parutions, services, pages légales/statiques. BreadcrumbList partout, canonical vers l'URL React réelle, OG. Fiches non actives/adulte → noindex. 404 propre sur route/slug inconnu.
- **`server.py`** : router `prerender` enregistré (import + set_database + include).
- **Vérifié (curl -A Googlebot)** : 13 routes → 200, HTML rempli (title/desc/canonical/robots/H1/JSON-LD uniques), markdown rendu intégral (ex. article 4533→5223 car.), 404 sur inconnus, HEAD OK.
- **Nginx VPS** : snippet d'aiguillage bot→prérendu / humain→SPA fourni dans `/app/memory/nginx_prerender_citadelle.md` (à déployer côté VPS, scope strict `/citadelle*`, repli SPA si 404).


## 🔍 Session 03/08/2026 — Chantier SEO (en cours)
Suite à un audit SEO (cause racine identifiée : SPA React CSR → HTML vide au crawl → "Crawled - currently not indexed"). Stratégie validée par le client : **2b hybride** (pages dynamiques en rendu backend on-demand + prerendering pages stables), **sans Puppeteer** (privilégier le rendu backend, pattern /aide) car annonces fréquentes → fraîcheur requise.

### ⚠️ Piège technique découvert
`react-helmet-async@3.0.0` **plante** avec `<title>{variableJSX}</title>` ("Helmet expects a string as a child of <title>"). Les titres LITTÉRAUX passent. → Pour les titres/meta DYNAMIQUES, utiliser la manipulation DOM dans un `useEffect` (pattern déjà utilisé par `CitadelleBlogPost.js`), PAS `<Helmet>`.

### ✅ Fait & vérifié (screenshot/curl, Règle 6 respectée)
- **P2 — Détail d'annonce** (`CitadelleListingDetail.js`) : SEO dynamique complet via useEffect DOM → title (« … à vendre »), meta description (type, techno, trafic, CA, prix), canonical, robots (noindex si adulte), OpenGraph + Twitter, **JSON-LD Product/Offer + BreadcrumbList**. Cleanup au démontage.
- **P8 — Image OG par défaut** : `public/og-default.png` (1200×630, charte Citadelle) créée + référencée dans `index.html` (og:image + twitter:image + dimensions).
- **P6 (partiel)** — `index.html` : `apple-mobile-web-app-title` corrigé (« Papa en Mousse » → « La Citadelle Numérique »).

### ✅ Phase A on-page — TERMINÉE (voir session 03/08 suite ci-dessus)
- P3 : Home optimisée (fait session précédente).
- P4 : Helmet pages légales — ✅ FAIT.
- P5 : ALT images — ✅ déjà couvert (0 manquant).
- P7 : noindex pages privées — ✅ FAIT (composant `SeoNoIndex`).
- P6 (reste) : manifest public propre (⚠️ sans casser la PWA admin « Papa en Mousse ») — laissé tel quel (client : ne pas toucher au manifest admin).

### ✅ Phase B (déblocage indexation) — backend LIVRÉ (voir session 03/08 suite)
- Rendu backend on-demand (pattern /aide) pour toutes les routes publiques, servi aux bots via dynamic rendering Nginx (User-Agent). Pas de Puppeteer. Snippet Nginx dans `/app/memory/nginx_prerender_citadelle.md`. **Reste : déploiement VPS par le client.**

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

### ✅ Phase 2 (02/08/2026) — Génération complète du contenu
- **103/103 articles générés** sur les 11 catégories (Acheter 15, Vendre 32, Estimation 9, Transactions sécurisées 8, La Garde 4, Livrable 5, Enchères 5, Mon compte 8, Paiements 5, Services 6, Juridique 6).
- **~86 080 mots** au total (~800-900 mots/article en moyenne), 0 article court, tous avec 3-4 FAQ complémentaires + lead (réponse directe AEO).
- Script fiabilisé : **upsert idempotent** (plus de DuplicateKeyError), parseur JSON robuste aux échappements invalides. NB : la passerelle LLM sérialise les requêtes (~47s/article), la génération complète prend ~1h15.
- Sitemap : 103 pages `/aide/*` incluses. Index `/aide` : 100% des catégories disponibles.
- Validé (Règle 6, sans testing_agent) : stats DB, curl (JSON-LD FAQPage+BreadcrumbList valides), screenshot (rendu premium, recherche instantanée OK).

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
