# Registre des Tests - Le Syndicat du Code

Ce document recense tous les tests existants et à implémenter pour le projet.

---

## Légende des statuts

| Statut | Description |
|--------|-------------|
| ✅ Validé | Test implémenté et fonctionnel |
| 🔄 En place | Test existant mais non validé |
| ⏳ À faire | Test à implémenter |
| ❌ Supprimé | Fonctionnalité retirée |

---

## 1. Tests Backend (API)

### 1.1 Authentification (`/api/auth`)

| Fonctionnalité | Description du test | Type | Statut |
|----------------|---------------------|------|--------|
| Inscription | POST /api/auth/register - Créer un compte | Intégration | ⏳ À faire |
| Connexion | POST /api/auth/login - Authentifier et retourner JWT | Intégration | ⏳ À faire |
| Choix de rôle | POST /api/auth/choose-role - Assigner rôle après inscription | Intégration | ⏳ À faire |
| Mot de passe oublié | POST /api/auth/forgot-password - Envoyer email reset | Intégration | ⏳ À faire |
| Reset mot de passe | POST /api/auth/reset-password - Modifier le mot de passe | Intégration | ⏳ À faire |

### 1.2 Administration (`/api/admin`)

| Fonctionnalité | Description du test | Type | Statut |
|----------------|---------------------|------|--------|
| Liste utilisateurs | GET /api/admin/users - Récupérer tous les utilisateurs | Intégration | ⏳ À faire |
| Détail utilisateur | GET /api/admin/users/{id} - Récupérer un utilisateur | Intégration | ⏳ À faire |
| Modifier statut | PUT /api/admin/users/{id}/status - Activer/Suspendre | Intégration | ⏳ À faire |
| Modifier rôle | PUT /api/admin/users/{id}/role - Changer le rôle | Intégration | ⏳ À faire |
| Statistiques | GET /api/admin/stats - Stats globales | Intégration | ⏳ À faire |
| Logs admin | GET /api/admin/logs - Historique des actions | Intégration | ⏳ À faire |
| Portfolio en attente | GET /api/admin/portfolio/pending - Projets à valider | Intégration | ⏳ À faire |
| Approuver portfolio | PUT /api/admin/portfolio/{id}/approve | Intégration | ⏳ À faire |
| Rejeter portfolio | PUT /api/admin/portfolio/{id}/reject | Intégration | ⏳ À faire |
| Détail complet user | GET /api/admin/users/{id}/full | Intégration | ⏳ À faire |
| Historique activité | GET /api/admin/users/{id}/activity | Intégration | ⏳ À faire |

### 1.3 Projets (`/api/projects`)

| Fonctionnalité | Description du test | Type | Statut |
|----------------|---------------------|------|--------|
| Liste projets | GET /api/projects - Récupérer les projets ouverts | Intégration | ⏳ À faire |
| Créer projet (admin) | POST /api/projects - Créer une mission | Intégration | ⏳ À faire |
| Postuler | POST /api/projects/{id}/apply - Soumettre candidature | Intégration | ⏳ À faire |

### 1.4 Profil & Portfolio (`/api/profile`)

| Fonctionnalité | Description du test | Type | Statut |
|----------------|---------------------|------|--------|
| Récupérer profil | GET /api/profile - Profil développeur connecté | Intégration | ⏳ À faire |
| Modifier profil | PUT /api/profile - Mettre à jour les infos | Intégration | ⏳ À faire |
| Upload photo | POST /api/profile/photo - Envoyer avatar | Intégration | ⏳ À faire |
| CRUD portfolio | GET/POST/PUT/DELETE /api/profile/portfolio | Intégration | ⏳ À faire |
| Contenu +18 | Vérifier champ is_adult_content sur portfolio | Intégration | ⏳ À faire |

### 1.5 Membres publics (`/api/members`)

| Fonctionnalité | Description du test | Type | Statut |
|----------------|---------------------|------|--------|
| Liste membres | GET /api/members - Développeurs avec abonnement actif | Intégration | ⏳ À faire |
| Détail membre | GET /api/members/{id} - Fiche membre publique | Intégration | ⏳ À faire |

### 1.6 Messagerie (`/api/messages`)

| Fonctionnalité | Description du test | Type | Statut |
|----------------|---------------------|------|--------|
| Envoyer message | POST /api/messages/{recipient_id} | Intégration | ⏳ À faire |
| Messages reçus | GET /api/messages - Liste des messages (dev) | Intégration | ⏳ À faire |

### 1.7 Notifications (`/api/notifications`)

| Fonctionnalité | Description du test | Type | Statut |
|----------------|---------------------|------|--------|
| Notifications popup | GET /api/notifications/popup - À afficher | Intégration | ⏳ À faire |
| Fermer popup | PUT /api/notifications/popup/{id}/dismiss | Intégration | ⏳ À faire |

### 1.8 Abonnements (`/api/subscriptions`)

