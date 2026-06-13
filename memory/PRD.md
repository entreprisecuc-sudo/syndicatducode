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
- **Paiement direct (Stripe mocké) : TERMINÉ 10/06/2026**
  - Route `POST /api/citadelle/services/{id}/buy` — checkout mocké (succès immédiat)
  - Collection `citadelle_service_orders` avec statuts : en_attente, en_cours, termine, annule
  - Modale de checkout côté public (nom, email, message + confirmation)
  - Écran de succès avec référence de commande
  - Emails : confirmation client + notification admin (branding HTML Citadelle)
  - Admin : onglet "Commandes" avec filtres statut + sélecteur de statut inline
  - `GET /api/citadelle/admin/services/orders` + `PATCH /api/citadelle/admin/services/orders/{id}`

### ✅ Newsletter / Alertes Annonces (TERMINÉ 10/06/2026)
- Formulaire d'inscription public sur la page d'accueil Citadelle
- Auto-inscription silencieuse des membres connectés
- Désinscription via lien dans l'email (RGPD)
- Email digest HTML visuel (titre, type, prix, image, lien, pixel tracker)
- Scheduler APScheduler : vendredi 16h par défaut, entièrement configurable
- Admin : stats abonnés, liste, config (fréquence, jour, heure, nb annonces), envoi immédiat
- **Aperçu intégré** de l'email directement dans la page admin (iframe live)
- **Historique** des envois avec stats : délivrés, ouvertures (pixel), clics (redirect tracker)
- Visualisation d'un ancien email depuis l'historique (modal iframe)
- Tracking pixel 1×1 + redirecteur de clics (routes publiques `/newsletter/pixel/` et `/newsletter/click/`)

### ✅ Notifications email vendeurs (TERMINÉ 10/06/2026)
- **Nouveau message** : email au vendeur dès le 1er message d'une conversation
- **Nouvelle offre** : email au vendeur lors de chaque offre d'achat reçue
- **Relance 24h** : cron horaire APScheduler → une seule relance si vendeur n'a pas répondu en 24h
- Pas de doublon : `seller_notified_at` + `reminder_sent_at` sur la conversation
- Si vendeur répond → `reminder_sent_at` marqué pour bloquer toute future relance
- Templates HTML visuels (bleu Citadelle / or / vert offre / orange relance)

### ✅ Blog Citadelle (TERMINÉ 10/06/2026)
- Interface publique : liste d'articles avec filtres par catégorie, page de lecture Markdown
- Gestion admin : éditeur Markdown plein écran + prévisualisation en temps réel (bascule)
- **Image de couverture** : upload depuis l'interface admin, affichée en carte liste + hero article
- Catégories : Actualités, Conseils, Tutoriels, Marché, Juridique
- Slug auto-généré depuis le titre (unicité garantie)
- Auteur, date de publication, lien partenaire
- Styles CSS blog-content (clair) + blog-content--dark (admin)
- `BLOG_CATEGORIES` centralisées dans `citadelleConstants.js` (DRY)

### ✅ Catalogue Services v2 — Contenu officiel (TERMINÉ 13/06/2026)
- Ajout du champ `target_category` (vendeur / acheteur / commun) aux modèles `ServiceCreate` et `ServiceUpdate`
- Route de seeding idempotente `POST /api/citadelle/admin/services/seed` : 10 services officiels créés, 3 anciens désactivés
- Frontend restructuré en 3 sections distinctes avec en-têtes visuels
- Extraction des modales en composants indépendants (`ServiceDetailModal.js`, `ServiceCheckoutModal.js`) — respect Règle 17
- Constante `SERVICE_TARGET_SECTIONS` centralisée dans `citadelleConstants.js` — respect DRY


### Phase E — Statistiques & SEO (À FAIRE)

