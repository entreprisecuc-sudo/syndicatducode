"""
message_sanitizer — La Citadelle Numérique
Détecte et masque les informations de contact dans les messages
(adresses email, numéros de téléphone) pour maintenir les échanges
sur la plateforme.
"""

import re

# ── Marqueur de remplacement ───────────────────────────────────────────────────
MASQUE = "[contact masqué par La Citadelle]"

# ── Patterns interdits ─────────────────────────────────────────────────────────
_PATTERNS = [
    # Adresse email
    re.compile(
        r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}',
        re.IGNORECASE
    ),
    # Numéro de téléphone — 8+ chiffres consécutifs (sans séparateur)
    re.compile(r'\b\d{8,}\b'),
    # Numéro de téléphone — groupes de chiffres séparés par espace, point, tiret, barre, parenthèse
    # Ex: 06 12 34 56 78 / 06.12.34.56.78 / +33 6 12 34 56 78 / (06) 12-34-56-78
    re.compile(
        r'(?:\+\d{1,3}[\s.\-]?)?'          # préfixe international optionnel
        r'(?:\(?\d{2,4}\)?[\s.\-/]?){3,}'   # 3+ groupes de 2–4 chiffres
        r'\d{2,4}'                           # dernier groupe
    ),
]


def sanitiser_message(texte: str) -> tuple[str, bool]:
    """
    Analyse le texte et masque les informations de contact détectées.

    Retourne :
        (texte_sanitisé: str, a_été_modifié: bool)

    Le booléen permet à l'appelant de savoir si le message a été altéré
    afin d'avertir l'utilisateur.
    """
    modifie = False
    for pattern in _PATTERNS:
        nouveau = pattern.sub(MASQUE, texte)
        if nouveau != texte:
            modifie = True
            texte = nouveau
    return texte, modifie


def contient_contact(texte: str) -> bool:
    """Retourne True si le texte contient une adresse email ou un numéro de téléphone."""
    if not texte:
        return False
    return any(pattern.search(texte) for pattern in _PATTERNS)
