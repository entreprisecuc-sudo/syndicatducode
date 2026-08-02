# CHANGELOG — La Citadelle Numérique

> Journal des sessions. Le PRD historique complet reste dans PRD.md.

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
