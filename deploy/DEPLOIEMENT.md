# Guide de déploiement VPS — La Citadelle Numérique / Syndicat du Code

## Architecture des domaines

| Domaine | Usage |
|---|---|
| `syndicatducode.fr` | Le Syndicat du Code (plateforme principale) |
| `lacitadellenumerique.fr` | La Citadelle Numérique (marketplace) |

> Les deux domaines partagent le même build React (`/var/www/syndicatducode.fr/frontend/build`) et le même backend FastAPI (`127.0.0.1:8001`).

---

## Règles Nginx critiques (NE PAS MODIFIER)

### syndicatducode.fr

1. **SEC-001** : `location ^~ /api/uploads/citadelle/documents/ { return 403; }`
   - Bloque l'accès direct aux documents KYC au niveau réseau
   - DOIT être AVANT `location /api/uploads/`

2. **Séparation des marques** : `location ^~ /citadelle { return 301 https://www.lacitadellenumerique.fr$request_uri; }`
   - Empêche les utilisateurs d'accéder à La Citadelle via le mauvais domaine
   - DOIT être AVANT `location /`

### lacitadellenumerique.fr

- SSL via Certbot : `/etc/letsencrypt/live/lacitadellenumerique.fr/`
- Dynamic rendering (bots) : bloc `lcn_is_bot` + `/__prerender/`
- Centre d'aide : proxy vers `/api/aide`

---

## Procédure de déploiement

```bash
# 1. Récupérer le code
cd /var/www/syndicatducode.fr
git pull origin main-projet-10-english-version

# 2. Build frontend
cd frontend && yarn install && yarn build

# 3. Redémarrer le backend
pm2 restart syndicat-backend --update-env

# 4. Vérifier Nginx (NE PAS modifier les configs, elles sont correctes)
sudo nginx -t

# 5. Vérifications post-déploiement
curl -I https://syndicatducode.fr/api/uploads/citadelle/documents/  # doit retourner 403
curl -I https://syndicatducode.fr/citadelle/                        # doit retourner 301 vers lacitadellenumerique.fr
curl -s https://lacitadellenumerique.fr/api/ | python3 -m json.tool  # doit retourner {"status":"online"}
```

---

## Variables d'environnement requises (.env backend)

- `TRANSMISSION_ENC_KEY` : clé Fernet pour chiffrement IBAN/BIC (SEC-002)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` : OAuth Google (Citadelle)
- `MONGO_URL` / `DB_NAME` : connexion MongoDB

## Google OAuth (Google Cloud Console)

Client : `955662735538-77ddfmdnjt77f4sj4u3oc29n639sb4uq.apps.googleusercontent.com`

**Origines JavaScript autorisées :**
- `https://lacitadellenumerique.fr`
- `https://www.lacitadellenumerique.fr`

**URI de redirection autorisées :**
- `https://lacitadellenumerique.fr/auth/google`
- `https://www.lacitadellenumerique.fr/auth/google`

> Ne JAMAIS ajouter `syndicatducode.fr` dans ces listes.
