# Le Syndicat du Code - PRD

## Informations générales
- **Nom du projet** : Le Syndicat du Code
- **Slogan** : Notre loi, unis par le code.
- **Type** : Site vitrine + Espace Membre complet pour développeurs et commerciaux
- **Stack** : React + FastAPI + MongoDB

---

## Fonctionnalités implémentées

### ✅ Site Vitrine (Phase 1)
- Landing Page complète (Hero, Services, Pourquoi nous, Processus, Audiences, Contact)
- Formulaire de contact avec upload de fichiers
- Modal de devis accessible depuis toute la navigation
- Pages légales (CGV, CGU, RGPD)
- Page "Rejoindre le Syndicat"
- 100% Responsive (Mobile, Tablette, Desktop)

### ✅ Authentification (Phase 2)
- Inscription, Connexion (JWT)
- Réinitialisation mot de passe (SMTP Hostinger)
- Choix de rôle (commercial/developer) au premier login
- Protection des routes par rôle (ProtectedRoute, RoleRoute)
- Redirection automatique selon rôle

### ✅ Espaces Membres (Phase 3)
- **Dashboard Commercial** : Stats, Documents, Affaires
- **Dashboard Développeur** : Stats, Documents, Opportunités
- Layout commun avec sidebar responsive
- Actions rapides contextuelles

- **Phase 2 TERMINÉE** : Centralisation des 122 appels Axios en un service `api.js` (01/06/2026)
  - Fichier centralisé : `services/api.js` (intercepteur token JWT + gestion 401 globale)
  - 37 fichiers migrés, `getAuthHeaders()` dépréciée, authService.js allégé


- **P0 TERMINÉ** : Chemins d'uploads centralisés via `UPLOADS_DIR` dans `.env` → `settings.py` (01/06/2026)
- **P0 REPORTÉ** : Fichiers uploads accessibles publiquement → à fermer avant mise en production
- **P0 REPORTÉ** : DEV_MODE + TEST_ACCOUNTS → à désactiver avant mise en production
- **P0 TERMINÉ** : Protection Anti-Brute Force complète (01/06/2026)
  - Rate limiting par IP sur `/api/auth/login`
  - Configuration admin (max tentatives, durée blocage, fenêtre détection)
  - Interface admin `/syndicat-admin/securite` avec toggle, déblocage manuel
  - Collections MongoDB : `login_attempts`, `blocked_ips`, `brute_force_config`


- URL secrète : `/syndicat-admin`
- Gestion des utilisateurs (liste, statut, rôle)
- Gestion des demandes de contact
- Historique des actions administratives
- Thème sombre distinctif

### ✅ Projets du Syndicat (Phase 5)
- Admins créent des projets/missions
- Développeurs consultent et postulent
- Système de candidatures avec suivi

### ✅ Annonces / Actualités (Phase 6)
- Admins publient des annonces ciblées par rôle
- Système d'épinglage et d'activation
- Affichage dans les dashboards membres

### ✅ Alertes / Popups (Phase 7)
- Admins créent des alertes globales
- Types : popup, banner
- Ciblage par rôle (all, commercial, developer)
- Activation/désactivation

### ✅ Abonnements (Phase 8)
- Gestion des plans d'abonnement par admin
- Souscription développeur (paiement **MOCKED**)
- Suivi des abonnements actifs

### ✅ Partenaires (Phase 9)
- Admins gèrent une liste de partenaires
- Catégorisation (hébergement, design, marketing, etc.)
- Affichage dans les dashboards

### ✅ Stats avancées + Menu restructuré (Phase 10)
- Dashboard admin enrichi avec statistiques détaillées
- Navigation admin réorganisée

### ✅ Profil Développeur (Phase 11)
- Upload de photo de profil
- Informations professionnelles (titre, bio, compétences)

### ✅ Portfolio / Book Développeur (Phase 12)
- CRUD complet pour projets de portfolio
- Images, liens, technologies
- **Validation admin obligatoire** avant publication

