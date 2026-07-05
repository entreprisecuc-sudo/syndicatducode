# Credentials de test — La Citadelle Numérique & Le Syndicat du Code

## Admin (commun aux deux plateformes)
- **Email** : bigpapa1981@asar.com
- **Mot de passe** : Josiane03@@@!1981
- **URL admin** : /papaenmousse1981

## Utilisateur test Citadelle (client — créé par le testing agent)
- **Email** : marie.testui@citadelle-test.fr
- **Mot de passe** : TestUI2026!
- **ID** : 26c042ac-fbdc-471e-b791-edd15325de7e

## Notes
- Route admin dashboard : /syndicat-admin
- App alertes admin : /admin-live (Papa en Mousse)
- Stripe en mode LIVE (production) — cs_live_... sessions
- Page Services : /citadelle/services

## Comptes démo Transmission d'actif (créés 05/07/2026 — preview)
- **Vendeur** : test.vendeur@citadelle.fr / DemoVendeur2026!
- **Acheteur** : test.acheteur@citadelle.fr / DemoAcheteur2026!
- Transmission démo finalisée : dossier **TR-2026-00003** (actif « Boutique Zenith »)
- Espace membre → « Mes transmissions » : acheteur = Attestation complète, vendeur = Titre de Cession (sans accès)

## Transactions de test (script : backend/scripts/seed_test_transactions.py — 06/2026)
Acheteur = test.acheteur@citadelle.fr · Vendeur = test.vendeur@citadelle.fr
Réexécuter le script pour réinitialiser (idempotent, marqueur `test_scenario_seed`).
Espace membre → « Transmissions & commandes » (ou dashboard) → ouvrir chaque transaction.
1. **offer_sent** (Blog Cuisine, 5 500 €) → acheteur : bouton « Abandonner ma proposition » | vendeur : Accepter/Refuser/Contre-offre
2. **offer_countered** (SaaS Factures, contre-offre 13 000 €) → acheteur : Accepter la contre-offre OU abandonner
3. **offer_accepted** (Boutique Déco, 9 500 €) → acheteur : Payer OU **Abandonner (sans frais — cas clé)**
4. **payment_done** (Newsletter Crypto, 8 000 €, payé il y a 8 j) → acheteur : Ouvrir litige / Annuler | vendeur : Transmettre les accès
5. **completed** (YouTube Voyage, 16 000 €) → acheteur : voir les accès transmis | vendeur : gains encaissés
