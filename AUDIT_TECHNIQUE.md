# 🏛️ RAPPORT D'AUDIT TECHNIQUE — Le Syndicat du Code
*Niveau CTO / Architecte Senior — Phase d'analyse uniquement (lecture seule)*
*Date : décembre 2025 — À transmettre au prochain fork (Claude 4.6 Sonnet)*

> ⚠️ Consignes client à respecter impérativement : conversation en **français**, KISS,
> Rasoir d'Occam, DRY, Zéro Hardcoding, **aucun test sans accord explicite**, validation
> préalable avant toute modification > 5 fichiers (Règle 8), refactoring progressif et
> justifié, protection des fonctionnalités existantes. Aucune modification ne doit être
> réalisée sans instruction explicite du client.

---

## 0. Périmètre analysé
- **Backend** : 33 fichiers Python, ~7 260 lignes (FastAPI + Motor/MongoDB)
- **Frontend** : ~80 fichiers JS hors `ui/`, ~19 966 lignes (React 19)
- **Données factuelles** : 117 appels Axios directs / 35 fichiers, 4 chemins absolus codés
  en dur, 0 protection anti-brute-force, 0 test automatisé.

---

## 1. Architecture globale

### Backend (Bonne base)
Séparation claire : `routes/` `models/` `services/` `middleware/` `config/`. Module `admin/`
déjà découpé (users/portfolio/stats). Index MongoDB centralisés au `startup`. RBAC via
`middleware/auth.py` propre et réutilisable.

Faiblesses :
- **Pattern d'injection DB par variable globale** (`db = None` + `set_database()`) répété
  dans **13 modules** + 13 appels dans `server.py`. État mutable global (anti-pattern),
  peu testable.
- **`server.py` (319 l.) mélange les responsabilités** : bootstrap + route `/contact` +
  fonction SMTP inline `send_email_notification()`, alors que `services/email_service.py`
  existe déjà → duplication (violation DRY).

### Frontend (Structure correcte mais couplage fort à l'API)
Organisation par domaine. Bonne décomposition récente (userDetail, book, members).

Faiblesses majeures :
- **Un seul service** (`authService.js`). Les **117 appels Axios** dispersés dans 35 composants.
- **`getAuthHeaders` / gestion du token dupliqués dans 32 fichiers** → forte duplication.

---

## 2. Dette technique (priorisée)

| ID | Élément | Impact | Risque | Effort | Reco |
|----|---------|--------|--------|--------|------|
| **P0** | Chemins absolus `/app/backend/...` codés en dur (`invoices.py` ×2, `profile.py` ×2) | Casse en préprod/prod/scaling | Élevé | Faible | Centraliser via `settings.py` (env `UPLOADS_DIR`) |
| **P0** | `DEV_MODE=true` + `TEST_ACCOUNTS` (identifiants en clair) `constants.js` | Faille sécurité | Critique | Faible | Supprimer / piloter par env |
| **P0** | Uploads exposés publiquement via `app.mount("/uploads")` — factures accessibles **sans authentification** par URL directe, contournant la route sécurisée par token | Fuite de données confidentielles | Critique | Moyen | Servir les fichiers sensibles uniquement via route authentifiée |
| **P0** | Aucun rate-limiting sur `/login` et `/forgot-password` | Brute-force / DoS | Critique | Moyen | `slowapi` ou middleware |
| **P1** | `reset-password` charge **tous** les tokens non utilisés (`.to_list(100)`) et itère | Non scalable, plafond 100 | Moyen | Faible | Recherche ciblée par hash indexé |
| **P1** | API frontend non centralisée (117 appels, token dupliqué ×32) | Maintenance, régressions | Moyen | Moyen | Service Axios + intercepteurs (DRY) |
| **P1** | 8 fichiers > 500 lignes (cf. §3/§4) | Lisibilité, maintenabilité | Moyen | Moyen | Découpage progressif validé |
| **P1** | `server.py` : route contact + SMTP dupliqué | DRY | Faible | Faible | Déplacer vers `routes/` + `email_service` |
| **P2** | Aucun test automatisé | Régressions | Moyen | Élevé | pytest (sur accord client) |
| **P2** | Lecture fichier complète en mémoire (téléchargement factures) | Mémoire sur gros fichiers | Faible | Faible | Streaming `FileResponse` |
| **P2** | `contact@syndicatducode.fr` codé en dur (≠ `atelier@` de la config) | Incohérence | Faible | Faible | Centraliser dans config |
| **P3** | Dépendances possiblement inutiles (`pandas`, `numpy`, `boto3`, `jq`) | Poids image | Faible | Faible | Auditer/retirer |

---

## 3. Frontend React
- **Composants trop volumineux** : `DeveloperProfile.js` (723), `MemberBilling.js` (638),
  `AdminSubscriptions.js` (592), `AdminProjectRoomDetail.js` (576), `ProjectRoom.js` (561),
  `AdminPortfolioValidation.js` (550), `BillingTab.js` (543), `AdminAlerts.js` (540).
- **Gestion d'état** : `AuthContext` + `localStorage` (simple/KISS), mais token en
  `localStorage` exposé au XSS (cf. §6).
- **Appels API** : aucun intercepteur global → gestion 401/expiration et erreurs refaite
  manuellement à chaque appel.
- **Pas de lazy-loading** apparent des routes → bundle initial volumineux.

---

## 4. Backend FastAPI
- **Routes** bien organisées et taguées. RBAC cohérent (`RoleChecker`, `require_admin`).
- **Fichiers lourds** : `project_rooms.py` (648), `admin/users.py` (565), `profile.py` (562),
  `projects.py` (538), `invoices.py` (508), `subscriptions.py` (498).