### ✅ Page publique "Membres du Syndicat" (Phase 13)
- Liste des développeurs avec abonnement actif
- Fiche de présentation détaillée par membre
- Portfolio visible (projets approuvés uniquement)

### ✅ Système de Messagerie (Phase 14)
- Visiteurs peuvent contacter les développeurs via modal
- Messages accessibles uniquement si abonnement actif

### ✅ Notifications de Rejet (Phase 15)
- Popup automatique à la connexion du développeur
- Affiche le projet rejeté et la raison
- Bouton "J'ai compris" pour fermer

### ✅ Contenu Adulte +18 (Phase 16)
- Checkbox dans le formulaire de création/édition de projet
- Badge "+18" visible sur les cartes projet (côté développeur)
- Sur la page publique des membres :
  - Image **floutée** (blur 20px) avec overlay "Image masquée"
  - Liens remplacés par **"Lien masqué (contenu +18)"** non cliquables
- Champ `is_adult_content` ajouté au modèle portfolio

### ✅ Refactoring Phase 1 (Phase 19) - 07/03/2026
**Objectif** : Réduction de la dette technique, respect des principes KISS/DRY
- **Suppression des credentials hardcodées** : Boutons quick-login retirés du Footer.js
- **Composant AdminModal centralisé** : Créé avec utilitaires (ModalFormGroup, ModalInput, etc.)
- **Modales admin refactorées** :
  - `AdminAlerts.js` - Modal migrée vers AdminModal
  - `AdminAnnouncements.js` - Modal migrée vers AdminModal
  - `AdminPartners.js` - Modal migrée vers AdminModal
  - `AdminSubscriptions.js` - 2 modales migrées vers AdminModal
- **Backend admin.py divisé** :
  - `routes/admin/__init__.py` - Module principal
  - `routes/admin/users.py` - Gestion des utilisateurs
  - `routes/admin/portfolio.py` - Validation des portfolios
  - `routes/admin/stats.py` - Statistiques, logs et contacts
- **Emails centralisés** : CGU.js, RGPD.js, Rejoindre.js utilisent maintenant CONFIG.email
- **AdminUserDetail.js décomposé** (769L → 159L, réduction 80%) :
  - `components/admin/userDetail/ProfileTab.js`
  - `components/admin/userDetail/HistoryTab.js`
  - `components/admin/userDetail/BookTab.js`
  - `components/admin/userDetail/SubscriptionTab.js`
  - `components/admin/userDetail/DocumentsTab.js`
- **DeveloperBook.js décomposé** (715L → 137L, réduction 81%) :
  - `components/developer/book/ProjectCard.js`
  - `components/developer/book/ProjectModal.js`
- **MemberDetailPage.js décomposé** (654L → 244L, réduction 63%) :
  - `components/members/ContactModal.js`
  - `components/members/MemberProjectCard.js`
- **Registre des tests créé** : `/app/TEST_REGISTRY.md`

### ✅ Gestion Utilisateurs Avancée - Admin (Phase 17)
- Lignes utilisateurs cliquables dans la liste
- Page de détail utilisateur avec 5 onglets :
  - **Profil** : Infos complètes (avatar, email, rôle, statut, bio, compétences, liens)
  - **Historique** : Timeline d'activité (projets, abonnements, messages, candidatures)
  - **Documents** : Placeholder pour fonctionnalité future
  - **Book** : Portfolio complet avec statuts (visible si développeur)
  - **Abonnement** : Détails de l'abonnement actif (visible si développeur)
- Routes backend : `/api/admin/users/{id}/full` et `/api/admin/users/{id}/activity`

