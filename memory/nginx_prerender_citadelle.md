# Phase B — Dynamic Rendering (Nginx VPS) — La Citadelle Numérique

Objectif : servir aux **robots** (Googlebot, Bingbot, IA…) la version HTML pré-rendue
(`/api/prerender/...`), et à tous les **humains** l'app React (SPA) comme aujourd'hui.
Le pré-rendu est strictement limité aux routes publiques `/citadelle*`.

## 1. Bloc `map` — détection des robots
À placer dans le contexte `http { ... }` (ex. `/etc/nginx/nginx.conf`), **une seule fois** :

```nginx
map $http_user_agent $lcn_is_bot {
    default 0;
    "~*(googlebot|bingbot|yandexbot|duckduckbot|baiduspider|slurp|applebot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|pinterest|semrushbot|ahrefsbot|gptbot|oai-searchbot|chatgpt-user|perplexitybot|claudebot|google-extended|bytespider|amazonbot)" 1;
}
```

## 2. Dans le `server { }` de `lacitadellenumerique.fr`
Ajouter les 3 locations ci-dessous. Elles priment sur le `location /` grâce au préfixe `^~`.
**Ne pas toucher** aux `location = /sitemap.xml`, `= /sitemap-citadelle.xml`, `/aide`, `/api/`
déjà en place (ils gardent leur comportement).

```nginx
    # Les robots sur /citadelle* -> pré-rendu serveur ; humains -> SPA
    location ^~ /citadelle/ {
        if ($lcn_is_bot) { rewrite ^ /__prerender$uri last; }
        try_files $uri /index.html;
    }
    location = /citadelle {
        if ($lcn_is_bot) { rewrite ^ /__prerender/citadelle last; }
        try_files $uri /index.html;
    }

    # Proxy interne vers le backend de pré-rendu, avec repli SPA si route non couverte (404)
    location ^~ /__prerender/ {
        internal;
        proxy_intercept_errors on;
        error_page 404 502 503 504 = @lcn_spa_fallback;
        rewrite ^/__prerender/(.*)$ /api/prerender/$1 break;
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location @lcn_spa_fallback {
        try_files /index.html =404;
    }
```

## 3. Application
```bash
nginx -t && systemctl reload nginx
```

## 4. Vérification en production
```bash
# Robot -> doit renvoyer du HTML rempli (<title>, <h1>, JSON-LD)
curl -s -A "Googlebot" https://lacitadellenumerique.fr/citadelle/annonces | head -40
curl -s -A "Googlebot" https://lacitadellenumerique.fr/citadelle/blog/<un-slug> | grep -i "<title>\|application/ld+json"

# Humain -> doit renvoyer l'app React (<div id="root">)
curl -s -A "Mozilla/5.0" https://lacitadellenumerique.fr/citadelle/annonces | grep -i 'id="root"'
```

## Notes
- Le backend expose `GET /api/prerender/{path}` (méthodes GET + HEAD).
- Routes couvertes : accueil, annonces (liste + fiche), services, vendre, estimation,
  blog (liste + article), guides, chroniques, parutions, CGU, CGV, mentions légales,
  confidentialité, contact.
- Les fiches d'annonces non actives ou « adulte » sont rendues en `noindex, follow`.
- Aucune configuration n'est requise pour le domaine `syndicatducode.fr` (non concerné).
