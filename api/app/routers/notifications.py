# api/app/routers/notifications.py
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from ..dependencies import get_supabase_user_client, require_role
from ..schemas import AuthUser

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(
    user: AuthUser = Depends(require_role("admin", "recruiter", "candidate", "authenticated")),
    client: Client = Depends(get_supabase_user_client),
):
    resp = (
        client.table("notifications")
        .select("id,type,data,read,created_at")
        .eq("user_id", user.user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return resp.data or []


@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: UUID,
    user: AuthUser = Depends(require_role("admin", "recruiter", "candidate", "authenticated")),
    client: Client = Depends(get_supabase_user_client),
):
    resp = (
        client.table("notifications")
        .update({"read": True})
        .eq("id", str(notification_id))
        .eq("user_id", user.user_id)
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"ok": True}
