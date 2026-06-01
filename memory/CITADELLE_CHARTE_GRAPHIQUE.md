# Charte Graphique — La Citadelle Numérique
*Sauvegardée le 02/06/2026 — À consulter avant tout développement frontend*

---

## Identité de marque

| Élément | Valeur |
|---------|--------|
| Nom | La Citadelle Numérique |
| Domaine | lacitadellenumerique.fr |
| Signature principale | Achetez. Vendez. Sécurisez. |
| Signature secondaire | La plateforme française dédiée à l'achat et à la vente d'actifs numériques. |
| Promesse | Vendez votre projet numérique en toute confiance. |

## Positionnement

**Marché :**
- Achat et vente de sites internet
- SaaS
- E-commerce
- Applications web
- Actifs numériques

**Valeurs :**
- Confiance
- Sécurité
- Transparence
- Professionnalisme
- Accompagnement

---

## Palette de couleurs

### Couleurs principales

| Nom | Hex | Utilisation |
|-----|-----|-------------|
| Bleu Citadelle | `#0F2747` | Header, Footer, Boutons principaux, Titres importants |
| Bleu Nuit | `#081729` | Fonds premium, Sections foncées, Contrastes, Hero background |
| Or Prestige | `#C9A45C` | Icônes, Badges, Bordures premium, États actifs |
| Or Clair | `#D9BB7A` | Survols, Effets visuels, Détails |

### Couleurs secondaires

| Nom | Hex | Utilisation |
|-----|-----|-------------|
| Blanc | `#FFFFFF` | Fonds cartes, Texte sur fond sombre |
| Gris Clair | `#F5F7FA` | Fond général des pages (accueil, liste) |
| Gris Texte | `#5F6672` | Texte secondaire, descriptions |
| Gris Bordure | `#DDE3EA` | Bordures cartes, séparateurs |

### Couleurs système

| Nom | Hex | Usage |
|-----|-----|-------|
| Succès | `#22C55E` | Badge Vérifié, Paiement validé, Transaction terminée |
| Attention | `#F59E0B` | Badge En attente |
| Erreur | `#DC2626` | Badge Litige, Paiement refusé |

### Dégradé Hero

```css
background: linear-gradient(135deg, #081729 0%, #0F2747 100%);
/* Avec accents or : border ou text en #C9A45C */
```

---

## Typographie

| Usage | Police | Style |
|-------|--------|-------|
| Titres H1/H2/H3 | Montserrat | Bold (700) — Moderne et premium |
| Corps de texte | Inter | Regular (400) — Très lisible |
| Import Google Fonts | `Montserrat:wght@400;600;700;800` + `Inter:wght@400;500;600` |

---

## Composants UI

### Boutons

```css
/* Bouton Primaire */
.btn-primary {
  background: #0F2747;
  color: #FFFFFF;
  border-radius: 8px;
}
.btn-primary:hover { background: #16355F; }

/* Bouton Premium (Or) */
.btn-premium {
  background: #C9A45C;
  color: #081729;
  border-radius: 8px;
  font-weight: 700;
}
.btn-premium:hover { background: #D9BB7A; }
```

### Cartes annonces

```css
.listing-card {
  background: #FFFFFF;
  border: 1px solid #DDE3EA;
  border-radius: 12px;
  transition: box-shadow 0.2s ease;
}
.listing-card:hover {
  box-shadow: 0 12px 24px rgba(15, 39, 71, 0.12);
}
```

### Badges

| Badge | Couleur fond | Couleur texte |
|-------|-------------|---------------|
| Vérifié | `#22C55E` | `#FFFFFF` |
| Recommandé | `#C9A45C` | `#081729` |
| Transaction Sécurisée | `#0F2747` | `#FFFFFF` |
| En attente | `#F59E0B` | `#FFFFFF` |
| Litige | `#DC2626` | `#FFFFFF` |

---

## Style général

**Apparence cible :**
- Moderne, Premium, Professionnelle, Épurée

**Éviter absolument :**
- Néons
- Couleurs criardes
- Effets futuristes excessifs
- Illustrations cartoon ou enfantines

**Style espace membre :** Proche de Stripe / Notion / Linear — simple et efficace

---

## Icônes

- **Bibliothèque :** Lucide React (déjà installée dans le projet)
- **Style :** Outline moderne, traits fins, cohérents
- **Icônes thématiques :** Shield, Castle, Lock, TrendingUp, FileText, CheckCircle, Vault

---

## Illustrations

- Style vectoriel professionnel
- Isométrique léger si nécessaire
- Pas de cartoon ni d'illustrations enfantines

---

## Style des pages

### Accueil
- Fond général : `#F5F7FA`
- Section Hero : dégradé `#081729 → #0F2747` avec accents or

### Fiches annonces
- Aspect marketplace premium
- Mettre en avant : prix, revenus mensuels, trafic, badges de confiance

### Espace membre
- Style épuré, proche Stripe/Notion
- Simple, efficace, sans surcharge visuelle

---

## Ton rédactionnel

**Toujours :**
- Professionnel
- Rassurant
- Transparent

**Éviter :**
- "Gagnez des milliers d'euros facilement"
- "Devenez riche"

**Privilégier :**
- Confiance
- Valorisation
- Accompagnement
- Sécurisation

---

## Logo — Analyse détaillée

**Éléments graphiques du logo :**
- Château/citadelle 3D en bleu marine profond (`#0F2747` / `#081729`)
- Arc doré supérieur encadrant la citadelle
- Porte monumentale avec grilles dorées (lumière chaude intérieure)
- Drapeau au sommet de la tour
- Icône bouclier doré sous le nom
- Lignes décoratives dorées horizontales comme séparateurs

**Typographie du logo :**
- "LA" : petite taille, Montserrat fin
- "CITADELLE" : grande taille, serif Bold avec lettre A comportant un triangle intérieur stylisé
- "NUMÉRIQUE" : sans-serif regular, or clair
- Tagline "ACHETEZ. VENDEZ. SÉCURISEZ. DÉVELOPPEZ." : sans-serif très fin, espacé

**URL du logo original :**
https://customer-assets.emergentagent.com/job_1c14b4e1-8875-44a7-8d73-a83e43a5b8e2/artifacts/26l0mgmd_ChatGPT%20Image%202%20juin%202026%2C%2000_39_40.png

---

## Variables CSS recommandées (à créer dans index.css Citadelle)

```css
:root {
  /* Couleurs principales */
  --citadelle-blue: #0F2747;
  --citadelle-night: #081729;
  --citadelle-gold: #C9A45C;
  --citadelle-gold-light: #D9BB7A;

  /* Couleurs secondaires */
  --citadelle-white: #FFFFFF;
  --citadelle-bg: #F5F7FA;
  --citadelle-text-muted: #5F6672;
  --citadelle-border: #DDE3EA;

  /* Système */
  --citadelle-success: #22C55E;
  --citadelle-warning: #F59E0B;
  --citadelle-error: #DC2626;

  /* Typographie */
  --font-title: 'Montserrat', sans-serif;
  --font-body: 'Inter', sans-serif;
}
```
