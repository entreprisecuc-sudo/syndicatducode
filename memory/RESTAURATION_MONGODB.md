# Stratégie de Restauration MongoDB — Le Syndicat du Code

**Version :** 1.0 — 01/06/2026  
**Base de données :** `test_database` (MongoDB)  
**Format de sauvegarde :** ZIP contenant 24 fichiers JSON (1 par collection)

---

## 1. Prérequis

### Outils nécessaires
| Outil | Usage | Installation |
|-------|-------|-------------|
| `mongoimport` | Restauration via CLI (recommandé) | Inclus dans [MongoDB Database Tools](https://www.mongodb.com/try/download/database-tools) |
| `Python 3.8+` + `pymongo` | Restauration via script (si mongoimport non dispo) | `pip install pymongo` |
| `unzip` | Décompresser le fichier ZIP | Natif Linux/macOS, [7-Zip](https://7-zip.org/) sur Windows |

### Informations de connexion
Récupérer depuis le fichier `/app/backend/.env` :
```
MONGO_URL=<url de connexion MongoDB>
DB_NAME=<nom de la base de données>
```

> ⚠️ **Ne jamais hardcoder** ces valeurs. Toujours les lire depuis `.env`.

---

## 2. Préparation : Décompresser le fichier ZIP

```bash
# Créer un dossier de travail
mkdir -p /tmp/restore_syndicat

# Décompresser le ZIP de sauvegarde
unzip backup_syndicat_YYYY-MM-DD_HHMMSS.zip -d /tmp/restore_syndicat/

# Vérifier le contenu (doit lister 24 fichiers .json)
ls /tmp/restore_syndicat/
```

---

## 3. Restauration Complète (toutes collections)

### Option A — Via mongoimport (recommandé)

```bash
# Définir les variables d'environnement
MONGO_URL="votre_url_mongodb"
DB_NAME="test_database"
RESTORE_DIR="/tmp/restore_syndicat"

# Restaurer toutes les collections en boucle
for file in "$RESTORE_DIR"/*.json; do
    collection=$(basename "$file" .json)
    echo "Restauration de : $collection"
    mongoimport \
        --uri="$MONGO_URL" \
        --db="$DB_NAME" \
        --collection="$collection" \
        --file="$file" \
        --jsonArray \
        --mode=upsert
    echo "  -> $collection restaurée"
done

echo "Restauration terminée."
```

**Explication des options :**
- `--jsonArray` : les fichiers sont des tableaux JSON `[{...}, {...}]`
- `--mode=upsert` : insère si inexistant, met à jour si le document existe déjà (idempotent)

---

### Option B — Via script Python (si mongoimport non disponible)

```python
"""
Script de restauration MongoDB depuis les fichiers JSON du backup.
Usage : python restore.py --mongo-url <url> --db <db_name> --dir <dossier_backup>
"""

import json
import argparse
from pathlib import Path
import pymongo

def restore_collection(db, collection_name: str, filepath: Path) -> int:
    """Restaure une collection depuis un fichier JSON. Retourne le nombre de documents insérés."""
    with open(filepath, "r", encoding="utf-8") as f:
        documents = json.load(f)

    if not documents:
        print(f"  -> {collection_name} : vide, ignorée")
        return 0

    collection = db[collection_name]
    # Upsert sur _id pour idempotence
    inserted = 0
    for doc in documents:
        if "_id" in doc:
            collection.replace_one({"_id": doc["_id"]}, doc, upsert=True)
        else:
            collection.insert_one(doc)
        inserted += 1

    return inserted


def main():
    parser = argparse.ArgumentParser(description="Restauration MongoDB — Le Syndicat du Code")
    parser.add_argument("--mongo-url", required=True, help="URL de connexion MongoDB")
    parser.add_argument("--db", required=True, help="Nom de la base de données")
    parser.add_argument("--dir", required=True, help="Dossier contenant les fichiers JSON")
    args = parser.parse_args()

    restore_dir = Path(args.dir)
    json_files = sorted(restore_dir.glob("*.json"))

    if not json_files:
        print(f"ERREUR : Aucun fichier JSON trouvé dans {restore_dir}")
        return

    client = pymongo.MongoClient(args.mongo_url)
    db = client[args.db]

    print(f"Connexion établie — Base : {args.db}")
    print(f"Fichiers à restaurer : {len(json_files)}\n")

    total_docs = 0
    for filepath in json_files:
        collection_name = filepath.stem
        print(f"Restauration : {collection_name}")
        count = restore_collection(db, collection_name, filepath)
        print(f"  -> {count} document(s) traité(s)")
        total_docs += count

    client.close()
    print(f"\nRestauration terminée — {total_docs} documents traités au total.")


if __name__ == "__main__":
    main()
```

**Utilisation :**
```bash
python restore.py \
    --mongo-url "mongodb://localhost:27017" \
    --db "test_database" \
    --dir "/tmp/restore_syndicat"
```

---

## 4. Restauration Partielle (une seule collection)

Utile pour restaurer uniquement `users`, `invoices`, etc. sans toucher au reste.

```bash
# Via mongoimport (restaurer uniquement la collection 'users')
mongoimport \
    --uri="$MONGO_URL" \
    --db="test_database" \
    --collection="users" \
    --file="/tmp/restore_syndicat/users.json" \
    --jsonArray \
    --mode=upsert
```

---

## 5. Vérifications Post-Restauration

### 5.1 Comptage rapide des documents

```bash
# Vérifier le nombre de documents dans chaque collection
mongosh "$MONGO_URL/test_database" --eval "
  db.getCollectionNames().forEach(name => {
    print(name + ' : ' + db[name].countDocuments())
  })
"
```

### 5.2 Vérification via l'interface admin

1. Se connecter à `/syndicat-admin`
2. Aller sur **Sauvegarde des Données** → cliquer **Actualiser**
3. Vérifier que les compteurs correspondent aux valeurs de la sauvegarde

### 5.3 Test fonctionnel minimal

| Action | URL | Résultat attendu |
|--------|-----|-----------------|
| Connexion admin | `/syndicat-admin` | Tableau de bord chargé |
| Liste utilisateurs | `/syndicat-admin/utilisateurs` | Utilisateurs visibles |
| Stats globales | `GET /api/admin/stats` | Compteurs cohérents |

---

## 6. Restauration depuis Excel (cas manuel)

Le fichier Excel est un **complément de lecture** (audit, analyse), pas la source principale pour une restauration automatisée. Pour une restauration depuis Excel :

1. Ouvrir le fichier `.xlsx` dans Excel / LibreOffice
2. Chaque onglet = une collection MongoDB
3. Copier-coller les données dans un outil comme [MongoDB Compass](https://www.mongodb.com/products/tools/compass) (import JSON/CSV)

> ⚠️ Les champs `_id` dans Excel sont des strings. Si vous réimportez via Compass, MongoDB créera de nouveaux `_id` — cela peut casser les relations entre collections. **Préférer toujours le ZIP JSON pour une restauration.**

---

## 7. Points d'Attention

| Point | Détail |
|-------|--------|
| **Indexes** | `mongoimport` restaure les données mais pas les indexes. Redémarrer l'application après restauration : les indexes sont recréés automatiquement au démarrage (`server.py`) |
| **Mots de passe** | Les `password_hash` sont restaurés tels quels (bcrypt). Les utilisateurs peuvent se reconnecter normalement |
| **Fichiers uploadés** | Le ZIP JSON ne contient pas les fichiers physiques du dossier `/uploads`. Sauvegarder séparément ce dossier si nécessaire |
| **Mode upsert** | `--mode=upsert` est idempotent : rejouer la restauration plusieurs fois est sans danger |
| **Ordre de restauration** | Respecter l'ordre `users` → `profiles` → reste pour éviter les incohérences de références |

---

## 8. Fréquence recommandée

| Type | Fréquence | Méthode |
|------|-----------|---------|
| Export de précaution | Avant chaque déploiement | Bouton "Exporter JSON (ZIP)" dans l'admin |
| Sauvegarde régulière | Hebdomadaire (à configurer) | Auto-backup Google Drive (à activer) |
| Archive mensuelle | Mensuelle | Stocker le ZIP en lieu sûr hors du serveur |

---

*Document créé le 01/06/2026 — À mettre à jour si l'architecture MongoDB évolue.*