### ✅ Mode Sombre/Clair Admin (Phase 18) - FINALISÉ 07/03/2026
- Toggle dark/light mode dans le header admin (icône soleil/lune)
- Thème persisté en localStorage (`syndicat_admin_theme`)
- Variables CSS pour une intégration facile dans toutes les pages admin
- Contexte React `AdminThemeContext` pour accès global
- Transitions fluides entre les modes (300ms)
- **TOUTES les pages admin migrées** :
  - AdminDashboard, AdminUsers, AdminUserDetail
  - AdminContacts, AdminLogs, AdminProjects
  - AdminAnnouncements, AdminAlerts, AdminSubscriptions
  - AdminPartners, AdminPortfolioValidation, AdminProjectDetail

### ✅ Bugfix Navigation par Ancre (Phase 20) - 08/03/2026
- **Problème** : Les liens d'ancre (#services, #contact, etc.) ne fonctionnaient que depuis la page d'accueil
- **Solution** : Application de `handleAnchorClick` au menu mobile dans `Navigation.js`
- **Comportement** : Depuis n'importe quelle page, un clic sur un lien d'ancre redirige vers la page d'accueil puis défile vers la section correspondante

### ✅ Sauvegarde des Données (Phase 23) — 01/06/2026
**Objectif** : Protection des données (P0) — export manuel et configuration auto-backup.

**Backend** : `routes/admin/backup.py` (nouveau module)
- `GET /api/admin/backup/stats` — Comptage de documents pour les 24 collections
- `GET /api/admin/backup/export/json` — ZIP contenant 1 fichier JSON par collection (ObjectId/datetime sérialisés)
- `GET /api/admin/backup/export/excel` — XLSX multi-onglets (1 onglet/collection, en-têtes stylisés, colonnes auto-dimensionnées)
- `GET /api/admin/backup/config` — Lire la configuration sauvegardée
- `POST /api/admin/backup/config` — Sauvegarder email notif + clé Google Drive JSON + paramètres auto-backup

**Frontend** : `AdminBackup.js` — Page admin complète
- Résumé global : 24 collections, total documents, date de dernière vérification
- Boutons export manuel : JSON (ZIP) et Excel (multi-onglets)
- Tableau détaillé par collection avec comptage de documents
- Formulaire configuration Google Drive (champ clé JSON + dossier destination + email + fréquence)
- Badge "Non configuré" visible tant que la clé n'est pas renseignée

**Architecture Google Drive prête** : La clé est stockée en base MongoDB (`backup_config`). L'activation ne nécessite aucun recodage — il suffira d'implémenter la logique d'upload Drive et d'appeler `send_email_notification` existante.

### ✅ Auto-Backup Google Drive + Email (Phase 23b) — 01/06/2026
- `POST /api/admin/backup/trigger` : génère le ZIP → upload Drive (si clé JSON présente) → email de notification (si email configuré) → historique en base (`backup_history`)
- `send_backup_notification_email()` ajoutée dans `services/email_service.py` (respecte le pattern DRY existant)
- Bouton "Déclencher maintenant" dans l'UI avec résultat en temps réel (fichier, Drive, email)
- `requirements.txt` mis à jour : `openpyxl`, `google-api-python-client`, `google-auth`
- `export_json()` refactorisé via helper `_generate_zip_buffer()` (DRY interne)
- PRD corrigé : `test_database` → `syndicat_base`

**Activation Google Drive** : coller la clé JSON dans le formulaire de configuration → la logique est déjà en place.

