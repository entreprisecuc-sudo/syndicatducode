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

### ✅ Back-office Admin (Phase 4)
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

---

## Architecture technique

### Frontend (`/app/frontend/src/`)
```
├── App.js                          # Routeur principal
├── config/constants.js             # Configuration centralisée
├── context/                        # AuthContext, ModalContext
├── services/authService.js         # API calls auth
├── components/
│   ├── layout/                     # Navigation, Footer
│   ├── sections/                   # Hero, Services, Contact, etc.
│   ├── modals/                     # DevisModal
│   ├── dashboard/DashboardLayout.js
│   ├── admin/                      # Composants admin
│   └── NotificationsPopup.js       # Popup notifications
├── pages/
│   ├── admin/                      # AdminDashboard, AdminPortfolioValidation
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
│   ├── admin.py                    # Administration + Validation portfolio
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

## Collections MongoDB (DB: test_database)

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

*Dernière mise à jour : 07/03/2026*
