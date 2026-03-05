# Le Syndicat du Code - PRD

## Informations générales
- **Nom du projet** : Le Syndicat du Code
- **Slogan** : Notre loi, unis par le code.
- **Type** : Site vitrine professionnel pour une société de développement web
- **Déployé sur** : VPS Hostinger (187.77.168.109) - https://syndicatducode.fr

## Fonctionnalités principales

### ✅ Implémentées
1. **Landing Page** : Hero, Services (6), Pourquoi nous, Notre approche, Audiences cibles, Contact
2. **Formulaire de contact** : Avec upload de fichiers, envoi email SMTP
3. **Modal de devis** : Accessible depuis toute la navigation
4. **Pages légales** : CGV, CGU, RGPD
5. **Page recrutement** : "Rejoindre le Syndicat"
6. **Responsive** : Mobile, Tablette, Desktop

### 📋 Backlog (P1)
- **Espace Client** : Portail avec login, suivi de projets, messagerie, partage de fichiers

### 📋 Backlog (P2)
- **CRM** : Gestion des contacts et leads basée sur les soumissions du formulaire

---

## Architecture technique

### Stack
- **Frontend** : React 18, TailwindCSS, React Router DOM
- **Backend** : FastAPI (Python), Motor (MongoDB async)
- **BDD** : MongoDB
- **Email** : SMTP (Hostinger)

### Structure du code (après refactoring du 17/12/2025)

```
/app/frontend/src/
├── App.js                      # Routeur principal (62 lignes)
├── config/
│   └── constants.js            # Configuration centralisée
├── context/
│   └── ModalContext.js         # Contexte du modal
├── hooks/
│   └── useContactForm.js       # Hook formulaire réutilisable (DRY)
├── components/
│   ├── layout/
│   │   ├── Navigation.js       # Barre de navigation
│   │   └── Footer.js           # Pied de page
│   ├── sections/
│   │   ├── HeroSection.js
│   │   ├── ServicesSection.js
│   │   ├── WhyUsSection.js
│   │   ├── ProcessSection.js
│   │   ├── AudienceSection.js
│   │   └── ContactSection.js
│   └── modals/
│       └── DevisModal.js
└── pages/
    ├── HomePage.js
    ├── CGV.js, CGU.js, RGPD.js, Rejoindre.js
```

### Backend
```
/app/backend/
├── server.py                   # API FastAPI (endpoint /api/contact)
├── uploads/                    # Fichiers uploadés
└── .env                        # Variables d'environnement
```

---

## API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/contact | Soumission formulaire avec fichiers |
| GET | /api/contacts | Liste des contacts (admin) |
| GET | /api/config | Configuration publique |

---

## Changelog

### 17/12/2025 - Phase 2 : Frontend Authentification
- **TERMINÉ** : Pages d'authentification complètes
- Pages : Login, Register, ForgotPassword, ResetPassword, ChooseRole
- AuthContext pour gestion état global
- authService pour appels API
- ProtectedRoute, PublicRoute, RoleRoute pour protection routes
- Validation mot de passe en temps réel
- 100% responsive (mobile-first)
- Redirection automatique selon état utilisateur

### 17/12/2025 - Phase 1 : Backend Authentification
- **TERMINÉ** : Système d'authentification complet
- Endpoints : register, login, choose-role, forgot-password, reset-password, /me
- JWT avec expiration 24h
- Hash bcrypt pour les mots de passe
- Validation mot de passe (8 chars, majuscule, minuscule, chiffre)
- Token de réinitialisation sécurisé (1h, usage unique)
- Architecture modulaire (config, models, services, middleware, routes)

### 17/12/2025 - Refactoring Frontend
- **TERMINÉ** : Refactoring complet de App.js (859 → 62 lignes)
- Création de 13 nouveaux fichiers modulaires
- Hook `useContactForm` partagé (principe DRY)
- Configuration centralisée dans `constants.js`
- Tests visuels OK (Hero, Modal, Services, Pages légales)

---

## Notes de déploiement

Le site est déployé sur le VPS de l'utilisateur. Pour mettre à jour :
```bash
ssh root@187.77.168.109
cd /var/www/syndicatducode.fr
git pull origin main
cd frontend && yarn build
sudo systemctl restart nginx
```
