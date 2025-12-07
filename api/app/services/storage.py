# api\app\services\storage.py
from datetime import timedelta
from typing import Optional

from supabase import Client


def get_signed_url(client: Client, bucket: str, path: str, expires_in: int = 3600) -> Optional[str]:
    try:
        res = client.storage.from_(bucket).create_signed_url(path, expires_in)
        return res.get("signedURL")
    except Exception:
        return None
