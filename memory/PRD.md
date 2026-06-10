# Le Syndicat du Code + La Citadelle Numérique — PRD

## Informations générales
- **Nom du projet** : Le Syndicat du Code + La Citadelle Numérique
- **Type** : Site vitrine + Espace Membre + Marketplace d'actifs numériques
- **Stack** : React + FastAPI + MongoDB
- **Architecture** : 1 Backend partagé, 1 DB partagée, 2 Frontends (Syndicat + Citadelle)

---

## La Citadelle Numérique — Phases

### ✅ Phase A — Socle technique (TERMINÉ)
- Frontend sous `/citadelle`, charte graphique (Bleu #0F2747, Or #C9A45C)
- Auth indépendante avec `platform: "citadelle"`
- Page d'accueil, Connexion, Inscription, Espace membre

### ✅ Phase B — Marketplace Annonces (TERMINÉ)
- CRUD annonces complet (create, read, update, delete)
- Workflow validation admin (pending → active → rejected)
- Upload images + documents (PDF, DOC, DOCX) — 5 slots par annonce
- Pages publiques : liste avec filtres/recherche/pagination + détail
- Espace membre : créer, modifier, supprimer mes annonces
- Interface admin Citadelle : validation/rejet/mise en avant/suppression

### ✅ Phase C — Transactions & Messagerie (TERMINÉ 10/06/2026)
**Flux complet de transaction sécurisée :**
1. Acheteur fait une offre (montant + message)
2. Vendeur accepte / refuse / contre-offre
3. Acheteur paye (MOCKED — Stripe à venir)
4. Fonds placés en séquestre
5. Vendeur transmet les accès via interface sécurisée
6. Admin vérifie les accès
7. Admin confirme la vente → fonds libérés + accès envoyés à l'acheteur

**Backend** : `routes/citadelle/transactions.py` (15 routes)
- `POST /api/citadelle/transactions/offer` — Faire une offre
- `GET /api/citadelle/transactions/my` — Mes transactions
- `GET /api/citadelle/transactions/{id}` — Détail transaction
- `POST /api/citadelle/transactions/{id}/accept` — Accepter offre
- `POST /api/citadelle/transactions/{id}/refuse` — Refuser offre
- `POST /api/citadelle/transactions/{id}/counter` — Contre-offre
- `POST /api/citadelle/transactions/{id}/accept-counter` — Accepter contre-offre
- `POST /api/citadelle/transactions/{id}/pay` — Payer (MOCKED)
- `POST /api/citadelle/transactions/{id}/credentials` — Transmettre accès
- `POST /api/citadelle/transactions/{id}/message` — Messagerie
- `GET /api/citadelle/admin/transactions` — Admin liste
- `GET /api/citadelle/admin/transactions/{id}` — Admin détail
- `POST /api/citadelle/admin/transactions/{id}/verify` — Vérifier accès
- `POST /api/citadelle/admin/transactions/{id}/complete` — Finaliser vente
- `POST /api/citadelle/admin/transactions/{id}/dispute` — Ouvrir litige

**Frontend** :
- Modal "Faire une offre" sur page détail annonce
- Page "Mes transactions" (onglets Achats/Ventes)
- Détail transaction (actions contextuelles + messagerie)
- Admin transactions (vérification accès, finalisation, litiges)

**Statuts** : `offer_sent → offer_accepted → payment_done → credentials_submitted → admin_verified → completed`

### Phase D — Services, Avis & Blog (À FAIRE)
### Phase E — Statistiques & SEO (À FAIRE)

---

## Collections MongoDB (DB: syndicat_base)

| Collection | Description |
|------------|-------------|
| users | Utilisateurs (email, password_hash, role, status, platform) |
| citadelle_listings | Annonces Citadelle (title, slug, type, seller_id, status, images) |
| citadelle_transactions | Transactions (buyer_id, seller_id, status, credentials, messages) |
| profiles | Profils développeurs Syndicat |
| portfolio | Projets portfolio Syndicat |
| ... | (autres collections Syndicat inchangées) |

---

## Fichiers de référence Citadelle
- `/app/backend/routes/citadelle/auth.py` — Auth Citadelle
- `/app/backend/routes/citadelle/listings.py` — CRUD annonces
- `/app/backend/routes/citadelle/transactions.py` — Transactions complètes
- `/app/frontend/src/pages/citadelle/` — Pages frontend Citadelle
- `/app/frontend/src/pages/citadelle/member/` — Espace membre
- `/app/frontend/src/pages/admin/AdminCitadelleListings.js` — Admin annonces
- `/app/frontend/src/pages/admin/AdminCitadelleTransactions.js` — Admin transactions
- `/app/frontend/src/config/citadelleConstants.js` — Config et helpers

---

## ⚠️ Points d'attention
- **Stripe MOCKED** — Paiement simulé, en attente des clés API
- **CITADELLE_FROM_EMAIL** — Utilise `atelier@syndicatducode.fr` temporairement
- **CITADELLE_URL** — Pointe vers `https://lacitadellenumerique.fr` (pas encore déployé)
- **Uploads** — Accessibles via `/api/uploads/` (fix routage Kubernetes)

---

*Dernière mise à jour : 10/06/2026*