| Fonctionnalité | Description du test | Type | Statut |
|----------------|---------------------|------|--------|
| Liste plans | GET /api/subscriptions/plans | Intégration | ⏳ À faire |
| Souscrire (mock) | POST /api/subscriptions/subscribe | Intégration | ⏳ À faire |
| Admin - stats | GET /api/subscriptions/admin/stats | Intégration | ⏳ À faire |
| Admin - CRUD plans | POST/PUT/DELETE /api/subscriptions/admin/plans | Intégration | ⏳ À faire |

### 1.9 Alertes & Annonces

| Fonctionnalité | Description du test | Type | Statut |
|----------------|---------------------|------|--------|
| Alertes admin CRUD | /api/alerts/admin/* | Intégration | ⏳ À faire |
| Annonces admin CRUD | /api/announcements/admin/* | Intégration | ⏳ À faire |
| Partenaires admin CRUD | /api/partners/admin/* | Intégration | ⏳ À faire |

---

## 2. Tests Frontend (Composants)

### 2.1 Pages publiques

| Fonctionnalité | Description du test | Type | Statut |
|----------------|---------------------|------|--------|
| Landing Page | Affichage Hero, Services, Contact | Fonctionnel | ⏳ À faire |
| Page Membres | Liste des développeurs abonnés | Fonctionnel | ⏳ À faire |
| Détail Membre | Fiche avec book (contenu +18 flouté) | Fonctionnel | ⏳ À faire |
| Modal Devis | Ouverture et soumission formulaire | Fonctionnel | ⏳ À faire |

### 2.2 Authentification

| Fonctionnalité | Description du test | Type | Statut |
|----------------|---------------------|------|--------|
| Formulaire connexion | Validation et soumission | Fonctionnel | ⏳ À faire |
| Formulaire inscription | Création compte | Fonctionnel | ⏳ À faire |
| Choix de rôle | Sélection commercial/developer | Fonctionnel | ⏳ À faire |
| Redirection après login | Selon le rôle | Fonctionnel | ⏳ À faire |

### 2.3 Dashboard Développeur

| Fonctionnalité | Description du test | Type | Statut |
|----------------|---------------------|------|--------|
| Affichage stats | Cards de statistiques | Fonctionnel | ⏳ À faire |
| Book/Portfolio | CRUD des projets | Fonctionnel | ⏳ À faire |
| Checkbox +18 | Marquer contenu adulte | Fonctionnel | ⏳ À faire |
| Messages | Liste et lecture des messages | Fonctionnel | ⏳ À faire |
| Notification rejet | Popup si projet rejeté | Fonctionnel | ⏳ À faire |

### 2.4 Dashboard Commercial

| Fonctionnalité | Description du test | Type | Statut |
|----------------|---------------------|------|--------|
| Affichage dashboard | Stats et actions | Fonctionnel | ⏳ À faire |

### 2.5 Admin

| Fonctionnalité | Description du test | Type | Statut |
|----------------|---------------------|------|--------|
| Dashboard admin | Stats avancées | Fonctionnel | ⏳ À faire |
| Gestion utilisateurs | Liste et actions | Fonctionnel | ⏳ À faire |
| Détail utilisateur | 5 onglets (Profil, Historique, Documents, Book, Abonnement) | Fonctionnel | ⏳ À faire |
| Validation portfolio | Approuver/Rejeter avec motif | Fonctionnel | ⏳ À faire |
| Mode sombre/clair | Toggle et persistance localStorage | Fonctionnel | ⏳ À faire |
| Modal Admin (composant) | Ouverture/Fermeture cohérente | Fonctionnel | ⏳ À faire |
| Gestion alertes | CRUD via modal | Fonctionnel | ⏳ À faire |
| Gestion annonces | CRUD via modal | Fonctionnel | ⏳ À faire |
| Gestion partenaires | CRUD via modal | Fonctionnel | ⏳ À faire |
| Gestion abonnements | Plans et configuration Stripe | Fonctionnel | ⏳ À faire |

---

## 3. Tests de sécurité

| Fonctionnalité | Description du test | Type | Statut |
|----------------|---------------------|------|--------|
| Protection routes | Accès refusé sans JWT valide | Sécurité | ⏳ À faire |
| Vérification rôle | Admin seul accède à /syndicat-admin | Sécurité | ⏳ À faire |
| Injection SQL | Inputs nettoyés côté backend | Sécurité | ⏳ À faire |
| XSS | Contenu échappé côté frontend | Sécurité | ⏳ À faire |

---

## 4. Tests de performance

| Fonctionnalité | Description du test | Type | Statut |
|----------------|---------------------|------|--------|
| Chargement page | < 3s pour landing page | Performance | ⏳ À faire |
| API response time | < 500ms pour endpoints critiques | Performance | ⏳ À faire |

---

## 5. Historique des modifications

| Date | Action | Détails |
|------|--------|---------|
| 2026-03-07 | Création | Registre initial créé |
| 2026-03-07 | Refactoring | AdminModal centralisé, modales admin refactorées |

---

*Dernière mise à jour : 07/03/2026*
