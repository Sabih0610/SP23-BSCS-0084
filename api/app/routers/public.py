# api\app\routers\public.py
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from ..dependencies import get_supabase_service_client, get_current_user
from ..schemas import JobPublic
from ..config import get_settings
from ..schemas import AuthUser

router = APIRouter(tags=["public"])


def _map_job_public(j: dict) -> JobPublic:
    company_id = j.get("company_id")
    company_name = j.get("company_name") or j.get("company") or "Company"
    return JobPublic(
        id=str(j.get("id") or ""),
        slug=str(j.get("slug") or j.get("id") or ""),
        company={
            "id": str(company_id or ""),
            "name": str(company_name or "Company"),
            "website": j.get("company_website") or None,
            "industry": j.get("company_industry") or None,
            "location": j.get("company_location") or j.get("location"),
            "plan": j.get("company_plan") or j.get("plan") or "free",
        },
        title=j.get("title") or "Untitled role",
        location=j.get("location"),
        remote=bool(j.get("remote", True)),
        employment_type=j.get("employment_type") or None,
        description=j.get("description") or "",
        created_at=j.get("created_at", datetime.utcnow()),
        status=j.get("status", "open"),
    )


@router.get("/health")
async def health() -> dict:
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


@router.get("/debug/me")
async def debug_me(
    user: AuthUser = Depends(get_current_user),
    settings=Depends(get_settings),
):
    """
    Lightweight debug endpoint to inspect the authenticated user when testing locally.
    Do not expose in production.
    """
    return {"user_id": user.user_id, "role": user.role, "app_env": settings.app_env}

@router.get("/jobs", response_model=List[JobPublic])
async def list_jobs(client: Client = Depends(get_supabase_service_client)):
    try:
        res = client.table("jobs").select("*").eq("status", "open").execute()
    except Exception as exc:
        # Log and fall back to empty list so the UI doesn't hard-error if the table is missing.
        print("Error fetching jobs:", exc)
        raise HTTPException(status_code=500, detail="Error fetching jobs. Check Supabase tables/keys.")
    jobs = res.data or []
    return [_map_job_public(j) for j in jobs]


@router.get("/jobs/{slug}", response_model=JobPublic)
async def job_detail(slug: str, client: Client = Depends(get_supabase_service_client)):
    try:
        res = client.table("jobs").select("*").or_(f"slug.eq.{slug},id.eq.{slug}").limit(1).execute()
    except Exception as exc:
        print("Error fetching job detail:", exc)
        raise HTTPException(status_code=500, detail="Error fetching job detail. Check Supabase.")
    if not res.data:
        raise HTTPException(status_code=404, detail="Job not found")
    return _map_job_public(res.data[0])
