# Le Syndicat du Code + La Citadelle Numérique — PRD

## Informations générales
- **Nom** : Le Syndicat du Code + La Citadelle Numérique
- **Stack** : React + FastAPI + MongoDB
- **Architecture** : 1 Backend, 1 DB, 2 Frontends (Syndicat + Citadelle)

---

## 📊 Session 09/07/2026 — Analytics Admin LOT 1 (PREVIEW)
- **Besoin client** : tableau de bord de fréquentation dans l'admin. LOT 1 choisi : visiteurs uniques, pages vues, utilisateurs actifs, courbe temporelle, top pages, conversations entamées par annonce. Sans géoloc (reporté). IP hachée (RGPD). Périmètre : Citadelle + Syndicat.
- **Backend** : nouveau `routes/citadelle/analytics.py` (enregistré dans `__init__.py`). Collection `citadelle_analytics_events` `{session_id, path, referrer, ip_hash, user_id, is_authenticated, device, scope, created_at}`. Endpoints : `POST /api/citadelle/analytics/track` (public, filtre bots + admin, IP hachée avec sel = JWT_SECRET_KEY), `GET /admin/analytics/overview|timeseries|top-pages|listings-engagement` (protégés `require_admin`). Paramètres `period` (24h/7d/30d/90d) + `scope` (all/citadelle/syndicat).
- **Frontend** : `components/AnalyticsTracker.jsx` monté globalement dans `App.js` (envoie une vue à chaque navigation via `citadelleApi`, session_id en sessionStorage, exclut l'admin). Page `pages/admin/AdminCitadelleAnalytics.js` (route `/syndicat-admin/citadelle/analytics`, lien menu « Statistiques » dans `AdminLayout.js`) : 6 cartes KPI + graphique recharts (AreaChart vues/visiteurs) + top pages + engagement annonces + sélecteurs période/périmètre.
- **RGPD** : IP hachée (jamais en clair), pas de cookie (sessionStorage). Mention ajoutée dans `CitadelleConfidentialite.js` (« Mesure d'audience interne sans cookie »). Note : le site a déjà Google Analytics (G-RDFNQ5EGB3), ce tableau interne le complète.
- **Testé (muet, Règle 6)** : curl end-to-end (track UA navigateur → events stockés → KPIs/top-pages/timeseries corrects) + screenshot page admin (6 KPI, filtres, graphique, tableaux OK). Events de test nettoyés.
- **RESTE — LOT 2** (à faire sur demande) : géolocalisation (pays/ville), durée moyenne de session, parcours détaillés des visiteurs.
- **⚠️ NON DÉPLOYÉ SUR LE VPS** : Save to Github → `git pull` → `yarn build` → `pm2 restart syndicat-backend` (aucun seed requis).

---


## 🔧 Session 07/07/2026 — Page hub « Les Parutions » (PREVIEW)
- **Besoin client** : regrouper Blog + Guides + Chroniques sous un seul lien de nav « Les Parutions » → page hub présentant les 3 rubriques, avec les 3 dernières parutions **publiées** de chacune, redirection vers chaque page, inscription newsletter, UX élégante et responsive (agent UX consulté).
- **Nav** (`config/citadelleConstants.js`) : les 3 liens Blog/Guides/Chroniques remplacés par un seul `{ href: "/citadelle/parutions", label: "Les Parutions" }` (impacte desktop + mobile via `CitadelleLayout`). Les pages `/citadelle/blog|guides|chroniques` restent autonomes (redirection depuis le hub).
- **Nouvelle page** `pages/citadelle/CitadelleParutions.js` (route `/citadelle/parutions` dans `App.js`) — REFONTE lisibilité « above the fold » : (1) **Carrousel** des 6 derniers articles en haut (image + panneau navy, autoplay 6s, flèches + points dorés) ; (2) **titre léger** centré ; (3) **2 colonnes** — Le Guide de La Citadelle (gauche, émeraude) & Les Chroniques de La Garde (droite, nuit/or), chacune affichant la **dernière parution avec son image** (publié, sinon teaser « Prochaine parution » daté) ; (4) bouton « Voir tout le blog ». Composants internes DRY `ArticlesCarousel`, `RubriqueColumn`. Cartes → `/citadelle/blog/:slug`. Réutilise `NewsletterSection`. SEO Helmet.
- **Données** : fetch parallèle `GET /blog?limit=3` (blog, exclut premium), `?category=guide-la-citadelle&limit=3`, `?category=chroniques-la-garde&limit=3` + `GET /blog/next-scheduled` pour les rubriques sans publié (teaser « Prochaine parution à venir »). Aucun changement backend.
- **Blueprint UX** : `/app/design_guidelines.json` (généré par design_agent).
- **Testé (muet, Règle 6)** : screenshots desktop + mobile — 5 sections présentes, 3 cartes blog publiées, 2 états vides (Guides/Chroniques encore programmés) avec teaser daté. Responsive (mobile-first `grid-cols-1 md:grid-cols-3`). Compilation OK.
- **⚠️ NON DÉPLOYÉ SUR LE VPS** : Save to Github → `git pull` → `yarn build` → `pm2 restart syndicat-backend` (aucun seed requis).

---


## 🔧 Session 07/07/2026 — Choix vendeur : URL publique ou confidentielle (PREVIEW)
- **Besoin client** : laisser le vendeur choisir de rendre l'URL de son actif publique sur l'annonce, ou la garder confidentielle. Si confidentielle → message cohérent (URL communiquée à l'acheteur seulement à la manifestation d'un intérêt sérieux / entame du processus de vente).
- **Backend** (`routes/citadelle/listings.py`) : nouveau champ `url_public` (bool, défaut False) sur `ListingCreate`/`ListingUpdate` ; stocké à la création (`False` si contenu adulte) et forcé à `False` si passage en adulte à l'update. `get_listing` (détail public) ne renvoie `url_preview` **que si** `url_public` est True (pop conditionnel → jamais de fuite). Projection `/listings/my` : `url_preview` désormais renvoyé au vendeur (propriétaire) pour l'édition. Liste publique `/listings` : URL toujours exclue.
- **Frontend** : toggle « Rendre l'URL visible publiquement sur l'annonce » ajouté dans `CitadelleCreateListing.js` (state `url_public` + payload + `data-testid=create-listing-url-public`) et `CitadelleEditListing.js` (préremplissage depuis `listing.url_public` + payload + `data-testid=edit-listing-url-public`). Fiche `CitadelleListingDetail.js` : rendu conditionnel — si publique, lien cliquable (`data-testid=listing-public-url`, `rel=noopener noreferrer nofollow`) ; sinon message confidentiel (`data-testid=listing-url-hidden-msg`).
- **Rétrocompat** : annonces existantes sans `url_public` → traitées comme confidentielles (comportement historique préservé, aucune migration).
- **Testé (muet, Règle 6)** : curl — url_public=True → url_preview renvoyé ; url_public=False → url_preview absent. Screenshot fiche : message confidentiel affiché correctement. Frontend compilé.
- **⚠️ NON DÉPLOYÉ SUR LE VPS** : nécessite Save to Github → `git pull` → `yarn build` → `pm2 restart syndicat-backend` (aucun script de seed requis).

### Ajout — Bouton « Demander l'adresse au vendeur » (annonces confidentielles)
- Sur la fiche d'une annonce à URL confidentielle, bouton doré `data-testid=btn-request-url` (visible sauf pour le vendeur lui-même et annonce non vendue). Non connecté → ouvre la modale d'auth ; connecté → pré-remplit un message type et ouvre le **modal « Contacter le vendeur » existant** (DRY, `POST /messages/send`), créant la conversation de mise en relation. 1 seul fichier modifié (`CitadelleListingDetail.js`).
- **Testé (muet)** : bouton affiché + ouverture modale auth (non connecté) via screenshot ; envoi message acheteur → 201 + conversation créée via curl (puis nettoyé). URL jamais exposée.

---


## 🚀 Session 07/07/2026 — DÉPLOIEMENT VPS des nouveaux contenus (RÉUSSI)
- **Contexte** : mise en ligne sur le VPS (branche `main-projet-7`, `/var/www/syndicatducode.fr`) de tout le calendrier éditorial 2026 + correctifs de session (modération membres, escrow Stripe, route blog `next-scheduled`, rubrique Guides).
- **Procédure guidée pas-à-pas** (client via SSH) : sauvegarde `mongodump` (→ `/root/backup_20260707_100650`), `git fetch`/`git pull` fast-forward (21 commits, aucun conflit), `yarn install && yarn build` (bundle `main.366d0c97.js`, compiled with warnings eslint bénins), `pm2 restart syndicat-backend`, puis exécution des 11 scripts de seed (`venv` actif).
- **Résultat vérifié en prod** : 26 Chroniques + 25 Guides + 25 articles Blog classiques insérés — **tous en publication programmée** (`is_published=False` + `scheduled_at`), 0 publié le jour J. Total collection `citadelle_blog_posts` = **132**. Routes publiques `GET /api/citadelle/blog/next-scheduled?category=...` OK (prochaine Chronique 09/07, prochain Guide 11/07).
- **Note** : pas de `pip install` (aucune nouvelle dépendance Python) ; images toutes en URL externes (CDN Emergent / Pexels / Unsplash), rien à copier. `emergentintegrations` réintroduit dans `requirements.txt` par le pull mais non installé/non importé → sans impact runtime.
- Règle 6 respectée : validations en "muet" (curl + comptage DB), aucun testing_agent, aucun email de test.

---



## 📜 Session 07/07/2026 — Rubrique premium « Les Chroniques de La Garde »
- Nouvelle catégorie `chroniques-la-garde` ajoutée (backend blog.py BLOG_CATEGORIES + frontend citadelleConstants.js, label « Les Chroniques de La Garde »).
- Couverture graphique commune générée (emblème bouclier+circuit or sur navy) : URL statique Emergent.
- 10 articles rédigés (1500+ mots, ton expert, SEO/GEO/AEO, conclusion « Recommandations de La Garde »), auteur « La Garde », en PUBLICATION PROGRAMMÉE (is_published=false + scheduled_at) chaque jeudi 09h Paris du 09/07 au 10/09/2026.
- Scripts idempotents : `scripts/seed_chroniques_la_garde_1_5.py` et `..._6_10.py`. Vérifiés sur preview (10 visibles en admin avec dates). À exécuter sur le VPS prod après déploiement.
- Backlog éditorial : page dédiée « Les Chroniques de La Garde » (collection numérotée, distincte du blog) + suite de la série jusqu'à fin d'année.

---


## 🛡️ Session 06-07/07/2026 — Modération membres (avertissement / suspension / bannissement)
- **Objectif** : informer le membre sur son espace + restreindre l'accès selon la sanction.
- **Règles** : Avertissement = bandeau info 1 semaine (aucun blocage). Suspension (1 ou 2 sem.) = bandeau + connexion + consultation compte/factures/transmissions OK, MAIS achat/vente/enchère/offre/contre/paiement + messagerie de transaction bloqués. Bannissement = connexion OK mais accès STRICTEMENT limité à factures + documents de transmission.
- **Backend** : `dependencies.py` → `require_citadelle_user` bloque seulement les bannis ; nouvelle `require_can_transact` bloque suspendus+bannis (appliquée aux endpoints d'action de transactions.py & listings.py). `auth.py` login autorise désormais suspendus/bannis (réactivation auto en fin de suspension) — validé par integration_expert. `moderation.py` warn pose `until=+1 semaine`.
- **Frontend** : `useCitadelleModeration` (hook, fetch /auth/me) + `ModerationBanner` (3 niveaux) dans `CitadelleLayout` ; vue restreinte banni dans `CitadelleDashboard` ; boutons d'action masqués + notice dans `CitadelleListingDetail`.
- **Tests** : iteration_23.json — 100% (backend 6/6 pytest `test_citadelle_moderation.py`, frontend 3/3). Compte test `arnaudaube@gmail.com` (email réel) laissé actif.

---


## 🔧 Session 06/07/2026 — Correctif virement escrow (Stripe Connect)
- **Bug corrigé** : à la finalisation (`POST /admin/transactions/{id}/complete`), le `Transfer.create` échouait en prod avec `balance_insufficient` (fonds carte encore "en attente", solde dispo plateforme à 0) → aucun virement vers le vendeur (volume Connect à 0 €).
- **Fix** : ajout de `source_transaction=<latest_charge du PaymentIntent>` dans `Transfer.create` (transactions.py ~L1226). Le transfert est accepté même solde dispo à 0 et se libère à la disponibilité des fonds. Gestion propre si charge introuvable.
- **Décision produit** : rester sur comptes **Stripe Connect Express** (Stripe gère KYC + IBAN, zéro responsabilité juridique). Custom écarté.
- **BACKLOG (plus tard)** : l'IBAN collecté dans le profil Citadelle est **redondant** (Stripe Express le recollecte dans son onboarding hébergé). Envisager de **retirer le champ IBAN du profil Citadelle** pour éviter la confusion vendeur, OU l'afficher comme purement informatif. Non bloquant.

---


## 🚀 Session 06/07/2026 — DÉPLOIEMENT VPS PRODUCTION (RÉUSSI)
- **Branche déployée** : `main-projet-7` (67 commits) sur VPS Hostinger `/var/www/syndicatducode.fr`.
- **Procédure** : `git pull` (fast-forward), ajout des clés `.env` prod (GOOGLE_CLIENT_ID/SECRET + VAPID_PUBLIC/PRIVATE/SUBJECT côté backend, REACT_APP_GOOGLE_CLIENT_ID côté frontend), `pip install` (hors `emergentintegrations`, inutile/absent PyPI public), `yarn build`, `pm2 restart syndicat-backend`.
- **Données 100% préservées** (MongoDB non touchée) : admin `bigpapa1981@asar.com` OK, 20 articles blog, services et annonces "vendu" intacts.
- **Validations prod** : VAPID key servie, `/api/citadelle/blog` (20 articles), login admin OK, front Citadelle chargé avec nouveau build.
- **Note** : `emergentintegrations` retiré de facto sur VPS (non importé dans le code — remplacé par OAuth Google natif + Stripe interne).

---


## 🔧 Session 03/07/2026 — Preview (fork de récupération)
- **Bouton provisoire d'accès admin** ajouté en bas de la page d'accueil Syndicat (`Footer.js`, `data-testid="footer-admin-access-provisoire"`) → `/papaenmousse1981`. ⚠️ À RETIRER avant mise en prod.
- **Bug bloquant corrigé** : `AdminLoginPage.js` redirigeait vers `/` sur le preview (liste blanche domaine limitée à `syndicatducode`/`localhost`). Ajout de `emergentagent.com` ; restriction prod `syndicatducode.fr` intacte.
- **Dashboard bipolaire enrichi** (`AdminUniverseSelector.js`) : cartes agrandies + **flux dynamique auto-défilant** (ascenseur bas→haut) des éléments NON TRAITÉS, items cliquables → route de traitement. Endpoint `GET /api/admin/activity-feed` (`routes/admin/stats.py`).
- **Bug 'Changer d'univers' corrigé** (`AdminLayout.js`) : l'effet d'auto-détection d'univers ne dépend plus que du `pathname` (ne ré-imposait plus 'citadelle' lors d'un changement manuel). Retour au sélecteur OK depuis les 2 univers.
- **Notes de dev retirées** (`AdminCitadelle.js`) : bannière 'Phase A', section 'Feuille de route', badges de phase → 'Actif'.
- **Factures PDF** (`invoices.py`) : 'Exploitée par JOERKE.B — SASU — Capital 250€' → **'propulsé par JOERKE.B'** ; 'SIRET : En cours d'immatriculation' → **'SIREN : 892906728'** ; footer harmonisé. `forme_jur` retiré.
- **Facture — destinataire dynamique** : bloc DESTINATAIRE alimenté par le profil (`_recipient_from_user`) : pro → raison sociale + SIRET + N° TVA + adresse société ; particulier → nom + adresse. Snapshot à la création + enrichissement au rendu pour anciennes factures (`_enrich_recipient`).
- **Page estimation reliée aux prix services** (`CitadelleEstimation.js`) : correspondance service ↔ prix par **titre** (résiste au re-seed) + utilisation de l'ID/prix réels API pour affichage et checkout Stripe.
- **Validation** : agent de test iteration_10 → Backend 8/8, Frontend 7/7, 100% PASS, aucun bug.
- **OFFRE PROMO GLOBALE** (nouvelle feature) : réduction % pilotable depuis l'admin (`components/admin/PromoConfigCard.js` dans onglet Services) — on/off, %, texte du badge, date de fin optionnelle. Backend `routes/citadelle/services.py` (helpers `get_promo_config`/`is_promo_active`/`apply_promo`, routes `GET /promo`, `GET|PATCH /admin/promo`). Affichage : bannière + prix barré/réduit + pastille (`utils/promo.js`) sur pages Services, Estimation et modal checkout. **Prix réduit réellement facturé** au checkout Stripe (`payments.py` : `original_amount` + `promo_percent` stockés). S'applique à tous les services payants. Validé iteration_11 → Backend 10/10, Frontend 100%. Promo laissée DÉSACTIVÉE.
- **PANNEAU « À TRAITER » + CLOCHE (espace membre Citadelle)** : vue directe des interactions pour éviter les clics. Endpoint `GET /api/citadelle/member/activity` (`routes/citadelle/messages.py`) agrège messages non lus, propositions d'achat reçues, contre-offres, paiements à effectuer, accès à transmettre, litiges (trié récent→ancien). Frontend : `components/citadelle/MemberActivityPanel.js` (liste cliquable sous l'en-tête du dashboard membre) + cloche compteur dans l'en-tête (`CitadelleLayout.js`, `data-testid citadelle-nav-bell`). Chaque ligne mène en 1 clic à la conversation/transaction. Validé iteration_12 → Backend 11/11, Frontend 100%.



## 🔧 Session 04/07/2026 — Preview (fork)
- **Décision Google Auth (P1, EN PAUSE)** : la page Google Auth managée par Emergent NE PEUT PAS être white-labelée ("secured by emergent" imposé). Solution = OAuth Google custom avec identifiants du client. Playbook `integration_expert` récupéré (authlib backend + `@react-oauth/google` frontend ; redirect `{origin}/auth/google` ; JS Origins + Redirect URIs à ajouter dans Google Cloud Console). **En attente que le client fournisse Client ID + Secret.**
- **Données de démo testpapajoseph@gmail.com** créées puis PURGÉES (script idempotent `backend/scripts/seed_demo_testpapajoseph.py`, marqueur `demo_seed`) — servait à visualiser les panneaux dashboard ("À traiter", "Mes gains", messagerie). Vérifié via API (activity 4 items, earnings 16 625€ encaissé / 19 950€ séquestre).
- **Bouton admin provisoire RETIRÉ** du footer Syndicat (`Footer.js`, `data-testid="footer-admin-access-provisoire"`). Confirmé absent du bundle servi (grep=0). Route `/papaenmousse1981` (connexion admin) conservée. Le bloc DEV_MODE de connexion rapide reste (invisible hors dev).
- **Contrôle déploiement (deployment_agent)** : PRÊT. Compilation OK, secrets/URLs en .env, ports & supervisor conformes. Seul avertissement : CORS listé par domaines (conservé tel quel — adapté au VPS à domaines fixes du client).
- **Déploiement** : consignes projet = pas de commandes VPS fournies par l'agent. Options Emergent (bouton Deploy, 50 crédits/mois, domaine perso, Save to GitHub) relayées via support_agent.

## 🛡️ Module Transmission d'actif — La Garde (ajouté 04/07/2026, PREVIEW uniquement)
Processus professionnel de cession + génération de l'« Attestation de Transmission » (PDF premium).
- **Backend** : `routes/citadelle/transmissions.py` (endpoints admin CRUD + membre + vérif publique), `routes/citadelle/transmission_schema.py` (registre dynamique type→sections→champs, extensible), `services/transmission_pdf.py` (2 rendus : Attestation complète acheteur/admin + Titre de Cession vendeur SANS accès), `utils/crypto.py` (chiffrement Fernet des champs sensibles).
- **Sécurité** : champs sensibles chiffrés au repos (Fernet), jamais loggés. Clé `.env` `TRANSMISSION_ENC_KEY`. Vendeur ne reçoit JAMAIS les codes.
- **Frontend** : `AdminCitadelleTransmission.js` (assistant 7 étapes, barre progression, champs dynamiques, brouillon, contrôles de cohérence), `CitadelleMyTransmissions.js` (espace membre), `CitadelleVerifyTransmission.js` (page publique QR). Bouton « Créer une transmission » sur transaction admin (statut admin_verified/completed).
- **Routes** : `/syndicat-admin/citadelle/transmission/:txId`, `/citadelle/espace-membre/transmissions`, `/verifier-transmission/:dossier`.
- **Email** : acheteur notifié à la finalisation (document prêt).
- **Vérifié** : chiffrement (Fernet en base + déchiffrement admin), PDF premium (sceau La Garde + QR + n° dossier), wizard UI dynamique, flux create→patch→finalize→pdf→verify (curl + screenshots).
- ⚠️ **DÉPLOIEMENT VPS** : ajouter `TRANSMISSION_ENC_KEY` au `.env` backend VPS + s'assurer que `backend/static/sceau-la-garde.png` est bien poussé.

## 🚀 Déploiement VPS — Mise à jour 04/07/2026 (branche main-projet-7)
- Bascule VPS `main-projet-4` → **`main-projet-7`** (commit `75126cd`) via git fetch/checkout.
- `emergentintegrations==0.1.0` retiré de `backend/requirements.txt` sur le VPS (non installable hors Emergent, code Stripe = SDK officiel `_StripeClient`). Toutes deps déjà satisfaites (stripe 14.4.0).
- Backend redémarré via PM2 (`syndicat-backend`) — démarrage propre (Uvicorn 127.0.0.1:8001, scheduler + index OK).
- Frontend rebuild `yarn build` → nouveau bundle `main.61bbecf3.js` servi par Nginx (build/ statique).
- Vérifs prod OK : HOME 200, /api/citadelle/blog 200, /api/citadelle/services 200 (/api/alerts/ = 403 attendu, auth admin).
- ⚠️ Cache PWA : SW met à jour l'UI au prochain chargement. Ancienne branche locale `main-projet-4` conserve 26 commits non poussés (sans impact).

## 🔧 Session 07/2026 — Nettoyage avant déploiement : retrait des accès de test du Footer (PREVIEW)
- Retrait des boutons provisoires « Accès Admin » + « Accès Citadelle (test) » et du bloc `DEV_MODE` (quick-login admin/dev/commercial) de `components/layout/Footer.js`. Fonctions `quickLogin`/`provisionalCitadelleLogin` et imports associés supprimés (code mort). Footer épuré (navigation, mentions légales, écosystème, copyright). Compilation OK, 0 occurrence restante. ✅ P0 « retirer boutons Footer » TERMINÉ.

## 🔧 Session 07/2026 — Authentification Google personnalisée (marque blanche) (PREVIEW)
- **Besoin client** : remplacer le Google login géré par Emergent par un **OAuth Google propre à La Citadelle** (projet Google Cloud du client, sans branding Emergent), pour la connexion des comptes utilisateurs.
- **Identifiants** (fournis par le client, stockés uniquement en `.env`) : `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (backend/.env) ; `REACT_APP_GOOGLE_CLIENT_ID` (frontend/.env).
- **Flux** : OAuth 2.0 code d'autorisation par redirection native (sans dépendance ajoutée). Bouton → `accounts.google.com` → redirection vers `{origin}/auth/google?code=...` → page `CitadelleGoogleCallback` échange le code via `POST /api/citadelle/auth/google/callback` `{code, redirect_uri}` → backend échange le code (`oauth2.googleapis.com/token`, `redirect_uri` transmis), récupère le profil (`/oauth2/v3/userinfo`), upsert du compte (`_upsert_citadelle_google_user`), émet le JWT Citadelle. Gestion CGU préservée.
- **Fichiers** : backend `routes/citadelle/auth.py` (helper + endpoint réécrit, ancien flux Emergent/session_id supprimé) ; frontend `services/citadelleGoogleAuth.js` (util redirection), `pages/citadelle/CitadelleGoogleCallback.js` (lit `?code`), route `/auth/google` (App.js), boutons `CitadelleAuthModal.js` + `CitadelleLogin.js`.
- **Validé** : config chargée, code invalide → 401 propre ; page login + bouton OK ; clic redirige vers Google (aucune erreur JS) ; frontend compilé. E2E réel (consentement Google + création compte) non automatisable → à tester avec un vrai compte Google (ajouté en « utilisateur test » si l'écran de consentement est en mode Test).
- **⚠️ À FAIRE AU DÉPLOIEMENT VPS** : renseigner `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (backend .env) et `REACT_APP_GOOGLE_CLIENT_ID` (frontend .env) ; enregistrer les URI de redirection prod dans Google Cloud (`https://lacitadellenumerique.fr/auth/google`, +www) ; **publier l'écran de consentement OAuth** pour ouvrir à tous les utilisateurs.

## 🔧 Session 07/2026 — Diagnostic & fiabilisation des notifications push (VPS) (PREVIEW)
- **Contexte** : le client signalait que les notifications push admin (« Papa en Mousse », Web Push/VAPID via pywebpush) ne fonctionnaient pas après déploiement VPS.
- **CAUSE RACINE VPS identifiée** : `backend/config/vapid_private.pem` est **gitignoré** → non déployé sur le VPS → l'envoi échoue (clé privée manquante). Correctif : `push_service._get_vapid_private_key()` lit désormais en priorité la variable d'env **`VAPID_PRIVATE_KEY`** (clé brute base64url 43 car., ajoutée au `.env`), avec repli sur le fichier .pem. La clé publique .env correspond bien à la clé privée (vérifié).
- **BUG de robustesse corrigé** : dans `send_push_to_all_admins`, un abonnement corrompu ou une erreur non-`WebPushException` faisait **planter toute la boucle** → aucun admin notifié. Ajout de `except ValueError` + `except Exception` (log + continue) et purge automatique des abonnements corrompus/expirés (`WebPushException` response None ou 400/404/410).
- **Vérifs** : keypair public/privé OK, `set_push_alerts_db` appelé au démarrage, scheduler `check_and_notify` (60s) actif, frontend `enablePush` récupère bien la clé publique du backend.
- **⚠️ À FAIRE AU DÉPLOIEMENT VPS** : renseigner dans le `.env` du VPS `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (=`FVP20rNuwm5zX2htaPuczYYaaMULcVrUhobeIFoCFvA`), `VAPID_SUBJECT` ; servir le site en **HTTPS** (obligatoire pour service worker + push).
- **Testé (testing_agent iteration_22)** : backend 15/15 pytest (100%) — vapid-key, summary (7 catégories, admin-gated), subscribe/unsubscribe (upsert), validate/reject, priorité clé env, signature VAPID acceptée (410 endpoint fake), robustesse boucle. Suite : `backend/tests/test_push_alerts.py`. Point mineur corrigé après coup (purge des abonnements corrompus response=None) + validé via curl. Livraison push réelle vers navigateur non automatisable → à tester sur un vrai téléphone. Règle 6 respectée.

## 🔧 Session 07/2026 — Installation PWA admin simplifiée (« Papa en Mousse ») (PREVIEW)
- **Besoin client** : simplifier l'installation de la web app admin pour les collègues (scan QR → installation simple type « Voulez-vous installer ? »), sans passer par un store. Page unique réservée aux admins.
- **Nouvelle page** `AdminInstallApp.js` (route admin `/admin-live/installer`, `RoleRoute` admin) : détection plateforme →
  - **Android/Chrome** : bouton one-tap « Installer l'application » via `beforeinstallprompt` (prompt natif) + écoute `appinstalled`.
  - **iPhone/Safari** : instructions visuelles 3 étapes (Partager → Sur l'écran d'accueil → Ajouter) — seule méthode possible sur iOS.
  - **Déjà installée** (standalone) : message + bouton « Ouvrir l'application ».
  - **Fallback** : consignes menu ⋮ Chrome + bouton Réessayer.
  - **QR code** pointant vers `/admin-live/installer` pour faire scanner à un collègue.
- **Routage** : `RoleRoute` — ajout de `/admin-live` aux `adminPaths` → un accès non connecté à l'app admin/installer redirige vers la **connexion administrateur** (`/papaenmousse1981`) au lieu de la connexion membre (confirmé via screenshot). `start_url` PWA reste `/admin-live` (ouverture sur connexion admin, conforme choix client).
- **Service worker** (`public/sw.js`) : ajout d'un handler `fetch` (network-first + secours cache/`/admin-live`) pour fiabiliser l'installabilité PWA.
- **AdminLiveApp.js** : le QR pointe désormais vers la page d'installation ; ancien `QRModal` (code mort) supprimé ; import `X` inutilisé retiré ; boutons « Installer / Partager l'app » naviguent vers `/admin-live/installer`.
- **Validé** : compilation frontend OK, redirection connexion admin confirmée. ⚠️ Capture visuelle de la page d'installation non aboutie (limitation login headless du harnais).

## 🔧 Session 07/2026 — Annulation auto des offres concurrentes (PREVIEW)
- **Choix client** : sur une même annonce, dès qu'une offre est **acceptée**, toutes les **autres offres en cours** (`offer_sent` / `offer_countered`) sont **immédiatement annulées** (avant paiement). Message système + email à chaque acheteur concerné : « Navré, le bien numérique vient de trouver acquéreur. N'hésitez pas à consulter les autres annonces pour trouver la perle rare. » + lien `/citadelle/annonces`.
- **Backend** (`routes/citadelle/transactions.py`) : helper `_annuler_offres_concurrentes(listing_id, accepted_tx_id, now)` (filtre `listing_id` + `$ne` tx acceptée + `status $in [offer_sent, offer_countered]` → `cancelled` + `cancelled_reason='concurrent_offer_accepted'` + message système + email). Appelé dans `accept_offer` (vendeur accepte) et `accept_counter_offer` (acheteur accepte la contre-offre).
- **Email** : `send_citadelle_offer_auto_cancelled_email` (`services/email_service/citadelle/transactions.py` + export `__init__`).
- **Enrichissement (07/2026)** : l'email ET le message de transaction incluent jusqu'à **3 suggestions d'annonces similaires** (même `type`, actives, hors adulte : titre + prix + lien) pour maximiser la reconversion. `send_citadelle_offer_auto_cancelled_email(..., suggestions=[...])`. Validé via curl (message système + email listent 3 annonces avec liens).
- **Email HTML premium (07/2026)** : l'email d'annulation est désormais stylisé (wrapper `_build_notification_base` bleu/or, format multipart texte+HTML) avec **mini-vignettes** des annonces suggérées (image de couverture via `_get_listing_image_url_for_email`, titre, prix, bouton « Voir ») + CTA « Voir toutes les annonces ». Placeholder si annonce sans image. Validé via rendu HTML interne (wrapper, vignette image, placeholder, boutons, CTA).
- **Harmonisation emails acheteurs enchères (07/2026)** : conversion en HTML premium (`_build_notification_base` + helper DRY `_bloc_infos_html`) des emails acheteurs : confirmation d'enchère, **NOUVEL email « vous avez été surenchéri »** (déclenché dans `place_bid` vers l'ancien meilleur enchérisseur, badge orange + CTA « Surenchérir »), enchère annulée par la modération (badge rouge), offre « dernière chance » (badge or + CTA « Finaliser »). Tous en multipart texte+HTML. L'email « accès sécurisés » reste en texte (données sensibles). Validé : rendu HTML des 4 emails (wrapper + bloc infos + CTA) + `place_bid` non-régressé (curl, déclenche l'email surenchéri).
- **Préférence notifications email — bouton ON/OFF profil (07/2026)** : champ booléen `email_notifications` (défaut True) sur `db.users` (platform citadelle), modifiable via `PATCH /api/citadelle/auth/profile` et retourné par `/me`. Helper partagé `utils/notif_prefs.py::email_notifications_enabled(db, email)`. Tous les emails de notification acheteur sont gatés par cette préférence : confirmation d'enchère, surenchéri, enchère annulée, offre concurrente auto-annulée, offre « dernière chance ». Les emails critiques (accès sécurisés, reset password) NE SONT PAS concernés. Frontend : toggle stylisé (or/gris) dans l'onglet Informations du profil (`member/CitadelleProfile.js`, `data-testid=profile-email-notifications-toggle`). Validé backend via curl (persistance + /me + helper True/False) ; frontend compilé (capture visuelle non aboutie — limitation login headless).
- **Validé (testing_agent iteration_20)** : backend 9/9 (100%), aucun bug. Couvre : accept + accept-counter (autres offres annulées), non-atteinte des tx completed/cancelled et des autres annonces, contrôles d'accès 403/400/404, non-régression create/counter/buyer-counter/refuse/withdraw. Suite : `backend/tests/test_citadelle_concurrent_offers_cancel.py`. Règle 6 respectée (tests avec accord client).

## 🔧 Session 07/2026 — Enchère « dernière chance » à l'enchérisseur suivant (PREVIEW)
- **Choix client** : si une enchère gagnante n'aboutit pas (abandon acheteur ou autre), l'admin peut **demander au vendeur** (email + message dans la transaction) s'il souhaite proposer l'actif à l'enchérisseur suivant. **Le vendeur confirme** via un bouton → déclenche tout le processus. Relance possible en chaîne (chaque enchérisseur déjà sollicité est exclu). Enchérisseur suivant servi **à son propre montant** (2ᵉ prix) + email « dernière chance ». Aucun délai limite.
- **Backend** (`routes/citadelle/transactions.py`) : `POST /admin/transactions/{id}/request-second-chance` (admin ; exige tx d'enchère `cancelled` + un enchérisseur suivant ; pose `second_chance_requested` + `second_chance_next_bidder`, message + email vendeur). `POST /transactions/{id}/confirm-second-chance` (vendeur ; crée une nouvelle transaction `offer_accepted`/`is_auction`/`second_chance` pour l'enchérisseur suivant, email « dernière chance », met à jour `auction_winner_transaction_id`, marque `second_chance_done`). `POST /transactions/{id}/decline-second-chance` (vendeur ; annule la demande). Helpers `_prochain_encherisseur`, `_encherisseurs_deja_sollicites` (exclusion via les transactions existantes), `_is_auction_tx`.
- **Backend** (`services/newsletter_scheduler.py`) : la transaction gagnante d'enchère est désormais marquée `is_auction: True`.
- **Emails** (`services/email_service/citadelle/auctions.py` + exports) : `send_citadelle_second_chance_seller_request_email` (demande au vendeur), `send_citadelle_second_chance_offer_email` (offre dernière chance à l'enchérisseur).
- **Frontend admin** (`AdminCitadelleTransactions.js`) : sur une transaction d'enchère annulée, bloc + bouton « Proposer la seconde chance au vendeur » (état « en attente » si déjà demandé, mention si refusé).
- **Frontend vendeur** (`member/CitadelleTransactionDetail.js`) : bannière dorée avec montant de l'enchérisseur suivant + boutons « Confirmer » / « Refuser » ; message de confirmation une fois déclenché.
- **Validé (curl + vérif DB)** : request avant annulation → 400 ; withdraw → cancelled ; admin request → next_amount 3000€ + email vendeur ; confirm vendeur → nouvelle tx (perdant suivant, 3000€, offer_accepted, is_auction, second_chance) + old tx `second_chance_done` ; chaîne épuisée → 400. Frontend compilé sans erreur. Règle 6 respectée.

## 🔧 Session 07/2026 — Signalement d'enchère suspecte + suppression admin (PREVIEW)
- **Choix client** : tout membre connecté peut signaler discrètement l'enchère **la plus haute** (courante) d'une annonce aux enchères ; signalement **invisible** des autres membres (visible admins uniquement) ; l'enchérisseur n'est notifié par email **que si son enchère est supprimée** ; recalcul auto de l'enchère courante après suppression ; gestion via la page **Signalements** existante (DRY).
- **Backend** (`routes/citadelle/listings.py`) : `bid_id` (uuid) ajouté à chaque nouvelle enchère. `POST /listings/{id}/report-bid` (require_citadelle_user) → signale l'enchère courante (backfill `bid_id` si enchère historique), écrit dans `citadelle_reports` avec `report_type:"bid"` + email admin (réutilise `send_citadelle_report_email`). `DELETE /admin/listings/{id}/bids/{bid_id}` (require_admin) → retire l'enchère, recalcule `auction_current_bid`/bidder sur l'enchère valide suivante (ou prix de départ si aucune), notifie l'enchérisseur, clôture les signalements liés (`status:resolved`).
- **Email** : `send_citadelle_auction_bid_removed_email` (`services/email_service/citadelle/auctions.py` + export `__init__`).
- **Frontend** : composant `components/citadelle/ReportBidButton.js` (lien discret « Signaler cette enchère » + modal message facultatif) affiché sur la fiche `CitadelleListingDetail.js` sous l'enchère courante (membres connectés, enchère active avec ≥1 offre). Page admin `AdminCitadelleReports.js` : rendu spécifique `report_type:"bid"` (montant signalé, enchérisseur, prix annonce, « Voir l'annonce », bouton « Supprimer l'enchère » + modération de l'enchérisseur).
- **Validé (curl + vérif DB)** : signalement 200 (+ backfill bid_id), liste admin OK, suppression 200 → recalcul current_bid=prix (1000€, bidder None) + report `resolved`, double suppression → 404, sans auth → 403, listing inconnu → 404. Frontend compilé sans erreur. Règle 6 respectée (pas de testing_agent sans accord).

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
- **Paiement direct Stripe LIVE (TERMINÉ 30/06/2026)**
  - Bug corrigé : `session.session_id` → `session.id` (AttributeError Stripe SDK)
  - Route `POST /api/citadelle/payments/service/checkout` — checkout Stripe LIVE
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

### ✅ Blog Citadelle (TERMINÉ 10/06/2026 — étendu 02/2026)
- Interface publique : liste d'articles avec filtres par catégorie, page de lecture Markdown
- Gestion admin : éditeur Markdown plein écran + prévisualisation en temps réel (bascule)
- **Image de couverture** : upload depuis l'interface admin, affichée en carte liste + hero article
- Catégories : Actualités, Conseils, Tutoriels, Marché, Juridique + vente-applications, reseaux-sociaux, marketplace
- Slug auto-généré depuis le titre (unicité garantie)
- Auteur, date de publication, lien partenaire
- Styles CSS blog-content (clair) + blog-content--dark (admin)
- `BLOG_CATEGORIES` centralisées dans `citadelleConstants.js` (DRY)
- **41 articles SEO/GEO/AEO importés en base** (15 originaux + 15 nouveaux articles n°16-30 ajoutés 02/2026)
  - Nouveaux articles : application mobile, YouTube, Instagram, juridique, rentabilité, outils audit, trafic, Shopify, migration, cybersécurité, pricing, SaaS, tendances 2026, transmission, marketplace
- **Suggestions d'articles liés** (02/2026) : endpoint `/blog/{slug}/related`, algorithme 3 niveaux (catégorie → mots-clés → récents), 3 cartes visuelles en bas de chaque article
- **Estimateur de valeur de site** (02/2026) : section interactive sur la page d'accueil, 5 types × 4 anciennetés, fourchette de prix instantanée, FAQ AEO Schema.org, CTA vers service d'estimation professionnel
- **Page `/citadelle/estimation`** (02/2026) : estimateur avancé 5 paramètres (bénéfice net, type, ancienneté, % SEO organique, taux de croissance, diversification) avec décomposition des ajustements, table comparative des multiples, formulaire de demande d'estimation pro (POST `/api/citadelle/estimation/request`), FAQ accordéon avec microdata Schema.org, JSON-LD FAQPage + Service pour rich snippets Google

### ✅ Module Facturation PDF — PDP (TERMINÉ 30/06/2026)
- **Génération PDF** : `reportlab` → facture PDF complète (entête, détail, montants HT/TVA/TTC, numéro FAC-YYYY-NNNNN, conformité mentions légales)
- **Hook post-paiement** : `_finalize_paid_transaction` dans `payments.py` appelle automatiquement `create_invoice_for_payment` après validation Stripe Webhook
- **Email automatique** : `send_invoice_confirmation_email()` dans `email_service/citadelle/services.py` — PDF en pièce jointe (MIMEBase + base64), appelé via `run_in_executor` (non-bloquant), envoyé au client dès confirmation paiement
- **Routes backend** : `GET /api/citadelle/invoices/my` (client), `GET /api/citadelle/invoices/{id}/pdf` (client), `GET /api/citadelle/admin/invoices` (admin), `GET /api/citadelle/admin/invoices/{id}/pdf` (admin), `POST /api/citadelle/admin/invoices/bulk-pdf`
- **Frontend client** : `/citadelle/espace-membre/factures` → `CitadelleMyInvoices.js` (CitadelleLayout, liste + téléchargement)
- **Frontend admin** : `/syndicat-admin/citadelle/factures` → `AdminCitadelleInvoices.js` (AdminLayout + api Syndicat, liste + recherche + téléchargement)
- **Collection MongoDB** : `citadelle_invoices`
- **Testé** : API curl + PDF valide (3159 octets) + email SMTP envoyé avec succès (2 factures de test)


- **Citadelle** : `GET /api/sitemap-citadelle.xml` → 68 URLs (11 pages statiques + 56 articles + annonces live)
- **Syndicat** : `GET /api/sitemap-syndicat.xml` → 8 URLs (pages publiques)
- **Fichiers statiques** dans `public/` : `sitemap-citadelle.xml` (soumission directe GSC) + `sitemap-syndicat.xml`
- **`robots.txt`** créé dans `public/` avec pointeurs vers les 2 sitemaps + exclusions des espaces privés
- Priorités et changefreq calibrés par type de contenu (blog daily 0.9, annonces daily 0.9, statique monthly/yearly)

### ✅ Estimation pro payante — Sélecteur Standard/Expert + Stripe (TERMINÉ 30/06/2026)
- **Sélecteur de formule** : 2 cartes Standard (49€) / Expert (149€) avec features list + badge "Recommandé"
- **ContactForm refonte** : appel `POST /api/citadelle/payments/service/checkout` → redirect Stripe (plus d'email gratuit)
- **Backend** : `cancel_path` ajouté à `ServiceCheckoutRequest` → retour sur `/citadelle/estimation` si annulation
- **Page confirmation** : détecte si service estimation → message adapté "48h ouvrées" + CTA "Créer mon espace client" (si non connecté) ou "Voir mes services" (si connecté)
- **Testé à 95%** : cartes visibles, sélection fonctionnelle, bouton prix dynamique, appel API confirmé

### ✅ Bug fix — Articles de blog vides (CORRIGÉ 30/06/2026)
- **Cause** : Les 15 articles importés (batch 3) avaient leur contenu Markdown dans le champ `content` au lieu de `content_md`
- **Fix 1 — Frontend** : `CitadelleBlogPost.js` ligne 287 → `post.content_md || post.content` (fallback robuste)
- **Fix 2 — Migration DB** : Script `migrate_content_to_content_md.py` exécuté → 15 articles mis à jour
- **Test** : Validé par l'agent de test (100% des cas) — contenu affiché (4353 chars, 15 titres, 14 paragraphes)

### ✅ Widget estimateur contextuel sur les fiches annonces (TERMINÉ 30/06/2026)
- Composant `EstimateurSidebar` ajouté dans `CitadelleListingDetail.js` (sidebar droite, après "URL masquée")
- Pré-rempli automatiquement avec le `monthly_revenue` de l'annonce
- Affiche le type SDE contextuel selon le type de l'annonce (20 types mappés vers contenu/ecommerce/saas/social)
- Calcul instantané : fourchette de valorisation avec les multiples SDE min/max de la catégorie
- Bouton "Recalculer" pour ajuster le bénéfice
- CTA "Estimation pro gratuite — 48h →" vers `/citadelle/estimation`
- Augmente les conversions vers le service d'estimation professionnel

### ✅ Nouvelles catégories d'actifs — UX "Autre" (TERMINÉ 30/06/2026)
- **14 nouvelles catégories** ajoutées sans surcharger l'interface de création d'annonce
- **Backend** : `LISTING_TYPES` étendu de 6 → 20 types dans `listings.py`
- **Constantes** : `CITADELLE_EXTRA_CATEGORIES` + `CITADELLE_ALL_CATEGORIES` dans `citadelleConstants.js`
- **Page Création** (`CitadelleCreateListing.js`) :
  - 7ème carte "Autre type d'actif" (pleine largeur) avec chevron rotatif
  - Clic → panneau animé CSS (max-height + opacity) déployé **inline**, les 6 cartes restent visibles
  - 14 pills cliquables avec icônes Lucide, mise en valeur dorée au clic
  - Titre de la carte "Autre" se met à jour avec la catégorie sélectionnée
- **Page Annonces** (`CitadelleListings.js`) : dropdown filtres avec les 20 types
- **Page Estimation** (`CitadelleEstimation.js`) :
  - Bouton "Autres types d'actifs" expansible avec 14 pills supplémentaires
  - `TYPE_MAPPING` pour relier les nouveaux types aux multiples de valorisation existants
  - Boutique Shopify/FBA → ecommerce · Newsletter/Forum/Blog/Média → contenu · YouTube/Instagram/TikTok/LinkedIn/Discord → social · Agents IA/Templates/BDD → saas
- Nouvelles catégories : Boutique Shopify, Amazon FBA, Newsletter, Chaîne YouTube, Compte Instagram, Compte TikTok, Page LinkedIn Entreprise, Serveur Discord, Forum, Blog, Média en ligne, Agents IA / Automatisations, Templates / Thèmes / Plugins, Bases de données / APIs

### ✅ Images de couverture blog (TERMINÉ 30/06/2026)
- Script `update_blog_images.py` : 41/41 articles mis à jour avec `cover_image_url` + `cover_image_alt` (Unsplash)
- Images thématiques et cohérentes par catégorie (estimation, vente, achat, SaaS, SEO, juridique, migration, sécurité, réseaux sociaux, e-commerce, mobile, négociation, marketplace)
- `cover_image_alt` SEO/GEO/AEO optimisé (mots-clés français + contexte géographique France)
- Frontend (`CitadelleBlogPost.js`, `CitadelleBlog.js`) : utilise `cover_image_alt || seo_title || title` pour le `<img alt>` → enrichissement SEO
- OG:image automatiquement renseigné sur chaque article (social sharing)


- Endpoint backend : `PATCH /api/citadelle/admin/listings/{id}/garde-verify` (toggle on/off, admin only)
- Badge activé par l'admin → email HTML premium envoyé au vendeur (branding Citadelle bleu/or)
- Affichage badge partout :
  - Carte listing public : badge doré "Vérifié La Garde" en bas droite de l'image
  - Page détail : bannière proéminente en haut de la fiche (bouclier + texte)
  - Espace membre vendeur (CitadelleMyListings) : badge doré inline sur le titre de l'annonce
  - Admin (AdminCitadelleListings) : bouton ShieldCheck toggle (or actif / gris inactif) dans la rangée d'actions


- Mise à jour complète du catalogue : 13 services officiels (9 payants/commission + 3 gratuits + 1 service "Vente aux enchères" sur commission)
- Nouveaux titres définitifs validés par le client :
  - **Vendeurs** : Estimation Standard (49€), Estimation Expert (149€), Vérification La Garde (99€), Accompagnement Vente Premium (399€), Vente aux enchères (Commission 5%)
  - **Acheteurs** : Audit SEO (199€), Audit Sécurité (249€), Migration de site (À partir de 299€), Refonte / Optimisation (À partir de 499€)
  - **Commun** : Transaction Sécurisée Premium (5%, min. 49€), Dépôt d'annonce (Gratuit), Recherche d'annonces (Gratuit), Création de compte (Gratuit)
- Route de seeding idempotente `POST /api/citadelle/admin/services/seed` exécutée (12 créés, 1 mis à jour, 12 anciens désactivés)
- Tunnel Stripe réel câblé : `ServiceCheckoutModal` → `/api/payments/service/checkout` (clé live configurée)
- `ServiceHeroBanner` : badge "5 % (min. 49 €)" dynamique (via `price_label`)
- `CitadelleServices.js` : section "Inclus gratuitement" ajoutée en bas de page
- Footer + `CitadelleVendre.js` mis à jour avec les nouveaux noms


### ✅ Phase 6 KYC — Mise à jour des CGU (TERMINÉ 03/07/2026)
- **`CitadelleCGU.js`** passé en v2.0 — 3 nouvelles sections légales ajoutées :
  - **Art. 5 — Transaction Sécurisée & Séquestre** : étapes de la vente, délais de traitement (3 j. ouvrables), gestion des litiges
  - **Art. 6 — Commission & Frais** : 5% du montant total, min. 49€, frais Stripe inclus, facturation automatique
  - **Art. 7 — KYC & Stripe Connect** : obligations vendeur (DoB, téléphone), processus Stripe Express, délais de virement (2-7 j. ouvrables si compte actif / 5-10 j. si manuel)
- Bandeau "Mise à jour v2.0" visible en haut de page
- Sections 5-10 anciennes renumérotées 8-13

**→ Les 6 phases du pipeline KYC → Stripe Connect → Payout sont entièrement implémentées.**

### ✅ Phase 5 KYC — Escrow → Payout automatique (TERMINÉ 03/07/2026)
- **Backend** (`transactions.py`) : `admin_complete_transaction` calcule la commission (5%, min 49€), appelle `stripe.Transfer.create` vers le compte Connect actif du vendeur, fallback gracieux si le compte est en attente ou absent (note manuelle dans le fil de discussion)
- **Frontend** (`CitadelleTransactionDetail.js`) : vue vendeur après finalisation — montant net, commission, statut du virement (auto ✅ ou manuel ⚠️) + ID Stripe  
- **Frontend** (`AdminCitadelleTransactions.js`) : synthèse payout dans le panneau de détail — total, commission, net vendeur, statut transfer, ID Stripe
- Exemple : vente 1 000€ → commission 50€ | net vendeur 950€

### ✅ Phase 4 KYC — Intégration Stripe Connect Express (TERMINÉ 03/07/2026)
- **Backend** (`stripe_connect.py`) : `POST /api/citadelle/stripe-connect/onboard` — crée un compte Express Stripe, pré-remplit avec les données KYC (nom, email, téléphone E.164 +33…, date de naissance), génère un Account Link et stocke `stripe_connect_account_id` en base. `GET /api/citadelle/stripe-connect/status` — interroge Stripe et retourne `not_connected | pending | pending_review | active`. `GET /admin/accounts` — liste des comptes Connect créés (admin). Idempotent : 2ème appel = nouveau lien seulement.
- **Frontend** (`CitadelleProfile.js`) : nouvel onglet "Paiements" — badge de statut en temps réel, bouton "Connecter mon compte Stripe" → redirect vers Stripe onboarding, retour géré via `?stripe_connect=success/refresh`, note légale Stripe Connect
- **Testé** : ✅ création compte Express (`acct_1Tp6dECcSvMb3j5f`), ✅ statut retourné, ✅ idempotence (même account_id au 2ème appel), ✅ compilation propre

### ✅ Phase 3 KYC Stripe Connect — Dashboard admin de validation (TERMINÉ 03/07/2026)
- **Backend** (`auth.py`) : `PATCH /api/citadelle/auth/admin/users/{id}/kyc` — action `validate` ou `reject` (avec motif obligatoire), stocke `kyc_status`, `kyc_validated_at`, `kyc_rejected_by`, `kyc_rejection_reason`
- **Frontend** (`AdminCitadelleUsers.js`) : colonne KYC avec badge (Validé / Rejeté / En attente) + indicateur documents (CNI, RIB, KBIS) + bouton "Réviser KYC" → modale `KycModal` avec liens vers documents, sélecteur Valider/Rejeter, champ motif, confirmation

### ✅ Phase 2 KYC Stripe Connect — Bannière vendeur (soft block) (TERMINÉ 03/07/2026)
- **Frontend** (`CitadelleTransactionDetail.js`) : bannière dorée `KycSellerBanner` affichée au vendeur dès que les fonds arrivent en séquestre (`payment_done`, `credentials_submitted`, `admin_verified`, `disputed`) si `phone` ou `date_of_birth` est absent du profil
- Bouton **Compléter mon profil** → `/citadelle/espace-membre/profil`
- Bouton ✕ pour fermer (soft — la transaction peut continuer)
- Aucun blocage fonctionnel : le vendeur peut toujours transmettre les accès même sans KYC complet

### ✅ Phase 1 KYC Stripe Connect — Champs DoB & Téléphone (TERMINÉ 03/07/2026)
- **Backend** (`auth.py`) : `PATCH /api/citadelle/auth/profile` accepte désormais `phone` (format 0XXXXXXXXX ou +33...) et `date_of_birth` (YYYY-MM-DD, âge ≥ 18 ans vérifiés serveur)
- **Frontend** (`CitadelleProfile.js`) : onglet "Informations" — champ Téléphone + champ Date de naissance + bannière KYC dorée si l'un des deux champs est manquant
- **Objectif** : pré-remplissage futur du formulaire Stripe Connect Express lors de l'onboarding vendeur

### ✅ Consentement CGU/CGV à l'inscription (TERMINÉ 15/06/2026)
- Modale bloquante `CGUAcceptanceModal` affichée avant création du compte (2 cases à cocher distinctes : CGU + CGV)
- À l'inscription : la modale s'affiche après validation du formulaire, la création du compte n'a lieu qu'après acceptation
- À la première connexion : si `cgu_accepted=False`, modale affichée avant accès à l'espace membre
- Backend : capture IP réelle (X-Forwarded-For / request.client), horodatage UTC → champs `cgu_accepted`, `cgu_accepted_at`, `cgu_ip_address`, `cgu_version`
- Nouvel endpoint `PATCH /api/citadelle/auth/accept-cgu` pour les utilisateurs existants
- Panel admin `/syndicat-admin/citadelle/utilisateurs` : tableau paginé avec date/heure d'acceptation + adresse IP
- Conformité RGPD + Stripe Connect

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
| GET /api/citadelle/invoices/my | Client: liste de ses factures |
| GET /api/citadelle/invoices/{id}/pdf | Client: télécharger PDF |
| GET /api/citadelle/admin/invoices | Admin: toutes les factures (search, pagination) |
| GET /api/citadelle/admin/invoices/{id}/pdf | Admin: télécharger PDF |
| POST /api/citadelle/admin/invoices/bulk-pdf | Admin: export ZIP factures |

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
| citadelle_invoices | Factures PDF post-paiement (invoice_number, client_name, client_email, service_title, amount_ht, amount_ttc, vat_amount, pdp_status, pdf_path) |

---

## ⚠️ Points d'attention
- **Stripe MOCKED** — En attente des clés API- **CITADELLE_FROM_EMAIL** → `atelier@syndicatducode.fr` (temporaire)
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

### ✅ Audit sécurité + correctifs P0 (TERMINÉ 15/06/2026)
- **S1** : `GET /api/contacts` (server.py) désormais protégé par `Depends(require_admin)` — fuite de données personnelles (RGPD) corrigée. Vérifié : 403 sans token, 200 admin.
- **S2** : `CORS_ORIGINS` (.env) restreint aux domaines réels (syndicatducode.fr, lacitadellenumerique.fr, + www + preview) au lieu de `*`. Vérifié en direct : origine non autorisée refusée.
- **S3 + F1** : Webhook Stripe (payments.py) sécurisé — vérification de signature via `STRIPE_WEBHOOK_SECRET` (nouvelle var .env), rejet 400 si signature invalide. Finalisation de paiement extraite en helper idempotent `_finalize_paid_transaction` partagé entre le polling et le webhook (DRY) → un paiement reste fiable même si l'acheteur ferme l'onglet, sans double email.
- ⚠️ Action prod : configurer l'endpoint webhook dans Stripe (`/api/payments/webhook/stripe`) et renseigner `STRIPE_WEBHOOK_SECRET`.
- Rapport d'audit complet : `/app/memory/AUDIT_2026-06.md` (P1/P2 restants : secret JWT par défaut, IP brute-force login, 401 vs 500, validation upload contact, découpage fichiers, DRY helpers).

### ✅ Correctifs sécurité P1 (TERMINÉ 15/06/2026)
- **S4** : suppression du secret JWT par défaut en dur (`config/settings.py` → fail-fast `os.environ['JWT_SECRET_KEY']`). Zéro hardcoding.
- **S5** : nouvelle fonction utilitaire `backend/utils/request_utils.py::get_client_ip` (DRY) extrayant l'IP réelle via `X-Forwarded-For` ; utilisée par register/login/accept-cgu. Corrige le comptage brute-force au login (qui utilisait l'IP du proxy K8s → blocage collectif).
- **F2** : token JWT invalide renvoie désormais 401 (au lieu de 500) sur `/me`, `/profile`, `/accept-cgu`.
- **S6** : validation des pièces jointes du formulaire de contact (`server.py`) — liste blanche MIME (images, PDF, Word, txt) + 10 Mo max. Empêche le stockage de fichiers dangereux (ex. .html/.svg servis en statique).
- Tous vérifiés par curl (auto-tests). Aucun agent de test lancé (Règle 6).

### ✅ Refactoring P2 — DRY + rangement emails (TERMINÉ 15/06/2026)
**① Helpers token reset mutualisés** : suppression des doublons dans `routes/citadelle/auth.py` → utilisation des fonctions sûres de `services/auth_service.py` (clé portée à 48 + `compare_digest` pour les 2 sites). Imports `hashlib`/`secrets` morts retirés. Testé : reset Syndicat + Citadelle OK.

**② Dépendances d'auth Citadelle centralisées** : `require_admin` / `require_citadelle_user` désormais définis une seule fois dans `routes/citadelle/dependencies.py` et importés par les 8 fichiers (blog, listings, messages, newsletter, services, settings, transactions, auth). Le Syndicat (`middleware/auth.py`) n'est pas impacté. Testé : 403 sans token, 200 admin.

**③ Emails rangés par site (package)** : `services/email_service.py` (1860 l.) converti en package `services/email_service/` structuré par site (structure validée client) :
- `core.py` (transport SMTP `_envoyer_email` + `_build_notification_base` + `send_citadelle_email`)
- `syndicat.py`
- `citadelle/` : `auth.py`, `listings.py`, `transactions.py`, `services.py`, `contact.py`, `newsletter.py`, `auctions.py`
- `__init__.py` ré-exporte tout (imports existants `from services.email_service import X` préservés). Chaque fichier < 400 lignes (Règle 17 ✅). Découpage par extraction exacte (contenu identique au caractère près).

**🐞 Bug réparé (découvert pendant ③)** : `payments.py` appelait `send_citadelle_email` qui **n'existait pas** → les emails de confirmation de paiement de service (client + admin) n'étaient jamais envoyés. Fonction `async send_citadelle_email(to, subject, html_content)` créée dans `core.py`. Testé : flux d'emails répondent 200.

**Reportés** (décision client) : ④ découpage `transactions.py` (à faire avec l'arrivée du paiement réel + futur paiement Syndicat) et ⑤ découpage `CitadelleTransactionDetail.js` (UI qui va évoluer).

### ✅ Sécurité — Migration JWT (TERMINÉ 15/06/2026)
- `python-jose` (CVE connues) remplacé par `PyJWT==2.11.0` dans `services/auth_service.py` (2 lignes : import + `except InvalidTokenError`). Algo HS256 et secret inchangés → **rétro-compatible** (aucune session cassée). `python-jose` désinstallé, `requirements.txt` mis à jour via pip freeze. Testé : login Syndicat + Citadelle OK, token invalide → 401.

### ✅ Fonctionnalité "Se souvenir de moi" + Tests anti-régression (TERMINÉ 15/06/2026)
- **Se souvenir de moi** : login Syndicat + Citadelle + Admin. Backend : `JWT_REMEMBER_ME_EXPIRE_MINUTES` (30 jours) dans settings, helper `get_access_token_expiry(remember_me)` (DRY) dans auth_service, champ `remember_me` ajouté aux modèles `UserLogin`/`CitadelleLogin`. Frontend : case à cocher sur les 3 pages de connexion (`LoginPage.js`, `CitadelleLogin.js`, `AdminLoginPage.js`) + `authService.login` envoie `remember_me`. Vérifié : 24h sans / 30 jours avec.
- **Tests automatisés (avec accord client)** : campagne anti-régression complète via testing agent → **backend 20/20, frontend 3/3 — 100% PASS, aucun bug**. Couvre : migration PyJWT, token invalide→401, S1 /api/contacts, S6 upload, dependencies Citadelle, reset DRY, emails package, remember-me, flux login + modale CGU. Suite pérenne : `backend/tests/test_anti_regression.py`. Rapport : `test_reports/iteration_3.json`.

### ✅ Déploiement VPS Production (TERMINÉ 15/06/2026)

**Infrastructure :**
- VPS Hostinger — Ubuntu 24.04 LTS — IP `187.77.168.109` — France/Paris
- Stack en production : Nginx 1.24 + PM2 + Python venv + MongoDB 7.0

**Domaines en ligne :**
- `https://syndicatducode.fr` → Le Syndicat du Code (nouvelle version complète)
- `https://lacitadellenumerique.fr` → Redirige vers `/citadelle` (La Citadelle Numérique)
- SSL Let's Encrypt sur les 2 domaines, renouvellement automatique Certbot

**Migration technique :**
- `emergentintegrations.payments.stripe.checkout` remplacé par SDK Stripe officiel (`stripe==14.4.0`)
  → `_StripeClient` wrapper async dans `payments.py` (DRY, indépendant de la plateforme Emergent)
- DB production : `syndicat_base` (nouvelle base propre, pas de migration de l'ancienne)

**Compte admin production :**
- Email : `bigpapa1981@asar.com` | Mot de passe : `Josiane03@@@!1981`
- URL : `https://syndicatducode.fr/admin-access`

**Fichiers de config production (sur VPS uniquement, non versionnés) :**
- `/var/www/syndicatducode.fr/backend/.env`
- `/var/www/syndicatducode.fr/frontend/.env`

**⚠️ Actions post-déploiement restantes :**
- Configurer le webhook Stripe dans le dashboard Stripe : `https://syndicatducode.fr/api/payments/webhook/stripe`
- Mettre à jour `STRIPE_WEBHOOK_SECRET` dans le `.env` VPS après création du webhook
- Vérifier l'email Citadelle `lagarde@lacitadellenumerique.fr` (mot de passe à confirmer)

**Refonte UX Tableau de bord membre (05/07/2026) — FAIT :**
- `CitadelleDashboard.js` repensé selon `/app/design_guidelines.json`
- En-tête Navy dégradé conservé (validé par le client)
- Rangée de 4 KPI cliquables : Annonces actives, Transactions en cours, Messages non lus + CTA "Publier une annonce" (fond Navy plein)
- Split 3 colonnes : gauche = À traiter + Mes gains + Gestion & Services (transmissions, services) ; droite = Administration (profil, factures)
- Nouveau compteur "Annonces actives" via `/api/citadelle/listings/my` (status === "active")
- Vérifié via screenshot desktop + mobile (Règle 6 : pas de testing_agent sans accord client)

**Corrections UX Espace membre (05/07/2026) — FAIT :**
- Refonte tableau de bord (`CitadelleDashboard.js`) : en-tête Navy conservé, CTA "Publier une annonce" en tête à gauche, KPI cliquables, blocs Administration (encadré bleu, gauche) + Gestion & Services (droite).
- Panneau "À traiter" intégré dans l'en-tête bleu (typo claire), limité aux 3 dernières notifs, bouton "Voir tout" → nouvelle page `/citadelle/espace-membre/notifications` (`CitadelleNotifications.js`). Chaque notif = lien vers l'action ; disparaît au traitement (recalcul backend `/member/activity`).
- Page "Mes services" (`CitadelleMyServices.js`) : services regroupés par `target_category` en encarts "Pour les vendeurs" (clair) et "Pour les acheteurs" (encart bleu, cartes sombres), aligné sur la page Services publique.
- Vérifié via screenshots (Règle 6 respectée : pas de testing_agent).

**Ajustements Services (05/07/2026) — FAIT :**
- Section "Mes commandes" retirée de "Mes services" et déplacée dans l'onglet transmissions, renommé "Transmissions & Commandes" (2 sections séparées). Libellé dashboard mis à jour.
- Services gratuits ("Inclus gratuitement") affichés en tête, sous la Transaction Sécurisée sur la page publique.
- Espacement des zones services corrigé : `space-y` ne s'appliquait pas → remplacé par marges explicites `mb-16` sur chaque encart (page publique `CitadelleServices.js` + espace membre `CitadelleMyServices.js`).

**Uniformisation page Services membre (05/07/2026) — FAIT :**
- La page "Mes services" (espace membre) réutilise désormais `ServiceHeroBanner` pour afficher la Transaction Sécurisée Premium en bandeau bleu (ruban obligatoire + étapes "Comment ça fonctionne"), comme la page Services publique.
- Catégorie "Services communs" supprimée (le service commun devient le hero). `ServiceDetailModal` ("En savoir plus") + `ServiceCheckoutModal` intégrés. Espacement `mb-16` cohérent.

*Mise à jour : 15/06/2026*

## 🔧 Session 06/2026 — Retrait de proposition acheteur (PREVIEW)
- **Nouvelle route** `POST /api/citadelle/transactions/{id}/withdraw-offer` (`routes/citadelle/transactions.py`) : l'acheteur peut abandonner sa proposition tant qu'aucun paiement n'a eu lieu — statuts autorisés `offer_sent`, `offer_countered`, `offer_accepted` (donc **même après acceptation du vendeur**). Aucun frais (aucun fonds engagé). Passe la transaction en `cancelled` + `cancelled_by_buyer=True` + message système.
- **Frontend** (`CitadelleTransactionDetail.js`) : bouton « Abandonner ma proposition » (`data-testid="btn-withdraw-offer"`) visible pour l'acheteur sur ces 3 statuts + modal de confirmation (`withdraw-confirm-btn`).
- **Validé (curl)** : retrait en `offer_sent` OK ; blocage 400 sur statut non autorisé (tx déjà annulée). Le cas `offer_accepted` emprunte le même chemin (statut explicitement autorisé). Règle 6 respectée (pas de testing_agent).

## 🔧 Session 06/2026 — Refus de contre-offre acheteur + jeu de données de test (PREVIEW)
- **Nouvelle route** `POST /api/citadelle/transactions/{id}/refuse-counter` : l'acheteur refuse la contre-offre du vendeur (statut `offer_countered` → `offer_refused`, fin de négociation). 403 si non-acheteur, 400 si pas de contre-offre.
- **Frontend** (`CitadelleTransactionDetail.js`) : bouton « Refuser la contre-offre » (`data-testid="btn-refuse-counter"`) à côté de « Accepter la contre-offre » dans le bloc `offer_countered`.
- **Jeu de données de test** : `backend/scripts/seed_test_transactions.py` (idempotent, marqueur `test_scenario_seed`) — 5 transactions acheteur=test.acheteur / vendeur=test.vendeur couvrant offer_sent, offer_countered, offer_accepted, payment_done, completed. Détail dans `test_credentials.md`.
- **Validé (testing_agent iteration_14, avec accord client)** : backend 9/9 ciblés (withdraw-offer + refuse-counter, transitions + 400/403), frontend 3/3 (boutons + modals). 100% PASS, aucun bug. Suite : `backend/tests/test_citadelle_withdraw_refuse.py`.

## 🔧 Session 06/2026 — Négociation ouverte en va-et-vient illimité (PREVIEW)
- **Décision client** : la négociation ne se termine QUE par un accord (accept) ou l'abandon volontaire de l'acheteur (withdraw-offer). L'acheteur ne clôture jamais.
- **Route `refuse-counter` SUPPRIMÉE**, remplacée par **`POST /api/citadelle/transactions/{id}/buyer-counter`** : depuis `offer_countered`, l'acheteur propose un nouveau montant → la transaction repasse en `offer_sent` (offer_amount mis à jour, counter effacé) et le vendeur peut de nouveau accepter/refuser/contre-proposer. Va-et-vient illimité.
- Le bouton **« Refuser » du vendeur reste** (le vendeur peut décliner définitivement → `offer_refused`).
- **Frontend** (`CitadelleTransactionDetail.js`) : bouton acheteur « Faire une nouvelle proposition » (`data-testid="btn-buyer-counter"`, remplace `btn-refuse-counter`) ouvre le modal de contre-offre (rendu générique : titre + endpoint `buyer-counter`/`counter` selon le rôle).
- **Validé (curl)** : boucle complète offre→contre-offre vendeur→nouvelle proposition acheteur→contre-offre vendeur ; blocage 400 hors `offer_countered`.

## 🔧 Session 06/2026 — Pièces jointes dans les messageries (PREVIEW)
- **Périmètre (choix client)** : les 3 messageries (transaction, pré-vente, litige) + widget de chat flottant. Formats : images (JPG/PNG/WebP) + PDF. Max **25 Mo/fichier**, **5 fichiers/message**.
- **Backend** : module partagé `utils/attachments.py` (modèle `Attachment`, `save_attachment`, `validate_attachments`, constantes). Endpoint unique `POST /api/citadelle/messages/upload-attachment` (auth user). Fichiers stockés dans `uploads/citadelle/attachments/`, servis via `/api/uploads/...`. Sécurité : type MIME liste blanche, taille max, URL de pièce jointe validée (préfixe autorisé) contre l'injection. Modèles messages étendus (`attachments`), `content` rendu optionnel (message texte OU pièce jointe requis).
- **Frontend** : composant réutilisable `components/citadelle/messageAttachments.js` (`AttachmentButton` trombone, `AttachmentPreview` avant envoi, `MessageAttachments` rendu bulle — miniatures images cliquables + puces PDF). Câblé dans `CitadelleConversationDetail.js`, `CitadelleTransactionDetail.js` (messagerie + litige) et `CitadelleChatWidget.js`. Réutilise `getListingImageUrl`/`isImageFile`/`getFileLabel` (DRY).
- **Validé (curl)** : upload PNG/PDF OK, fichier servi 200, message avec pièce jointe (content vide) OK, message vide→400, URL forgée→400, type .txt→400. Frontend compilé, `attachment-btn` détecté au rendu authentifié.

## 🔧 Session 06/2026 — Anti-contournement sur les pièces jointes PDF (PREVIEW)
- **Choix client** : PDF uniquement (pas d'OCR image), **blocage** si coordonnées détectées.
- **Backend** : `utils/message_sanitizer.py` → nouveau helper `contient_contact(texte)` (réutilise les patterns email/téléphone, DRY). `utils/attachments.py` → `save_attachment` extrait le texte des PDF via `pypdf` (déjà installé) et **refuse l'upload (400)** si un email/téléphone est détecté ; PDF illisible/chiffré = non bloqué (log warning). Images non analysées (décision client).
- **Frontend** : `AttachmentButton` affiche désormais le message précis du serveur (`err.response.data.detail`) en cas de refus.
- **Validé (curl)** : PDF avec email+téléphone → 400 (message explicite), PDF propre → 200, PNG → 200.

## 🔧 Session 06/2026 — Signalement de conversation à l'admin (PREVIEW)
- **Choix client** : signalement sur les 2 messageries (transaction + pré-vente) + widget ; motif (Arnaque/Contournement/Contenu inapproprié/Litige/Autre) + message ; côté admin = page dédiée **et** email.
- **Backend** : nouveau module `routes/citadelle/reports.py` (collection `citadelle_reports`) — `POST /api/citadelle/reports` (user, vérifie participation à la conversation), `GET /api/citadelle/admin/reports?status=` (admin), `PATCH /api/citadelle/admin/reports/{id}` (admin, statuts open/reviewed/resolved + notes). Email admin via `services/email_service/citadelle/report.py` (`send_citadelle_report_email`). Router enregistré dans `routes/citadelle/__init__.py`.
- **Frontend** : composant réutilisable `components/citadelle/ReportConversationButton.js` (bouton « Signaler » + modal motif/message, toast). Câblé dans `CitadelleTransactionDetail.js` (transaction), `CitadelleConversationDetail.js` (pré-vente), `CitadelleChatWidget.js` (mode conversation uniquement, pas en litige). Nouvelle page admin `AdminCitadelleReports.js` (route `/syndicat-admin/citadelle/signalements`, filtres statut, notes, changement de statut) + carte « Signalements » dans le hub admin.
- **Validé (curl)** : création signalement (transaction) OK, motif invalide→400, conversation inexistante→404, liste admin OK, maj statut OK, accès non-admin→403.

## 🔧 Session 06/2026 — Modération des membres + sidebar Signalements (PREVIEW)
- **Choix client** : bannissement = suppression logique (connexion bloquée + annonces retirées, historique conservé) ; sanctions applicables depuis Signalements ET Membres Citadelle.
- **Backend** : `routes/citadelle/moderation.py` — `POST /admin/members/{id}/warn|suspend|ban|reactivate` (require_admin). Warn = trace `moderation_log`. Suspend (weeks 1-2) = status suspended + `suspended_until`. Ban = status banned + retrait annonces actives (→ rejected). Chaque action → email membre (`services/email_service/citadelle/moderation.py`, `send_citadelle_moderation_email`).
- **Auth** : login Citadelle bloque `banned` (403) et `suspended` jusqu'à `suspended_until` (auto-réactivation à expiration). `require_citadelle_user` (dependencies.py, désormais avec `set_database`) re-vérifie le statut en base à chaque requête protégée (ne se fie pas au seul token).
- **Signalements** enrichis avec `buyer_id`/`seller_id` (pour cibler les sanctions).
- **Frontend** : sidebar admin → entrée « Signalements » avec **badge rouge** du nombre de signalements ouverts (polling 60s). Composant réutilisable `components/admin/MemberModerationActions.js` (Sanctionner : avertissement / suspension 1-2 sem / bannissement + Réactiver, modal motif+note). Câblé dans `AdminCitadelleReports.js` (par participant) et `AdminCitadelleUsers.js` (statut 3 états actif/suspendu/banni + compteur d'avertissements + actions). Fix contraste : conteneur page = `color: var(--admin-text)`.
- **Validé (curl + capture)** : warn/suspend/ban/reactivate OK ; login suspendu→403, réactivé→200 ; page Signalements lisible, badge « 2 », 8 boutons Sanctionner.

## 🔧 Session 06/2026 — Lecture de la conversation signalée (PREVIEW)
- **Backend** : `GET /api/citadelle/admin/reports/{id}/conversation` (require_admin) → renvoie messages (+ dispute_messages pour les transactions) avec pièces jointes, participants, titre annonce. Renvoie `found:false` si la conversation n'existe plus.
- **Frontend** : bouton « Voir la conversation » (`report-view-conversation`) sur chaque carte de signalement → modal (`conversation-modal`) affichant l'échange complet (expéditeur, date, contenu, **pièces jointes** via `MessageAttachments` réutilisé). Messages système filtrés.
- **Validé (curl + capture)** : endpoint renvoie 4 messages, modal affiche les messages acheteur/vendeur lisibles.

## 🔧 Session 06/2026 — Annonces « contenu adulte » (PREVIEW)
- **Choix client** : case « Contenu adulte » à la création/édition ; si cochée → aucune image ni lien du site (jamais affichés) ; carte visible par tous avec badge « Contenu adulte 18+ » ; ouverture du détail réservée aux comptes **connectés**.
- **Backend** (`listings.py`) : champ `is_adult` sur ListingCreate/Update. À la création et à l'édition, si adulte → `images=[]` et `url_preview=None` forcés. Le champ `is_adult` est renvoyé par la liste et le détail.
- **Frontend** : case à cocher dans `CitadelleCreateListing.js` et `CitadelleEditListing.js` (masque les champs URL + upload images quand cochée). `ListingCard.js` : cover sombre « 18+ » + badge rouge « Contenu adulte 18+ » (pas d'image). `CitadelleListingDetail.js` : si `is_adult && !isAuthenticated` → écran de restriction (`adult-restricted`) « consultation réservée aux comptes vérifiés » + bouton connexion ; sinon cover « 18+ » à la place de la galerie.
- **Validé (curl + capture)** : création adulte purge images/url (is_adult=true, images=[], url=None), liste renvoie is_adult ; écran de restriction confirmé (non connecté).
