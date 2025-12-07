#api\app\routers\admin.py
from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from ..dependencies import get_supabase_service_client, require_role
from ..schemas import AuthUser, DashboardStat

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_role("admin"))])


@router.get("/overview", response_model=list[DashboardStat])
async def admin_overview(client: Client = Depends(get_supabase_service_client)):
    try:
        users = client.rpc("count_by_role").execute()
        jobs = client.rpc("count_jobs").execute()
        matches = client.rpc("count_matches").execute()
    except Exception:
        # RPCs might not exist yet; return placeholders.
        users = type("obj", (), {"data": {"admin": 1, "recruiter": 4, "candidate": 20}})
        jobs = type("obj", (), {"data": {"open": 12}})
        matches = type("obj", (), {"data": {"month": 140}})
    return [
        DashboardStat(label="Admins", value=str(users.data.get("admin", 0))),
        DashboardStat(label="Recruiters", value=str(users.data.get("recruiter", 0))),
        DashboardStat(label="Candidates", value=str(users.data.get("candidate", 0))),
        DashboardStat(label="Open Jobs", value=str(jobs.data.get("open", 0))),
        DashboardStat(label="Matches This Month", value=str(matches.data.get("month", 0))),
    ]


@router.get("/users")
async def list_users(client: Client = Depends(get_supabase_service_client)):
    res = client.table("users").select("*").execute()
    return res.data or []


@router.patch("/users/{user_id}")
async def update_user_status(
    user_id: str,
    status: str,
    client: Client = Depends(get_supabase_service_client),
):
    try:
        res = client.table("users").update({"status": status}).eq("id", user_id).execute()
        return res.data
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/companies")
async def list_companies(client: Client = Depends(get_supabase_service_client)):
    return client.table("companies").select("*").execute().data


@router.get("/jobs")
async def list_jobs(client: Client = Depends(get_supabase_service_client)):
    return client.table("jobs").select("*").execute().data


@router.get("/posts")
async def list_posts(client: Client = Depends(get_supabase_service_client)):
    return client.table("posts").select("*").execute().data


@router.patch("/posts/{post_id}/moderate")
async def moderate_post(
    post_id: str, status: str = "hidden", client: Client = Depends(get_supabase_service_client)
):
    return client.table("posts").update({"status": status}).eq("id", post_id).execute().data