### ✅ Documentation Restauration MongoDB (P0) — 01/06/2026
- Guide complet `/app/memory/RESTAURATION_MONGODB.md` (8 sections : prérequis, décompression, restauration complète via mongoimport, script Python de secours, restauration partielle, vérifications post-restauration, restauration depuis Excel, points d'attention)
- Accordéon "Guide de restauration MongoDB" intégré directement dans la page admin `AdminBackup.js` avec commandes prêtes à copier-coller

---

### ✅ Pagination Backend + Correction N+1 (Phase 22) - 01/06/2026
**Objectif** : Paginer les listings admin et public, corriger les requêtes N+1.

**Endpoints paginés (paramètres `?page=N&limit=M`) :**
| Endpoint | Limite avant | Après | N+1 corrigé |
|---|---|---|---|
| `GET /admin/users` | 500 hardcodé | 20/page, 100 max | — |
| `GET /invoices/admin/all` | 200 hardcodé | 20/page, 100 max | ✅ (batch users + profils) |
| `GET /projects/admin/list` | 100 hardcodé | 10/page, 50 max | ✅ (agrégation MongoDB) |
| `GET /members/public` | 50 hardcodé | 12/page, 50 max | ✅ (pagination profils) |

**Réponse enrichie** : `{ items, total, page, limit, total_pages }` pour chaque endpoint.

**Frontend :**
- Nouveau composant partagé `components/shared/Pagination.js` (55L)
- `AdminUsers.js` : recherche server-side + debounce 350ms + pagination
- `AdminProjects.js` : pagination
- `MembersPage.js` : pagination + scroll to top au changement de page
**Objectif** : Respecter la règle n°17 (Composants React < 300 lignes). Tous les fichiers > 500L découpés.

**14 nouveaux sous-composants créés + 1 utilitaire :**

- `utils/billingUtils.js` — formatDate, formatCurrency, downloadInvoiceFile, STATUS_CONFIG (partagé)
- `components/profile/ProfilePhotoUpload.js` — Upload photo profil (partagé Developer + Commercial)
- `components/profile/CompanyInfoSection.js` — Section entreprise (partagée)
- `components/profile/BankingInfoSection.js` — Section bancaire (partagée)
- `components/developer/profile/PersonalInfoSection.js` — Infos personnelles développeur
- `components/developer/profile/ProfessionalInfoSection.js` — Profil pro développeur (exp, dispo, liens)
- `components/billing/InvoiceSubmitForm.js` — Formulaire soumission facture (état interne)
- `components/billing/InvoiceList.js` — Liste des factures
- `components/billing/InvoiceViewModal.js` — Modal visualisation PDF/Excel
- `components/admin/alerts/alertConfig.js` — Config partagée TYPE_CONFIG, STYLE_CONFIG, TARGET_CONFIG
- `components/admin/alerts/AlertList.js` — Liste des alertes admin
- `components/admin/alerts/AlertForm.js` — Modal formulaire alerte (état interne)
- `components/admin/projects/ProjectCard.js` — Carte projet admin
- `components/admin/projects/ProjectFormModal.js` — Modal formulaire projet (état interne)

**Résultats (réduction de taille) :**
| Fichier parent | Avant | Après | Réduction |
|---|---|---|---|
| DeveloperProfile.js | 676L | 169L | -75% |
| MemberBilling.js | 637L | 174L | -73% |
| AdminAlerts.js | 523L | 140L | -73% |
| AdminProjects.js | 522L | 166L | -68% |
| CommercialProfile.js | 505L | 237L | -53% |

**Bugs corrigés au passage :**
- `MemberBilling.js` : Suppression de `getAuthHeaders()` non défini dans les headers du submit (ReferenceError potentiel)

---

## Architecture technique

### Frontend (`/app/frontend/src/`)
```
├── App.js                          # Routeur principal
├── config/constants.js             # Configuration centralisée
├── context/                        # AuthContext, ModalContext, AdminThemeContext
├── services/authService.js         # API calls auth
├── components/
│   ├── layout/                     # Navigation, Footer
│   ├── sections/                   # Hero, Services, Contact, etc.
│   ├── modals/                     # DevisModal
│   ├── dashboard/DashboardLayout.js
│   ├── admin/
│   │   ├── AdminLayout.js          # Layout admin avec thème
│   │   └── AdminModal.js           # Composant modal réutilisable (+ utilitaires)
│   └── NotificationsPopup.js       # Popup notifications
├── pages/
│   ├── admin/                      # AdminDashboard, AdminPortfolioValidation, etc.
│   ├── developer/                  # DeveloperDashboard, DeveloperBook, DeveloperMessages
│   ├── commercial/                 # CommercialDashboard
│   ├── MembersPage.js              # Liste membres publique
│   └── MemberDetailPage.js         # Fiche membre publique
```

### Backend (`/app/backend/`)
```
├── server.py                       # FastAPI principal
├── config/settings.py              # Constantes (UserRole, UserStatus)
├── middleware/auth.py              # JWT, RoleChecker
├── routes/
│   ├── auth.py                     # Authentification
│   ├── admin/                      # Module admin (refactoré)
│   │   ├── __init__.py             # Routeur principal
│   │   ├── users.py                # Gestion utilisateurs
│   │   ├── portfolio.py            # Validation portfolios
│   │   └── stats.py                # Stats, logs, contacts
│   ├── projects.py                 # Projets du Syndicat
│   ├── announcements.py            # Annonces
│   ├── alerts.py                   # Alertes
│   ├── subscriptions.py            # Abonnements
│   ├── partners.py                 # Partenaires
│   ├── profile.py                  # Profil + Portfolio développeur
│   ├── members.py                  # Routes publiques membres
│   ├── messages.py                 # Messagerie membres
│   └── notifications.py            # Notifications personnelles
└── uploads/                        # Fichiers uploadés
```

---

## Collections MongoDB (DB: syndicat_base)

| Collection | Description |
|------------|-------------|
| users | Utilisateurs (email, password_hash, role, status) |
| profiles | Profils développeurs (bio, skills, photo) |
| portfolio | Projets portfolio (status, is_adult_content, rejection_reason) |
| user_subscriptions | Abonnements actifs |
| subscription_plans | Plans d'abonnement |
| projects | Projets/missions du Syndicat |
| announcements | Annonces |
| alerts | Alertes/Popups |
| partners | Partenaires |
| messages | Messages visiteur → développeur |
| notifications | Notifications personnelles |
| contacts | Demandes de contact/devis |
| admin_logs | Historique actions admin |

---

## Endpoints API principaux

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/choose-role` - Choix rôle
- `POST /api/auth/forgot-password` - Demande reset
- `POST /api/auth/reset-password` - Reset mot de passe

### Admin
- `GET /api/admin/stats` - Statistiques avancées
- `GET /api/admin/users` - Liste utilisateurs
- `GET /api/admin/portfolio/pending` - Portfolio en attente
- `PUT /api/admin/portfolio/{id}/approve` - Approuver
- `PUT /api/admin/portfolio/{id}/reject` - Rejeter (+ notification)

### Profil & Portfolio
- `GET/PUT /api/profile` - Profil développeur
- `POST /api/profile/photo` - Upload photo
- `GET/POST/PUT/DELETE /api/profile/portfolio` - CRUD portfolio (avec is_adult_content)

### Membres publics
- `GET /api/members` - Liste membres actifs
- `GET /api/members/{id}` - Détail membre

### Messagerie
- `POST /api/messages/{recipient_id}` - Envoyer message
- `GET /api/messages` - Messages reçus (dev)

### Notifications
- `GET /api/notifications/popup` - Notifications à afficher
- `PUT /api/notifications/popup/{id}/dismiss` - Fermer popup

---

## Audit technique (déc. 2025)
- Rapport CTO complet sauvegardé dans **`/app/AUDIT_TECHNIQUE.md`** (à transmettre au prochain fork).
- Synthèse : projet NON prêt pour la production. Bloquants P0 = chemins absolus codés en dur, `DEV_MODE`/identifiants en clair, uploads exposés publiquement (`/uploads`), absence de rate-limiting auth.
- Aucune Phase de correction n'a été démarrée. Attendre l'instruction explicite du client (consignes strictes : KISS/DRY/Zéro Hardcoding/aucun test sans accord).

## Tâches à venir

### P1 - Intégration Stripe
- Activer les paiements réels pour les abonnements
- En attente des clés API utilisateur

### P2 - Améliorations Portail Client
- Étendre les fonctionnalités du portail client original

### P3 - CRM
- Exploiter les soumissions du formulaire de contact

---

## Credentials de test
- **Admin** : admin@syndicatducode.fr / AdminSyndicat2025!
- **Développeur** : test@syndicatducode.fr / TestPassword123!

---

## Notes importantes
- **Paiement Stripe** : Actuellement **MOCKED** (simulation)
- **Footer** : Contient des boutons quick-login pour dev uniquement (à supprimer en prod)

---

## ⚠️ NOTE RÉGLEMENTAIRE — Facturation Électronique Obligatoire (e-invoicing)

**Contexte :** Réforme française B2B (Ordonnance n° 2021-1190) — entrée en vigueur **septembre 2026**.

**Impact sur la plateforme :**
- L'upload PDF/Excel actuel (`/invoices/submit`) ne suffira plus pour les flux B2B légaux
- Les factures devront transiter via une **PDP agréée** ou le **PPF (Portail Public de Facturation)**
- Format structuré requis : **Factur-X** (PDF/A-3 + XML), UBL ou CII

**Calendrier :**
- Sept. 2026 : Réception obligatoire pour TOUS
- Sept. 2026 : Émission obligatoire pour les grandes entreprises
- Sept. 2027 : Émission obligatoire pour PME / TPE / micro

**Actions à prévoir :**
1. Choisir un PDP partenaire (Chorus Pro, Yooz, etc.)
2. Adapter le workflow de soumission pour générer du Factur-X
3. Mettre en place l'e-reporting (données TVA)
4. Archivage légal 10 ans

**Statut :** 🟡 À planifier — ne pas démarrer sans accord explicite

---

*Dernière mise à jour : 08/03/2026*

---

## La Citadelle Numérique — Projet intégré (02/06/2026)

### Phase A — Socle technique (TERMINÉ 02/06/2026)
- Frontend Citadelle intégré sous `/citadelle` dans l'app React existante
- Charte graphique officielle (Bleu #0F2747, Or #C9A45C, Montserrat + Inter)
- Auth indépendante : `/api/citadelle/auth/` avec `platform: "citadelle"` (isolation stricte)
- Page d'accueil (Hero, Catégories, Comment ça marche, Services, CTA)
- Pages Connexion + Inscription
- Espace membre (stub)
- Menu admin "La Citadelle Numérique" dans le back-office Syndicat
- Index MongoDB `citadelle_listings` + `citadelle_transactions`

### Phase B — Marketplace Annonces (TERMINÉ 02/06/2026)
- CRUD annonces complet (backend : create, read, update, delete, admin validate/reject/feature)
- Workflow validation admin (pending → active → rejected)
- Pages publiques : liste avec filtres/recherche/pagination + détail annonce
- Espace membre : créer (formulaire 4 étapes), voir mes annonces, modifier une annonce
- Interface admin Citadelle : tableau de bord + page dédiée annonces (validation/rejet/mise en avant)
- Menu admin latéral enrichi (section Citadelle Numérique avec lien Annonces)
- Correction race condition auth (CitadelleMyListings, CitadelleEditListing)
- Alignement slugs CITADELLE_CATEGORIES avec LISTING_TYPES backend

### Phase C — Transactions & Messagerie (À FAIRE — nécessite Stripe réel)
### Phase D — Services, Avis & Blog (À FAIRE)
### Phase E — Statistiques & SEO (À FAIRE)

### Fichiers de référence Citadelle
- `/app/memory/CITADELLE_CHARTE_GRAPHIQUE.md` — Charte visuelle complète
- `/app/memory/CITADELLE_ARCHITECTURE.md` — Architecture technique validée
- `/app/backend/routes/citadelle/` — Routes backend Citadelle
- `/app/frontend/src/pages/citadelle/` — Pages frontend Citadelle
- `/app/frontend/src/components/citadelle/` — Composants Citadelle
- `/app/frontend/src/config/citadelleConstants.js` — Config et constantes