### ✅ Gestion des Litiges — Dispute Management (TERMINÉ 12/06/2026)
- **Acheteur** : Bannière "Fonds bloqués — La Garde veille" (statuts séquestre), bouton "Ouvrir un litige" + modal, bouton "Annuler l'achat" + modal avec frais calculés dynamiquement (dès 7 jours)
- **Vendeur** : Chat litige confidentiel (Vendeur · La Garde), bouton "Annuler la vente" + panneau de facturation (remboursement intégral acheteur, 0 frais vendeur, confirmation définitive)
- **Admin** : Bouton "Résoudre le litige" (retour `payment_done`), "Annuler la vente" (remboursement + annonce remise en `active`), config dynamique des frais par tranches de prix (`citadelle_dispute_config`)
- Frais d'annulation : 49€ (< 1000€) / 99€ (1000-5000€) / 199€ (> 5000€) — MOCKED, configurable admin
- Nouvelles routes : `open-dispute`, `cancel-purchase`, `cancellation-fee`, `dispute-messages` (GET/POST), `resolve-dispute`, `cancel-transaction`, `dispute-config` (GET/PATCH)
- ⚠️ `paid_at` ajouté lors du paiement (transactions antérieures = `None` → annulation désactivée)

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
| POST /api/citadelle/services/{id}/buy | Acheter un service (paiement mocké) |
|| GET /api/citadelle/admin/services/orders | Admin: liste commandes de services |
|| PATCH /api/citadelle/admin/services/orders/{id} | Admin: mettre à jour une commande |
| POST /api/citadelle/transactions/{id}/open-dispute | Acheteur: ouvrir un litige |
|| GET /api/citadelle/transactions/{id}/cancellation-fee | Acheteur: consulter frais d'annulation |
|| POST /api/citadelle/transactions/{id}/cancel-purchase | Acheteur: annuler achat (frais mocké) |
|| GET /api/citadelle/transactions/{id}/dispute-messages | Vendeur/Admin: lire messages litige |
|| POST /api/citadelle/transactions/{id}/dispute-messages | Vendeur/Admin: envoyer message litige |
|| POST /api/citadelle/admin/transactions/{id}/resolve-dispute | Admin: résoudre litige |
|| POST /api/citadelle/admin/transactions/{id}/cancel-transaction | Admin: annuler vente + rembourser |
|| POST /api/citadelle/transactions/{id}/cancel-as-seller | Vendeur: annuler la vente en litige (panneau facturation) |
|| PATCH /api/citadelle/admin/dispute-config | Admin: modifier config frais (tranches prix) |
| POST /api/citadelle/newsletter/subscribe-member | Auto-inscription membre connecté |
| GET /api/citadelle/newsletter/unsubscribe/{token} | Désinscription via lien email |
| GET /api/citadelle/admin/newsletter/subscribers | Admin: liste abonnés + stats |
| DELETE /api/citadelle/admin/newsletter/subscribers/{id} | Admin: supprimer abonné |
| GET /api/citadelle/admin/newsletter/config | Admin: lire config scheduler |
| PATCH /api/citadelle/admin/newsletter/config | Admin: modifier config + reprogrammer |
| POST /api/citadelle/admin/newsletter/send-now | Admin: envoi immédiat |
| GET /api/citadelle/admin/newsletter/preview | Admin: prévisualisation HTML email |
| GET /api/citadelle/blog | Liste publique articles publiés (filtres catégorie, pagination) |
| GET /api/citadelle/blog/{slug} | Lecture d'un article par slug |
| GET /api/citadelle/admin/blog | Admin: tous les articles |
| GET /api/citadelle/admin/blog/{id} | Admin: détail complet (avec content_md) |
| POST /api/citadelle/admin/blog | Admin: créer un article |
| PATCH /api/citadelle/admin/blog/{id} | Admin: modifier un article |
| DELETE /api/citadelle/admin/blog/{id} | Admin: supprimer un article |

---

## Collections MongoDB

| Collection | Description |
|------------|-------------|
| users | Utilisateurs (index unique: email+platform) |
| citadelle_listings | Annonces Citadelle |
| citadelle_transactions | Transactions (offres, paiements, accès) |
| citadelle_conversations | Messagerie pré-vente |
| citadelle_services | Catalogue services admin |
| citadelle_newsletter_subscriptions | Abonnés newsletter (email, user_id, token désinscription) |
| citadelle_newsletter_config | Config scheduler (fréquence, jour, heure, max_listings) |
| citadelle_conversations | Messagerie pré-vente (+ seller_notified_at, reminder_sent_at) |
| citadelle_blog_posts | Articles blog (id, slug, title, excerpt, content_md, category, author_name, partner_link, is_published, published_at) |
| citadelle_dispute_config | Config frais d'annulation par tranches de prix (doc unique id="default") |

---

## ⚠️ Points d'attention
- **Stripe MOCKED** — En attente des clés API
- **CITADELLE_FROM_EMAIL** → `atelier@syndicatducode.fr` (temporaire)
- **CITADELLE_URL** → `https://lacitadellenumerique.fr` (pas encore déployé)
- **BACKEND_PUBLIC_URL** → URL publique du backend pour les images d'annonces dans les emails (configurable dans .env)
- **Uploads** accessibles via `/api/uploads/` (fix K8s)
- **APScheduler** — Scheduler newsletter démarré au boot du backend, config rechargée depuis MongoDB
- **paid_at** → Ajouté lors du paiement (12/06/2026). Transactions antérieures ont `paid_at: None` → annulation acheteur désactivée pour ces transactions.
- ⚠️ Règle 17 : `transactions.py` ≈ 1030 lignes et `CitadelleTransactionDetail.js` ≈ 716 lignes. Découpage futur recommandé.

### ✅ Widget Chat Flottant Refonte (TERMINÉ 12/06/2026)
- Suppression des bulles multiples (une par transaction)
- Une seule bulle noire/dorée, positionnée à 100px du bas (au-dessus du footer)
- Clic → panneau "Mes conversations" à droite de la bulle
- Rouge : litige (La Garde) | Bleu : conversation standard
- Clic sur une conversation → vue chat complète (messages + saisie + envoi)
- Bouton retour vers la liste
- Sons médiévaux conservés (Web Audio API)
- Fichier : `CitadelleChatWidget.js` (refonte complète, 1 seul fichier)

*Mise à jour : 12/06/2026*
