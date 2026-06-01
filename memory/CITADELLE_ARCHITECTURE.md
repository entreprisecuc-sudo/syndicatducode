# Architecture — La Citadelle Numérique
*Document de référence CTO — Validé le 02/06/2026*
*À lire avant tout développement*

---

## Principe directeur

**Deux vitrines, un seul moteur.**

- 2 frontends React indépendants
- 1 backend FastAPI partagé
- 1 base MongoDB partagée (`syndicat_base`)
- 1 administration unique (back-office Syndicat du Code enrichi)

---

## Architecture globale

```
lacitadellenumerique.fr          syndicatducode.fr
        │                               │
        ▼                               ▼
React App Citadelle             React App Syndicat
/app/frontend-citadelle/        /app/frontend/
        │                               │
        └───────────────┬───────────────┘
                        ▼
          Backend FastAPI UNIQUE (/app/backend/)
          Routes existantes : /api/...
          Nouvelles routes  : /api/citadelle/...
                        │
                        ▼
          MongoDB : syndicat_base
          Collections existantes + citadelle_*
```

---

## Gestion des utilisateurs

**Principe : Utilisateurs TOTALEMENT INDÉPENDANTS**

- Un utilisateur Syndicat du Code ≠ un utilisateur La Citadelle Numérique
- Aucun SSO, aucun accès croisé automatique
- Deux communautés séparées, gérées depuis un seul back-office admin

**Implémentation :** champ discriminant `platform` dans la collection `users`

```
users.platform = "syndicat"   → membre Syndicat du Code
users.platform = "citadelle"  → utilisateur La Citadelle Numérique
```

**Note architecturale (3ème option validée) :**
Le champ `account_type: "community" | "marketplace"` a été intentionnellement
NON implémenté à ce stade (redondant avec `platform` aujourd'hui).
Il sera ajouté uniquement si un 3ème domaine de type ambigu est créé.
Cette décision respecte les règles KISS et Occam.

**Rôles Citadelle :**
- `citadelle_user` : acheteur et/ou vendeur sur la marketplace
- `admin` (Syndicat) : gestion complète des deux plateformes

**Isolation stricte :**
- Login `lacitadellenumerique.fr` → authentifie UNIQUEMENT `platform: "citadelle"`
- Login `syndicatducode.fr` → authentifie UNIQUEMENT `platform: "syndicat"`

---

## Nouvelles routes backend

Toutes préfixées `/api/citadelle/` — modules séparés dans `/app/backend/routes/citadelle/`

```
/api/citadelle/auth/register
/api/citadelle/auth/login
/api/citadelle/listings/          (CRUD annonces)
/api/citadelle/categories/        (Catégories)
/api/citadelle/transactions/      (Transactions)
/api/citadelle/messages/          (Messagerie)
/api/citadelle/services/          (Catalogue services)
/api/citadelle/reviews/           (Avis)
/api/citadelle/blog/              (Articles)
/api/citadelle/admin/             (Routes admin Citadelle)
```

---

## Collections MongoDB

### Existantes réutilisées (modification minimale)

| Collection | Modification |
|------------|-------------|
| `users` | +1 champ `platform: "syndicat" \| "citadelle"` |
| `admin_logs` | +champ `platform: "citadelle"` sur les actions Citadelle |
| `notifications` | +champ `platform: "citadelle"` pour notifs Citadelle |

### Nouvelles collections (préfixe `citadelle_`)

| Collection | Description |
|------------|-------------|
| `citadelle_listings` | Annonces de vente |
| `citadelle_categories` | Catégories d'annonces |
| `citadelle_transactions` | Transactions acheteur↔vendeur |
| `citadelle_messages` | Messagerie interne (isolée du Syndicat) |
| `citadelle_services` | Catalogue des services |
| `citadelle_service_requests` | Demandes de services |
| `citadelle_reviews` | Avis post-transaction |
| `citadelle_favorites` | Annonces sauvegardées |
| `citadelle_disputes` | Litiges sur transactions |
| `citadelle_blog` | Articles de blog |
| `citadelle_settings` | Configuration plateforme (singleton) |

---

## Feuille de route de développement

### Phase A — Socle technique
- Frontend Citadelle (React app skeleton)
- CORS backend pour lacitadellenumerique.fr
- Auth indépendante `/api/citadelle/auth/`
- Champ `platform` dans users
- Menu "Citadelle" dans back-office Syndicat

### Phase B — Marketplace Annonces
- CRUD annonces (backend + admin)
- Workflow validation admin
- Pages publiques (liste + détail)
- Espace membre (créer/gérer annonces)
- Recherche + filtres

### Phase C — Transactions & Messagerie
- Système d'offres
- Messagerie acheteur↔vendeur
- Intégration Stripe réelle (escrow)
- Validation acheteur + libération fonds
- Gestion des litiges

### Phase D — Services, Avis, Blog
- Catalogue services + demandes
- Système d'avis post-transaction
- Blog CMS (admin) + affichage public

### Phase E — Statistiques & SEO
- Dashboard admin Citadelle (KPIs, revenus)
- SEO (sitemap, meta, canonical)
- Performance (indexes MongoDB, CDN)

---

## Structure fichiers backend à créer

```
/app/backend/routes/citadelle/
├── __init__.py
├── auth.py
├── listings.py
├── categories.py
├── transactions.py
├── messages.py
├── services.py
├── reviews.py
├── blog.py
└── admin.py
```

## Structure fichiers frontend à créer

```
/app/frontend-citadelle/
├── src/
│   ├── App.js
│   ├── config/constants.js
│   ├── services/api.js
│   ├── context/AuthContext.js
│   ├── pages/
│   │   ├── Home.js
│   │   ├── Listings.js
│   │   ├── ListingDetail.js
│   │   ├── SellMySite.js
│   │   ├── Services.js
│   │   ├── Blog.js
│   │   ├── Login.js
│   │   ├── Register.js
│   │   └── member/
│   │       ├── Dashboard.js
│   │       ├── MyListings.js
│   │       ├── CreateListing.js
│   │       ├── Messages.js
│   │       ├── Transactions.js
│   │       ├── MyServices.js
│   │       ├── Billing.js
│   │       ├── Profile.js
│   │       └── Security.js
│   └── components/
│       ├── layout/
│       │   ├── Navigation.js
│       │   └── Footer.js
│       ├── listings/
│       │   ├── ListingCard.js
│       │   ├── ListingFilters.js
│       │   └── ListingBadge.js
│       └── shared/
│           ├── Button.js
│           └── Pagination.js
```

---

## Risques techniques identifiés

| Risque | Niveau | Mitigation |
|--------|--------|------------|
| Isolation platform insuffisante | Élevé | Guard `platform` systématique dans chaque route |
| Régression sur Syndicat | Moyen | Routes et collections strictement préfixées |
| Stripe non actif (mocked Phase A+B) | Élevé | Stripe réel uniquement en Phase C |
| Taille server.py | Moyen | Routes Citadelle dans modules séparés |

---

*Statut : Document de référence — Ne pas modifier sans accord explicite*
