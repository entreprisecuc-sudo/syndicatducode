# 🔒 Cahier des améliorations futures — La Citadelle Numérique

> **PRIVÉ — Usage interne uniquement (le propriétaire + l'agent E1).**
> Ce fichier vit dans `/app/memory/` : il n'est PAS servi par le frontend ni exposé
> via une quelconque route/API publique. Ne jamais le publier ni le lier côté site.

---

## Idées en attente (non validées / non planifiées)

### 1. Bannière preuve sociale — formulations alternées (proposé le 20/07/2026)
- **Idée** : faire varier le message de `RecentSaleBanner.jsx` au lieu d'un seul format.
- **Exemples de rotation** :
  - « Nouvelle vente sécurisée par La Garde ! « {titre} » — {type} vendu {prix} € via La Citadelle. » (actuel)
  - « X actifs numériques déjà vendus ce mois-ci sur La Citadelle. »
  - « Transaction sécurisée conclue en moins de 24h par La Garde. »
  - « X vendeurs ont fait confiance à La Citadelle cette semaine. »
- **But** : varier la preuve sociale, renforcer la confiance, éviter la lassitude.
- **Implémentation estimée** : rotation aléatoire côté `RecentSaleBanner` + éventuel
  endpoint stats (compte de ventes du mois) sur `listings`. Faible complexité.
- **Statut** : NOTÉ, en attente de validation du client.
