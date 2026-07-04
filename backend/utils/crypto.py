"""
Chiffrement symétrique (Fernet/AES) des champs sensibles de transmission d'actif.
La clé provient de TRANSMISSION_ENC_KEY (.env) — fail-fast si absente.
Les valeurs déchiffrées ne sont manipulées qu'en mémoire (jamais loggées).
"""
import os
from cryptography.fernet import Fernet, InvalidToken


def _fernet() -> Fernet:
    key = os.environ["TRANSMISSION_ENC_KEY"]
    return Fernet(key.encode("utf-8") if isinstance(key, str) else key)


def encrypt_value(plain: str) -> str:
    if not plain:
        return ""
    return _fernet().encrypt(str(plain).encode("utf-8")).decode("utf-8")


def decrypt_value(token: str) -> str:
    if not token:
        return ""
    try:
        return _fernet().decrypt(token.encode("utf-8")).decode("utf-8")
    except (InvalidToken, Exception):
        return ""
