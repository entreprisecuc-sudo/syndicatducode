"""
request_utils — utilitaires liés à la requête HTTP.
Centralise l'extraction de l'IP réelle du client derrière un proxy / ingress (DRY).
"""

from fastapi import Request


def get_client_ip(request: Request) -> str:
    """
    Retourne l'IP réelle du client.

    Derrière l'ingress Kubernetes, `request.client.host` correspond à l'IP
    interne du proxy. L'IP d'origine est transmise dans l'en-tête
    `X-Forwarded-For` (liste séparée par des virgules, client en tête).

    Note : `X-Forwarded-For` peut être falsifié par le client ; cette valeur
    convient au suivi (CGU/RGPD) et au comptage best-effort des tentatives de
    connexion, mais ne doit pas servir de contrôle de sécurité fort.
    """
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
