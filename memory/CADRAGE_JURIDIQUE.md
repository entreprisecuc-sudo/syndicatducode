# Cahier de Cadrage Juridique & Métier
## La Citadelle Numérique — JOERKE.B SASU
### Document préparatoire à la rédaction des CGU, CGV, Conditions de Transaction Sécurisée, Politique de Litiges, Mentions Légales, Politique de Confidentialité

> ⚠️ Ce document est un cahier d'analyse et de cadrage. Il ne constitue pas un document juridique opposable. Il est destiné à préparer la rédaction des documents légaux définitifs avec un juriste ou avocat spécialisé.

---

## 1. IDENTIFICATION DE LA SOCIÉTÉ EXPLOITANTE

| Champ | Valeur |
|-------|--------|
| Raison sociale | JOERKE.B |
| Forme juridique | SASU (Société par Actions Simplifiée Unipersonnelle) |
| SIREN | 892 906 728 |
| SIRET | 892 906 728 00019 |
| TVA intracommunautaire | FR12892906728 |
| Adresse | 11 Rue Urbain IV, 10000 Troyes, France |
| RCS | 892 906 728 R.C.S. Troyes |
| Président | Arnaud Becam |
| Activité déclarée | Programmation informatique |
| Plateforme exploitée | La Citadelle Numérique |
| Domaine | lacitadellenumerique.fr |
| Email principal | lagarde@lacitadellenumerique.fr |

### ⚠️ Point de vigilance n°1 — Cohérence de l'activité déclarée

L'activité déclarée au RCS est "programmation informatique" (NAF 6201Z).
L'exploitation d'une marketplace de cession d'actifs numériques avec perception de commissions s'apparente à une **activité d'intermédiaire de commerce** (NAF 4619B) ou de **courtage**.

**Risque :** En cas de contrôle fiscal ou social, une activité principale de marketplace peut être requalifiée.

**Recommandation :** Consulter un expert-comptable ou avocat pour évaluer l'opportunité d'une mise à jour du code APE auprès de l'INSEE, ou vérifier que l'activité actuelle reste compatible avec le code existant dans le cadre d'une activité plurielle.

---

## 2. QUALIFICATION JURIDIQUE DE LA PLATEFORME

### 2.1 Nature de l'activité

La Citadelle Numérique est une **plateforme d'intermédiation** (marketplace) spécialisée dans la cession d'actifs numériques. Elle :

- Met en relation des vendeurs et des acheteurs
- Perçoit une commission sur les transactions réalisées
- Fournit un système de transaction sécurisée (escrow)
- Propose des services complémentaires (évaluation, audit, refonte)

La plateforme n'est **pas** vendeur principal, ni acquéreur pour revente. Elle est **intermédiaire**.

### 2.2 Régime juridique applicable

| Texte | Application |
|-------|-------------|
| Loi pour la confiance dans l'économie numérique (LCEN, 2004) | OUI — hébergeur / intermédiaire |
| Règlement européen sur les services numériques (DSA, 2022) | OUI si > 45M utilisateurs UE (non applicable immédiatement) |
| Règlement sur les plateformes (P2B, 2019/1150) | OUI si B2B |
| Code de la consommation | OUI si B2C |
| RGPD | OUI — obligatoire |
| Directive DSP2 / réglementation PSP | ⚠️ CRITIQUE — voir section 5 |

### 2.3 Obligation de loyauté et de transparence (Art. L111-7 Code Conso.)

En tant que plateforme, La Citadelle Numérique est soumise à des obligations d'information renforcées :
- Conditions générales claires sur le référencement des annonces
- Information sur le traitement des données personnelles
- Transparence sur les commissions et frais
- Information sur les recours disponibles

---

## 3. COMMISSION MARKETPLACE

### 3.1 Paramètres actuels

- Taux : **5 %** du prix de vente
- Minimum : **50 €** (⚠️ le document mentionne 50€ mais le système actuel est configuré à 49€ — à harmoniser)
- Déclenchement : uniquement en cas de vente aboutie
- Évolution possible depuis l'administration (déjà implémenté ✅)

