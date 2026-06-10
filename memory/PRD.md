# Le Syndicat du Code + La Citadelle Numérique — PRD

## Informations générales
- **Nom** : Le Syndicat du Code + La Citadelle Numérique
- **Stack** : React + FastAPI + MongoDB
- **Architecture** : 1 Backend, 1 DB, 2 Frontends (Syndicat + Citadelle)

---

## Phases Citadelle

### ✅ Phase A — Socle (TERMINÉ)
Auth indépendante, page d'accueil, connexion, inscription, espace membre

### ✅ Phase B — Marketplace Annonces (TERMINÉ)
CRUD annonces, validation admin, upload images+documents, pages publiques

### ✅ Phase C — Transactions & Messagerie (TERMINÉ 10/06/2026)
- Offres d'achat, contre-offres, acceptation/refus
- Paiement MOCKED (Stripe à venir)
- Transmission sécurisée des accès : vendeur → admin vérifie → admin transmet à l'acheteur (+ email)
- Messagerie pré-vente (polling 3s) + badge non lus
- Messagerie transaction

### ✅ Profil vendeur sécurisé (TERMINÉ 10/06/2026)
- Coordonnées bancaires (IBAN, BIC, Banque)
- Statut Particulier/Professionnel (SIREN, SIRET, TVA)
- Upload documents : carte identité, RIB, KBIS
- Vue admin : onglets Bancaire/Pro + Documents

### ✅ Services Citadelle (TERMINÉ 10/06/2026)
- Catalogue paramétrable admin (CRUD)
- Page publique /citadelle/services
- Types : Payant, Gratuit, Partenaire, Sur devis

### Phase D — Avis, Blog (À FAIRE)
### Phase E — Statistiques & SEO (À FAIRE)

---

## Routes backend Citadelle

| Route | Description |
|-------|-------------|
| POST /api/citadelle/auth/register | Inscription |
| POST /api/citadelle/auth/login | Connexion |
| PATCH /api/citadelle/auth/profile | Modifier profil |
| GET/PATCH /api/citadelle/auth/profile/billing | Coordonnées bancaires + pro |
| POST /api/citadelle/auth/profile/document/{type} | Upload document sécurisé |
| GET /api/citadelle/auth/admin/users/{id} | Admin: détail utilisateur |
| POST /api/citadelle/upload-image | Upload fichier annonce |
| GET/POST/PATCH/DELETE /api/citadelle/listings/* | CRUD annonces |
| POST /api/citadelle/transactions/offer | Faire une offre |
| POST /api/citadelle/transactions/{id}/accept | Accepter offre |
| POST /api/citadelle/transactions/{id}/pay | Payer (MOCKED) |
| POST /api/citadelle/transactions/{id}/credentials | Transmettre accès |
| POST /api/citadelle/admin/transactions/{id}/verify | Admin: vérifier accès |
| POST /api/citadelle/admin/transactions/{id}/complete | Admin: finaliser vente |
| POST /api/citadelle/admin/transactions/{id}/transmit | Admin: transmettre accès + email |
| POST /api/citadelle/messages/send | Envoyer message pré-vente |
| POST /api/citadelle/messages/{id}/reply | Répondre |
| GET /api/citadelle/messages-unread-count | Compteur non lus |
| GET /api/citadelle/services | Services publics |
| CRUD /api/citadelle/admin/services | Admin: gérer services |

---

## Collections MongoDB

| Collection | Description |
|------------|-------------|
| users | Utilisateurs (index unique: email+platform) |
| citadelle_listings | Annonces Citadelle |
| citadelle_transactions | Transactions (offres, paiements, accès) |
| citadelle_conversations | Messagerie pré-vente |
| citadelle_services | Catalogue services admin |

---

## ⚠️ Points d'attention
- **Stripe MOCKED** — En attente des clés API
- **CITADELLE_FROM_EMAIL** → `atelier@syndicatducode.fr` (temporaire)
- **CITADELLE_URL** → `https://lacitadellenumerique.fr` (pas encore déployé)
- **Uploads** accessibles via `/api/uploads/` (fix K8s)

*Mise à jour : 10/06/2026*
