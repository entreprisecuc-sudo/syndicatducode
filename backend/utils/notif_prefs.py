"""Préférence de notifications email — La Citadelle Numérique.
Un utilisateur peut désactiver les emails de notification (surenchéri, dernière chance, etc.)
depuis son profil. Les emails critiques (accès sécurisés, réinitialisation) ne sont pas concernés.
"""


async def email_notifications_enabled(db, email: str) -> bool:
    """Retourne True si l'utilisateur accepte les emails de notification (défaut: True)."""
    if not email:
        return True
    user = await db.users.find_one(
        {"email": email, "platform": "citadelle"},
        {"_id": 0, "email_notifications": 1},
    )
    if not user:
        return True
    return user.get("email_notifications", True) is not False