### 3.2 Régime TVA sur la commission

La commission perçue par JOERKE.B est une **prestation de service** soumise à **TVA au taux de 20 %**.

Exemple :
- Vente à 10 000 €
- Commission HT : 500 €
- TVA (20%) : 100 €
- Commission TTC facturée à l'une des parties : 600 €

**Décision à prendre :** La commission est-elle présentée TTC ou HT dans les CGV ?
- Recommandation : afficher HT + TVA séparément dans les conditions générales et factures.

### 3.3 Commission sur vendeur ou acheteur ?

**Pratique du marché :** la commission est généralement supportée par le **vendeur** (déduite du montant qu'il reçoit).

**Décision à prendre :** Confirmer que la commission est prélevée sur le vendeur. Préciser explicitement dans les CGV pour éviter tout litige.

### 3.4 Moment du prélèvement

- Option A : Au moment de l'acceptation de l'offre (risque si la vente échoue ensuite)
- Option B : À la libération des fonds vers le vendeur ✅ (recommandé — commission prélevée uniquement si la vente est finalisée)

---

## 4. PUBLICATION D'ANNONCES

### 4.1 Règles de publication

- Gratuite ✅
- Validation administrative obligatoire avant publication ✅
- Droit de refus, suspension, suppression ✅

### 4.2 Contenu des annonces — responsabilité

La plateforme, en tant qu'hébergeur (LCEN), bénéficie d'une **exonération de responsabilité** sur le contenu des annonces à condition :
- De ne pas avoir connaissance du caractère illicite
- D'agir promptement pour retirer le contenu illicite dès notification

**Points à intégrer dans les CGU :**
- L'annonceur est seul responsable de l'exactitude des informations publiées
- La plateforme valide la conformité formelle, non la véracité des données
- Clause de garantie et d'indemnisation du vendeur envers la plateforme en cas de contenu frauduleux

### 4.3 Propriété intellectuelle des annonces

Le vendeur cède à la plateforme une **licence d'utilisation non exclusive** du contenu de son annonce (textes, images, données) pour les besoins de la publication et de la promotion.

---

## 5. TRANSACTION SÉCURISÉE — ANALYSE CRITIQUE

### 5.1 Qualification juridique

Le système de Transaction Sécurisée (fonds bloqués → vérification → libération) s'apparente à un service d'**escrow** ou de **séquestre conventionnel**.

### 5.2 ⚠️ RISQUE MAJEUR — Réglementation des paiements

**En France, la détention de fonds pour le compte de tiers est une activité réglementée** soumise à agrément de l'ACPR (Autorité de Contrôle Prudentiel et de Résolution) en vertu du Code Monétaire et Financier (Art. L521-1 et suivants).

JOERKE.B SASU **ne dispose probablement pas de l'agrément de prestataire de services de paiement (PSP)** requis pour détenir légalement des fonds de tiers en transit.

**Risques si la plateforme détient les fonds directement :**
- Infraction pénale (exercice illégal d'activité bancaire — Art. L571-3 CMF)
- Nullité des conventions de paiement
- Responsabilité civile et pénale du dirigeant

### 5.3 Solution recommandée — Délégation à un PSP agréé

La solution légale et la plus répandue est d'utiliser un **PSP agréé comme tiers de confiance** :

| Solution | Avantages | Inconvénients |
|----------|-----------|---------------|
| **Stripe Connect** (mode marketplace) | Intégration existante, rapide, API complète, séquestre natif via `capture` différée | Frais Stripe (1,5-3%), dépendance Stripe |
| **Mangopay** | Spécialisé marketplace, séquestre intégré, agréé EME | Intégration plus complexe |
| **Lemon Squeezy / Paddle** | Merchant of Record (MoR) — gère TVA internationale | Moins adapté aux transactions B2B importantes |
| **Virement bancaire via compte dédié** | Simplicité apparente | ❌ Non conforme sans agrément PSP |

**Recommandation : Stripe Connect** est la solution la plus cohérente avec l'infrastructure existante. Elle permet de :
- Capturer le paiement mais différer le virement au vendeur
- Libérer les fonds programmatiquement après validation de La Garde
- Gérer les remboursements en cas de litige
- Rester conforme à la réglementation DSP2

**Décision à prendre :** Valider avec un juriste que le modèle Stripe Connect en mode "destination charge" ou "separate charge + transfer" est suffisant pour couvrir le cas d'usage escrow.

### 5.4 Processus cible validé

| Étape | Action | Acteur |
|-------|--------|--------|
| 1 | Paiement capturé (fonds bloqués chez Stripe) | Acheteur |
| 2 | Confirmation de paiement | Système |
| 3 | Transmission des accès à La Garde | Vendeur |
| 4 | Vérification des éléments (conformité, fonctionnement) | La Garde |
| 5 | Transmission des accès à l'acheteur | La Garde |
| 6 | Délai de vérification (voir §5.5) | Acheteur |
| 7a | Validation → libération des fonds (moins commission) | Système |
| 7b | Litige → gel des fonds + médiation | La Garde |
| 8 | Clôture de la transaction | La Garde |

### 5.5 Délai de vérification — Recommandation

| Durée | Analyse |
|-------|---------|
| 3 jours | Trop court pour les actifs complexes (SaaS, e-commerce multi-modules). Pression sur l'acheteur. Risque de litige précipité. ❌ |
| 5 jours ouvrables | Équilibre entre rapidité et sécurité. Standard du marché (Escrow.com, Flippa). Temps suffisant pour une vérification sérieuse. ✅ |
| 7 jours | Adapté aux actifs très complexes. Peut décourager certains acheteurs sur les petits montants. Acceptable en option. ⚠️ |

**Recommandation : 5 jours ouvrables** par défaut, avec possibilité d'extension jusqu'à 7 jours sur demande conjointe des deux parties, approuvée par La Garde.

**Décision à prendre :** Confirmer ce délai. Il doit être précisé dans les Conditions de Transaction Sécurisée.

---

## 6. PAIEMENTS

### 6.1 Moyens de paiement envisagés

| Moyen | Analyse |
|-------|---------|
| **Carte bancaire (Stripe)** | ✅ Conforme DSP2, SCA intégrée, remboursement simplifié, traçabilité. Recommandé. |
| **Virement bancaire** | ⚠️ Délais variables (1-5 jours), identification du virement difficile, pas de mécanisme de blocage natif. Utilisable uniquement pour grands montants avec procédure manuelle documentée. |

### 6.2 Contraintes liées à la consignation des fonds

- **Sans agrément PSP :** la plateforme ne peut pas détenir les fonds. Utiliser obligatoirement Stripe Connect ou équivalent agréé.
- **Avec Stripe Connect :** les fonds transitent par Stripe (agréé), pas par JOERKE.B. La plateforme envoie l'instruction de virement uniquement après validation.

### 6.3 Contraintes comptables

- Chaque commission perçue doit être comptabilisée comme produit
- La TVA sur commissions doit être déclarée
- Les montants en transit (non encore libérés) ne sont pas des produits de JOERKE.B
- Recommandation : tenir un **registre des transactions en cours** avec statuts (payé, en vérification, libéré, litigieux, remboursé)

### 6.4 Remboursements

- Litige résolu en faveur de l'acheteur → remboursement intégral (hors frais Stripe non remboursables)
- Annulation avant transmission des accès → remboursement intégral
- Annulation après transmission → frais d'annulation applicables (selon grille existante)
- **Décision à prendre :** La commission est-elle remboursée en cas d'annulation avant livraison ? Recommandation : OUI si annulation avant transmission des accès.

---

## 7. VENTE AUX ENCHÈRES

### 7.1 Réglementation spécifique

Les ventes aux enchères en ligne sont encadrées en France par :
- **Loi n°2000-642 du 10 juillet 2000** relative à la réglementation des ventes volontaires de meubles aux enchères publiques
- **Ordonnance n°2016-131** portant réforme des obligations

**Point critique :** Les ventes aux enchères "classiques" en salle sont réservées aux opérateurs agréés par le Conseil des Ventes Volontaires (CVV).

Cependant, les **ventes aux enchères entre particuliers en ligne** (type eBay) relèvent d'un régime différent : elles sont qualifiées de **ventes de gré à gré avec mécanisme d'enchère** et non de ventes aux enchères publiques formelles, à condition que :
1. La plateforme soit un simple intermédiaire technique
2. Le vendeur reste maître du prix minimum
3. La transaction ne soit pas présentée comme une "vente aux enchères publiques"

**Recommandation :** Qualifier le mécanisme de **"système d'offres progressives"** ou **"vente avec appel d'offres"** plutôt que "vente aux enchères" dans les documents juridiques, afin d'éviter l'application du régime des ventes aux enchères publiques.

### 7.2 Règles métier à fixer

- L'enchère gagnante engage son auteur si le prix minimum est atteint ✅
- En dessous du prix minimum → aucune transaction
- Délai de paiement après adjudication : **48h recommandées**
- Non-paiement → suspension du compte acheteur + remise en vente possible
- **Décision à prendre :** En cas de non-paiement, des dommages-intérêts sont-ils applicables ? À prévoir dans les CGV.

---

## 8. LITIGES

### 8.1 Rôle de La Garde

La Garde agit comme **médiateur interne** (non judiciaire). Ce rôle est légitime et courant dans les plateformes marketplace.

**Ce que La Garde peut faire :**
- Analyser les preuves soumises par chaque partie
- Proposer une résolution amiable
- Prendre une décision de libération ou remboursement des fonds
- Suspendre un compte en cas de fraude avérée

**Ce que La Garde ne peut pas faire :**
- Se substituer à un tribunal
- Émettre une décision exécutoire
- Agir en tant qu'arbitre judiciaire (sans accréditation)

### 8.2 ⚠️ Obligation légale B2C — Médiateur de la consommation

En vertu de la **loi n°2015-990 du 6 août 2015** (loi Macron) et de l'**Ordonnance n°2015-1033**, tout professionnel ayant des relations avec des consommateurs (B2C) est **obligé** de proposer un dispositif de **médiation de la consommation** géré par un médiateur agréé par la Commission d'Évaluation et de Contrôle de la Médiation de la Consommation (CECMC).

**Décision à prendre (obligatoire) :**
- Identifier un médiateur de la consommation agréé (exemples : Médiateur du e-commerce, FEVAD, Centre de la Médiation et de l'Arbitrage de Paris)
- L'indiquer obligatoirement dans les CGV et sur le site
- Ce médiateur externe est distinct du rôle interne de La Garde

### 8.3 Procédure de litige recommandée

| Étape | Délai | Action |
|-------|-------|--------|
| 1 | J+0 | Acheteur ouvre un litige (formulaire motivé) |
| 2 | J+0 à J+2 | Fonds maintenus bloqués |
| 3 | J+3 | Vendeur notifié, droit de réponse |
| 4 | J+3 à J+7 | La Garde collecte les preuves |
| 5 | J+8 à J+10 | La Garde rend sa décision interne |
| 6 | J+11 | Libération des fonds ou remboursement |
| 7 | Si insatisfait | Renvoi vers médiateur externe agréé |

### 8.4 Preuves recevables

- Captures d'écran horodatées
- Accès aux outils (Google Analytics, hébergeur, CMS)
- Échanges écrits via la messagerie de la plateforme
- Rapport d'audit tiers (si service d'audit souscrit)
- Tout document technique vérifié par La Garde

---

## 9. SERVICES — MODÈLE PARTENAIRES

### 9.1 Options

**Option A — Le partenaire facture directement le client**

| Avantages | Inconvénients |
|-----------|---------------|
| Simplicité comptable pour JOERKE.B | Perte totale de contrôle sur la qualité |
| Pas de TVA à collecter sur ce flux | Expérience client dégradée (plusieurs interlocuteurs) |
| Responsabilité transférée au partenaire | Pas de commission possible sur les services partenaires |
| | Risque image en cas de litige partenaire |

**Option B — La Citadelle facture le client et rémunère le partenaire**

| Avantages | Inconvénients |
|-----------|---------------|
| Cohérence de l'expérience client | JOERKE.B devient responsable de la prestation |
| Contrôle qualité possible | Obligation de facturer et collecter la TVA |
| Marge/commission prélevable | Gestion comptable plus complexe |
| Interlocuteur unique pour le client | Risque si partenaire défaillant |

### 9.2 Qualification juridique

- Option A → JOERKE.B agit comme **apporteur d'affaires** → contrat d'apport d'affaires avec chaque partenaire, commission sur mise en relation
- Option B → JOERKE.B agit comme **commissionnaire** (en son nom pour le compte du partenaire) ou **prestataire principal** avec sous-traitance

### 9.3 Recommandation

**Option B est recommandée** pour La Citadelle Numérique car :
1. Elle assure la cohérence de l'expérience utilisateur (marque unique)
2. Elle permet de protéger la réputation de la plateforme
3. Elle est cohérente avec le positionnement premium de La Citadelle
4. Elle permet de dégager une marge sur les services

**Condition sine qua non :** Contracter des **accords de sous-traitance solides** avec chaque partenaire du Syndicat du Code, incluant :
- Niveaux de service (SLA)
- Délais d'intervention
- Responsabilités en cas de défaut
- Clause de confidentialité

---

## 10. AUDIT ET EXPERTISE — OBLIGATION DE MOYENS

### 10.1 Définition

- **Obligation de résultat :** le prestataire garantit un résultat précis (ex : "votre site sera vendu X€"). Engage pleinement sa responsabilité si non atteint.
- **Obligation de moyens :** le prestataire s'engage à mettre en œuvre les diligences professionnelles appropriées, sans garantir le résultat final.

### 10.2 Application aux services de La Citadelle

| Service | Qualification correcte |
|---------|----------------------|
| Évaluation Standard / Expert | Obligation de moyens ✅ — une évaluation est un avis professionnel, pas une promesse de prix |
| Audit Avant Achat / Sécurité | Obligation de moyens ✅ — l'audit réduit le risque sans l'éliminer |
| Valorisation Avant Vente | Obligation de moyens ✅ — améliore les chances, sans garantie de vente |
| Refonte Avant Vente | Obligation de résultat **partiel** ⚠️ — la refonte technique peut être mesurable |
| Migration Technique | Obligation de résultat **partiel** ⚠️ — la migration doit être fonctionnelle |

### 10.3 Implications juridiques

- Les CGV de services doivent **explicitement mentionner** la nature "obligation de moyens"
- Toute communication marketing doit éviter les promesses de résultats chiffrés (ex : "augmentez votre prix de vente de 30%" serait problématique)
- Les rapports d'évaluation doivent comporter un **disclaimer clair** : "Cette estimation est donnée à titre indicatif..."
- **Responsabilité limitée** : prévoir une clause plafonnant la responsabilité de La Citadelle au montant du service payé

---

## 11. UTILISATEURS

### 11.1 Âge minimum

**Recommandation : 18 ans** (majorité légale pour conclure des contrats en France).

Justification :
- Les transactions peuvent porter sur des sommes importantes
- Le Code Civil (Art. 1145) prévoit que la capacité contractuelle est acquise à la majorité
- Pas de dérogation recommandée pour les mineurs (complexité légale, risque parental)

### 11.2 Particuliers

**Autorisés ✅ avec conditions :**

- Le particulier vendeur doit déclarer si c'est une vente occasionnelle ou habituelle
- En cas de **vente habituelle** d'actifs numériques, la personne peut être requalifiée en **professionnel** par l'administration fiscale ou les juridictions → obligation de déclaration de revenus, TVA possible
- Indiquer dans les CGU que la plateforme ne peut être utilisée pour une activité commerciale habituelle non déclarée
- Différencier dans les CGV les conditions applicables aux **particuliers** et aux **professionnels** (droit de rétractation, garanties légales, etc.)

### 11.3 Professionnels

**Autorisés ✅** — pas de restriction.

- Contrats B2B → régime juridique plus souple (pas de droit de rétractation automatique)
- Possibilité de conditions tarifaires différentes pour les utilisateurs professionnels fréquents

### 11.4 Utilisateurs européens

**Autorisés ✅ avec RGPD obligatoire.**

- Traitement des données personnelles soumis au RGPD
- Droit d'accès, de rectification, d'effacement, de portabilité (à prévoir dans la Politique de Confidentialité)
- **Registre des activités de traitement** obligatoire (Art. 30 RGPD)
- **Décision à prendre :** Désigner un DPO ? (Non obligatoire pour une petite structure, mais recommandé)

### 11.5 Utilisateurs internationaux (hors UE)

⚠️ **Recommandation : restreindre dans un premier temps à la France et à l'Union Européenne.**

Raisons :
- Complexité du droit applicable en cas de litige transfrontalier
- Problématiques de change et de fiscalité internationale
- Obligations de conformité locales (ex : US FATCA, UK post-Brexit)
- Risque de fraude accru sur certaines zones géographiques

Si extension internationale souhaitée ultérieurement → prévoir une analyse dédiée pays par pays.

---

## 12. ACTIFS AUTORISÉS ET INTERDITS

### 12.1 Actifs autorisés

| Catégorie | Conditions particulières |
|-----------|--------------------------|
| Sites internet | Propriété attestée (hébergeur, registrar) |
| SaaS | Code source + documentation inclus dans la cession |
| E-commerce | Stock éventuel → hors périmètre (à préciser) |
| Applications web | Droits de propriété intellectuelle sur le code |
| Blogs / Sites éditoriaux | Droits sur les contenus et images |
| Noms de domaine | Transfert registrar documenté |
| Comptes réseaux sociaux | ⚠️ Soumis aux CGU des plateformes tierces |

### 12.2 ⚠️ Cas particulier — Comptes réseaux sociaux

La cession de comptes réseaux sociaux est souvent **contraire aux CGU** de Facebook, Instagram, TikTok, YouTube, etc. La plateforme devrait prévoir un **disclaimer** explicite indiquant que la conformité avec les règles des plateformes tierces est de la responsabilité exclusive du vendeur.

### 12.3 Actifs interdits (liste non exhaustive)

| Catégorie | Motif |
|-----------|-------|
| Sites pornographiques illicites | Illégalité, protection des mineurs |
| Sites de jeux d'argent non agréés | Réglementation ANJ (Arjel) |
| Sites de vente de substances illicites | Illégalité |
| Sites de contrefaçon | Propriété intellectuelle |
| Faux comptes / comptes achetés | Violation CGU plateformes + fraude |
| Sites de phishing / malware | Illégalité |
| Sites diffusant des discours haineux | Loi 1972, LCEN |
| Actifs liés à des activités sanctionnées | Conformité internationale |
| Sites utilisant des données volées | RGPD, illégalité |

---

## 13. SYNTHÈSE DES DÉCISIONS À PRENDRE

### 🔴 Décisions critiques (blocantes avant lancement)

| # | Sujet | Décision requise |
|---|-------|-----------------|
| 1 | **PSP agréé** | Confirmer utilisation Stripe Connect (ou équivalent) pour la détention des fonds en séquestre — OBLIGATOIRE légalement |
| 2 | **Médiateur consommation** | Identifier et mandater un médiateur de la consommation agréé CECMC |
| 3 | **Commission TTC/HT** | Décider si la commission est affichée HT ou TTC dans les conditions générales |
| 4 | **Commission sur vendeur** | Confirmer officiellement que la commission est à la charge du vendeur |

### 🟡 Décisions importantes (avant rédaction des CGV)

| # | Sujet | Décision requise |
|---|-------|-----------------|
| 5 | **Délai de vérification** | Confirmer 5 jours ouvrables (recommandé) |
| 6 | **Modèle partenaires** | Option A ou Option B (recommandé : B) |
| 7 | **Harmonisation commission min.** | 49€ (actuel en BDD) ou 50€ (document) — choisir un seul chiffre |
| 8 | **Qualification enchères** | Adopter la terminologie "offres progressives" plutôt qu'"enchères" |
| 9 | **Remboursement commission** | Oui/Non en cas d'annulation avant livraison |
| 10 | **Délai paiement post-enchère** | Confirmer 48h recommandées |

### 🟢 Décisions à anticiper (avant extension)

| # | Sujet | Décision requise |
|---|-------|-----------------|
| 11 | **Code APE** | Vérifier cohérence avec expert-comptable |
| 12 | **DPO** | Désigner un DPO (même informel) ou documenter la décision de ne pas en désigner un |
| 13 | **Ouverture internationale** | Définir les pays autorisés si extension hors UE |
| 14 | **CGV Pro vs Particulier** | Rédiger deux jeux distincts ou un jeu commun avec clauses différenciées |

---

## 14. POINTS DE VIGILANCE RÉCAPITULATIFS

| # | Niveau | Sujet | Détail |
|---|--------|-------|--------|
| 1 | 🔴 CRITIQUE | Détention des fonds | Sans agrément PSP, illégal. Utiliser obligatoirement Stripe Connect ou Mangopay |
| 2 | 🔴 CRITIQUE | Médiation consommation | Obligation légale si B2C. Médiateur agréé CECMC requis |
| 3 | 🟡 IMPORTANT | Code APE | Vérifier compatibilité activité marketplace avec code 6201Z actuel |
| 4 | 🟡 IMPORTANT | Enchères en ligne | Ne pas qualifier de "ventes aux enchères publiques" → "offres progressives" |
| 5 | 🟡 IMPORTANT | Comptes réseaux sociaux | Disclaimer obligatoire sur conformité aux CGU des plateformes tierces |
| 6 | 🟡 IMPORTANT | Harmonisation commission | 49€ vs 50€ — aligner BDD et documents légaux |
| 7 | 🟡 IMPORTANT | TVA sur commissions | 20% TVA sur la commission → à facturer et déclarer |
| 8 | 🟢 À SURVEILLER | RGPD | Registre des traitements, politique de confidentialité, droits des utilisateurs |
| 9 | 🟢 À SURVEILLER | Obligation de moyens | Formulation précise dans CGV services pour limiter la responsabilité |
| 10 | 🟢 À SURVEILLER | Stock e-commerce | Préciser si le stock est inclus ou non dans la cession d'un e-commerce |

---

## 15. DOCUMENTS JURIDIQUES À RÉDIGER (prochaines étapes)

Une fois les décisions de la section 13 prises, les documents suivants devront être rédigés par un juriste ou avocat spécialisé en droit du numérique et des affaires :

1. **Mentions légales** — identification de la société, hébergeur, directeur de publication
2. **CGU** — règles d'utilisation de la plateforme, droits et obligations des utilisateurs
3. **CGV Vendeurs** — commission, publication, validation, responsabilités
4. **CGV Acheteurs** — processus d'achat, transaction sécurisée, délai de vérification
5. **Conditions de Transaction Sécurisée** — processus détaillé, rôle de La Garde, délais, litiges
6. **Politique de Litiges** — procédure, preuves, délais, rôle La Garde, médiateur externe
7. **Politique de Confidentialité (RGPD)** — données collectées, finalités, durées, droits des utilisateurs
8. **Contrats Partenaires (Syndicat du Code)** — SLA, responsabilités, rémunération

---

*Document établi le 13/06/2026 — Version 1.0*
*À réviser avant toute rédaction de documents juridiques définitifs*
*Usage interne — Non opposable juridiquement*