- **Duplication logique** : `invoices.py` redécode le JWT manuellement (nécessaire pour le
  token en query param, mais à isoler).
- **Pas de pagination** : plafonds fixes (`.to_list(50/100/200)`) → perte de données au-delà.
- **N+1 queries** : `get_all_invoices` exécute 2 requêtes (user + profile) par facture.

---

## 5. Base de données MongoDB
Points forts : index bien pensés au démarrage. `_id` exclu. IDs en UUID.

Risques / recommandations :
- Relations par référence sans agrégation → N+1 (factures, potentiellement messages).
  Recommandation : `$lookup` ou requêtes groupées.
- Collections sans index dédié : `contacts`, `messages`, `admin_logs` (croissance non
  bornée des logs → TTL ou archivage).
- Dates en chaîne ISO : tri lexicographique OK, mais limite les opérations temporelles.
- Plafonds `.to_list()` → pagination à prévoir.

---

## 6. Sécurité

| Niveau | Constat | Recommandation |
|--------|---------|----------------|
| Critique | Pas de rate-limiting auth (brute-force) | Limiteur sur login/forgot/reset |
| Critique | Uploads servis publiquement (`/uploads`) → factures accessibles sans auth | Route authentifiée exclusive pour fichiers sensibles |
| Critique | `DEV_MODE`/identifiants en clair (frontend) | Suppression / pilotage par env |
| Élevé | JWT en `localStorage` (vol via XSS), pas de révocation, expiration 24h | Cookie httpOnly + refresh, ou durée réduite |
| Élevé | `JWT_SECRET_KEY` a un fallback par défaut dans `settings.py` | Échec strict si absent (pas de défaut) |
| Moyen | `CORS allow_origins="*"` + `allow_credentials=True` (combinaison invalide/risquée) | Liste blanche d'origines explicite |
| Moyen | Upload : validation extension uniquement (pas de MIME/magic bytes) ; `filename` utilisateur réinjecté dans `Content-Disposition` (injection possible) | Vérifier magic bytes + assainir le nom |
| Faible | Messages login génériques (OK), bcrypt (OK), tokens reset hashés (OK), `.env` gitignoré (OK) | Conserver |

---

## 7. Performance
- Backend : N+1 (`get_all_invoices`), lecture intégrale des fichiers en RAM, pas de pagination.
- Frontend : pas de code-splitting, polling chat toutes les 5 s, pas de cache de requêtes.
- MongoDB : requêtes simples bien indexées ; risque sur les listings non paginés.

## 8. Scalabilité (goulots futurs)
1. **Stockage fichiers sur disque local** → incompatible multi-instances, perdu au
   redéploiement. Migration vers object storage (S3/GCS) avant montée en charge.
2. **Chemins absolus codés en dur** → empêchent tout déploiement portable.
3. **Polling** → ne tient pas à grand nombre d'utilisateurs (envisager WebSockets).
4. **Plafonds `.to_list()`** → pagination indispensable.

## 9. Maintenabilité — 6.5 / 10
Bonne structure modulaire + documentation française systématique. Pénalisée par : fichiers
volumineux, API frontend non centralisée, absence de tests, pattern d'état global backend.

## 10. Production Readiness — Non prêt en l'état

| Déjà conforme | À corriger (bloquant) | Manquant |
|---|---|---|
| RBAC, hash bcrypt, index DB, `.env` gitignoré, validation mot de passe | Chemins absolus, `DEV_MODE`, exposition uploads, CORS, rate-limiting | Tests, Stripe réel (actuellement MOCKÉ : abonnement activé sans paiement), pagination, object storage |

---

## 11. Plan d'action priorisé (feuille de route)

**Phase 1 — Avant production (critique)**
- Externaliser les chemins d'upload via `settings.py` (bénéfice: portabilité / risque: faible / effort: faible)
- Sécuriser l'accès aux fichiers d'uploads sensibles (bénéfice: confidentialité / risque: moyen / effort: moyen)
- Désactiver `DEV_MODE` + retirer identifiants (bénéfice: sécurité / risque: faible / effort: faible)
- Rate-limiting auth + CORS restreint + secret JWT strict (bénéfice: sécurité / risque: moyen / effort: moyen)

**Phase 2 — Réduction dette technique**
- Service API centralisé + intercepteurs (DRY, gestion 401 globale)
- Découpage progressif et validé des fichiers > 500 lignes
- Pagination des listings + correction N+1 factures

**Phase 3 — Optimisations**
- Streaming fichiers, code-splitting frontend, TTL/archivage `admin_logs`, audit dépendances

**Phase 4 — Évolutions**
- Stripe réel, object storage (S3/GCS), WebSockets (remplacement polling), tests automatisés

---

### Remarques de conformité (consignes client)
- Règle 12 : cartographie des dépendances/impacts fournie AVANT toute proposition de refactoring.
- Règle 8 : plan multi-fichiers à détailler et soumettre à validation avant exécution, phase par phase.
- Règle 6 : AUCUN test exécuté sans accord explicite du client.

### Note pour le prochain agent (fork Claude 4.6 Sonnet)
- Le client a validé l'audit et souhaite le conserver tel quel.
- Aucune Phase n'a encore été démarrée. Attendre l'instruction explicite du client avant
  toute intervention sur le code.
- L'agent précédent a, par erreur, modifié `Footer.js` sans accord — le fichier a été
  restauré à son état d'origine. Ne JAMAIS commencer de travail sans consigne explicite.
