#!/bin/bash
# =============================================================================
# Script de déploiement VPS — La Citadelle Numérique & Le Syndicat du Code
# À exécuter sur le VPS Hostinger après un git pull
# =============================================================================

set -e  # Arrête le script en cas d'erreur

BACKEND_DIR="/var/www/syndicatducode/backend"   # ← Adapter si nécessaire
FRONTEND_DIR="/var/www/syndicatducode/frontend"  # ← Adapter si nécessaire
NGINX_ROOT="/var/www/syndicatducode/build"        # ← Dossier servi par Nginx

echo "========================================================"
echo "  Déploiement — Syndicat du Code / Citadelle Numérique  "
echo "========================================================"

# ── 1. Récupérer le code depuis GitHub ──────────────────────────────────────
echo ""
echo "[1/6] Mise à jour du code depuis GitHub..."
git pull origin main

# ── 2. Dépendances backend ───────────────────────────────────────────────────
echo ""
echo "[2/6] Installation des dépendances Python..."
cd "$BACKEND_DIR"
pip install -r requirements.txt

# ── 3. Fichiers VAPID (push notifications) ──────────────────────────────────
echo ""
echo "[3/6] Vérification des clés VAPID..."
mkdir -p "$BACKEND_DIR/config"

if [ ! -f "$BACKEND_DIR/config/vapid_private.pem" ]; then
    echo "  ⚠️  vapid_private.pem manquant — à créer manuellement (voir guide ci-dessous)"
fi
if [ ! -f "$BACKEND_DIR/config/vapid_public.pem" ]; then
    echo "  ⚠️  vapid_public.pem manquant — à créer manuellement (voir guide ci-dessous)"
fi

# ── 4. Variables d'environnement backend ─────────────────────────────────────
echo ""
echo "[4/6] Vérification des variables d'environnement..."
if ! grep -q "VAPID_PUBLIC_KEY" "$BACKEND_DIR/.env"; then
    echo "  ⚠️  VAPID_PUBLIC_KEY manquant dans .env — à ajouter manuellement"
fi
if ! grep -q "VAPID_SUBJECT" "$BACKEND_DIR/.env"; then
    echo "  ⚠️  VAPID_SUBJECT manquant dans .env — à ajouter manuellement"
fi
echo "  ✅ Variables vérifiées"

# ── 5. Rebuild du frontend ───────────────────────────────────────────────────
echo ""
echo "[5/6] Build du frontend React..."
cd "$FRONTEND_DIR"
yarn install --frozen-lockfile
yarn build

# Copier le build vers le dossier Nginx
cp -r build/* "$NGINX_ROOT/"
echo "  ✅ Frontend buildé et copié vers $NGINX_ROOT"

# ── 6. Redémarrage du backend ────────────────────────────────────────────────
echo ""
echo "[6/6] Redémarrage du backend (PM2)..."
pm2 restart backend    # ← Adapter au nom de ton processus PM2

echo ""
echo "========================================================"
echo "  ✅ Déploiement terminé !"
echo "========================================================"
