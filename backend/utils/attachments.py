"""
Pièces jointes des messageries — La Citadelle Numérique.
Formats acceptés : images (JPG, PNG, WebP) + PDF. Taille max : 25 Mo. Max 5 par message.
"""
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import HTTPException, UploadFile, status
from pydantic import BaseModel

ATTACHMENTS_DIR = Path(__file__).parent.parent / "uploads" / "citadelle" / "attachments"
ATTACHMENTS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_ATTACHMENT_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024  # 25 Mo
MAX_ATTACHMENTS_PER_MESSAGE = 5
_ATTACHMENT_URL_PREFIX = "/uploads/citadelle/attachments/"
_EXT_MAP = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "application/pdf": ".pdf"}


class Attachment(BaseModel):
    url: str
    name: str = ""
    content_type: str = ""
    size: int = 0


async def save_attachment(file: UploadFile) -> dict:
    """Valide et enregistre un fichier joint. Retourne ses métadonnées (url, name, content_type, size)."""
    if file.content_type not in ALLOWED_ATTACHMENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Type de fichier non autorisé. Formats acceptés : JPG, PNG, WebP, PDF.",
        )
    content = await file.read()
    if len(content) > MAX_ATTACHMENT_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Fichier trop volumineux. Taille maximale : 25 Mo.",
        )
    ext = _EXT_MAP.get(file.content_type, ".bin")
    filename = f"msg_{uuid.uuid4().hex}{ext}"
    with open(ATTACHMENTS_DIR / filename, "wb") as buffer:
        buffer.write(content)
    return {
        "url": f"{_ATTACHMENT_URL_PREFIX}{filename}",
        "name": (file.filename or filename)[:200],
        "content_type": file.content_type,
        "size": len(content),
    }


def validate_attachments(attachments: Optional[List["Attachment"]]) -> List[dict]:
    """Valide les pièces jointes reçues dans un message (nombre max + URL sûre) et les normalise."""
    if not attachments:
        return []
    if len(attachments) > MAX_ATTACHMENTS_PER_MESSAGE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_ATTACHMENTS_PER_MESSAGE} pièces jointes par message.",
        )
    result = []
    for a in attachments:
        if not a.url.startswith(_ATTACHMENT_URL_PREFIX):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Pièce jointe invalide.")
        result.append({"url": a.url, "name": a.name[:200], "content_type": a.content_type, "size": a.size})
    return result
