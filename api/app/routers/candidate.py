# api\app\routers\candidate.py
from datetime import datetime
from typing import Any, Dict, List

from fastapi import APIRouter, Body, Depends, File, HTTPException, UploadFile
from supabase import Client
from postgrest.exceptions import APIError
import io
from PyPDF2 import PdfReader
from docx import Document

from ..dependencies import get_supabase_user_client, require_role, supabase_service_client
from ..schemas import (
    Application,
    AuthUser,
    CandidateProfile,
    DashboardStat,
    MatchCheckRequest,
    MatchCheckResponse,
    MatchResult,
    PostCreate,
)
from ..services.matching import MatchingService, build_candidate_payload
from ..config import get_settings
from ..config import Settings

router = APIRouter(prefix="/candidate", tags=["candidate"], dependencies=[Depends(require_role("candidate"))])


def _matching_service(client: Client) -> MatchingService:
    return MatchingService(settings=get_settings(), supabase=client)


def _extract_text_from_pdf(data: bytes) -> str:
    reader = PdfReader(io.BytesIO(data))
    text_parts: List[str] = []
    for page in reader.pages[:5]:
        try:
            text_parts.append(page.extract_text() or "")
        except Exception:
            continue
    return "\n".join(text_parts).strip()


def _extract_text_from_docx(data: bytes) -> str:
    doc = Document(io.BytesIO(data))
    return "\n".join([p.text for p in doc.paragraphs if p.text]).strip()


def _ensure_bucket(bucket: str) -> None:
    """
    Ensure a storage bucket exists; create it via the service client if missing.
    """
    settings = get_settings()
    svc = supabase_service_client(settings)
    try:
        # supabase-py signature: create_bucket(id, public=False, file_size_limit=None, allowed_mime_types=None)
        svc.storage.create_bucket(bucket, public=False)
    except Exception as exc:
        # Ignore "already exists" errors, re-raise others for visibility.
        if "already exists" not in str(exc).lower():
            print("Bucket creation failed:", exc)
            raise


def _safe_select(client: Client, table: str, builder) -> list:
    """
    Run a select on a table, but if the table is missing (common in local setups before schema.sql is applied),
    return an empty list instead of raising.
    """
    try:
        return builder(client.table(table)).execute().data or []
    except APIError as exc:
        if "PGRST205" in str(exc):
            # Table missing in schema cache; return empty data so the UI stays usable.
            return []
        raise


@router.get("/dashboard", response_model=List[DashboardStat])
async def dashboard(
    user: AuthUser = Depends(require_role("candidate")),
    client: Client = Depends(get_supabase_user_client),
):
    checks = _safe_select(client, "match_checks", lambda tbl: tbl.select("*").eq("candidate_id", user.user_id).limit(5))
    apps = _safe_select(client, "applications", lambda tbl: tbl.select("*").eq("candidate_id", user.user_id).limit(5))
    return [
        DashboardStat(label="Profile", value="Complete soon"),
        DashboardStat(label="Recent Match Checks", value=str(len(checks))),
        DashboardStat(label="Applications", value=str(len(apps))),
    ]


@router.get("/profile", response_model=CandidateProfile)
async def get_profile(user: AuthUser = Depends(require_role("candidate")), client: Client = Depends(get_supabase_user_client)):
    res = _safe_select(client, "candidates", lambda tbl: tbl.select("*").eq("id", user.user_id).limit(1))
    if not res:
        raise HTTPException(status_code=404, detail="Profile not found")
    c = res[0]
    return CandidateProfile(
        headline=c.get("headline"),
        location=c.get("location"),
        remote_pref=c.get("remote_pref"),
        summary=c.get("summary"),
        skills=c.get("skills") or [],
        links=c.get("links") or [],
    )


@router.put("/profile")
async def update_profile(
    payload: CandidateProfile,
    user: AuthUser = Depends(require_role("candidate")),
    client: Client = Depends(get_supabase_user_client),
):
    data = payload.model_dump()
    res = client.table("candidates").upsert({**data, "id": user.user_id}).execute()
    return res.data


@router.post("/cv")
async def upload_cv(
    file: UploadFile = File(...),
    user: AuthUser = Depends(require_role("candidate")),
    client: Client = Depends(get_supabase_user_client),
):
    content = await file.read()
    path = f"{user.user_id}/{file.filename}"
    parsed_text = ""
    if file.content_type == "application/pdf":
        parsed_text = _extract_text_from_pdf(content)
    elif file.content_type in ("application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"):
        parsed_text = _extract_text_from_docx(content)
    elif file.content_type and file.content_type.startswith("text/"):
        parsed_text = content.decode(errors="ignore")[:6000]
    else:
        # Fallback: treat unknown types as binary; parsed_text remains empty.
        pass
    try:
        try:
            client.storage.from_("cvs").upload(path, content, {"content-type": file.content_type or "application/octet-stream"})
        except Exception as exc:
            if "Bucket not found" in str(exc) or "bucket" in str(exc).lower():
                _ensure_bucket("cvs")
                client.storage.from_("cvs").upload(path, content, {"content-type": file.content_type or "application/octet-stream"})
            else:
                raise
        client.table("candidate_cvs").insert({"candidate_id": user.user_id, "file_url": path, "parsed_text": parsed_text}).execute()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"CV upload failed: {exc}")
    return {"path": path}


@router.get("/cvs")
async def list_cvs(
    user: AuthUser = Depends(require_role("candidate")),
    client: Client = Depends(get_supabase_user_client),
):
    return _safe_select(
        client,
        "candidate_cvs",
        lambda tbl: tbl.select("id,file_url,created_at").eq("candidate_id", user.user_id).order("created_at", desc=True),
    )


@router.post("/profile/autofill")
async def autofill_profile_from_cv(
    body: Dict[str, Any] = Body(default_factory=dict),
    user: AuthUser = Depends(require_role("candidate")),
    client: Client = Depends(get_supabase_user_client),
):
    cv_id = body.get("cv_id")
    cv_text = None
    if cv_id:
        cv_res = client.table("candidate_cvs").select("parsed_text").eq("id", cv_id).limit(1).execute()
        if cv_res.data:
            cv_text = cv_res.data[0].get("parsed_text")
    if not cv_text:
        latest = (
            client.table("candidate_cvs")
            .select("parsed_text")
            .eq("candidate_id", user.user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if latest.data:
            cv_text = latest.data[0].get("parsed_text")
    if not cv_text:
        raise HTTPException(status_code=400, detail="No CV text found. Upload a CV first.")

    match_service = _matching_service(client)
    suggestions = await match_service.suggest_profile_from_cv(cv_text)
    return {
        "headline": suggestions.get("headline"),
        "summary": suggestions.get("summary"),
        "skills": suggestions.get("skills") or [],
        "links": suggestions.get("links") or [],
    }


@router.post("/match-check", response_model=MatchCheckResponse)
async def match_check(
    payload: MatchCheckRequest,
    user: AuthUser = Depends(require_role("candidate")),
    client: Client = Depends(get_supabase_user_client),
):
    profile_res = client.table("candidates").select("*").eq("id", user.user_id).limit(1).execute()
    profile = profile_res.data[0] if profile_res.data else {}
    cv_text = None
    if payload.cv_id:
        cv_res = client.table("candidate_cvs").select("parsed_text").eq("id", payload.cv_id).limit(1).execute()
        cv_text = cv_res.data[0].get("parsed_text") if cv_res.data else None
    match_service = _matching_service(client)
    candidate_payload = build_candidate_payload(profile, cv_text)
    result = await match_service.score_candidate_for_job(
        job={"title": "Ad-hoc JD", "description": payload.jd_text, "skills": []},
        candidate=candidate_payload,
    )
    client.table("match_checks").insert(
        {
            "candidate_id": user.user_id,
            "jd_text": payload.jd_text,
            "cv_id": payload.cv_id,
            "match_score": result.get("score"),
            "explanation": result.get("rationale"),
            "matched_skills": result.get("matched_skills"),
            "missing_skills": result.get("missing_skills"),
        }
    ).execute()
    return MatchCheckResponse(
        score=result.get("score", 0.0),
        matched_skills=result.get("matched_skills", []),
        missing_skills=result.get("missing_skills", []),
        suggestions=result.get("rationale", ""),
    )


@router.get("/matches")
async def list_match_checks(
    user: AuthUser = Depends(require_role("candidate")), client: Client = Depends(get_supabase_user_client)
):
    return _safe_select(client, "match_checks", lambda tbl: tbl.select("*").eq("candidate_id", user.user_id))


@router.get("/applications", response_model=List[Application])
async def list_applications(
    user: AuthUser = Depends(require_role("candidate")), client: Client = Depends(get_supabase_user_client)
):
    res = client.table("applications").select("*").eq("candidate_id", user.user_id).execute()
    return [
        Application(
            id=a["id"],
            job_id=a["job_id"],
            candidate_id=a["candidate_id"],
            status=a.get("status", "applied"),
            applied_at=a.get("applied_at", datetime.utcnow()),
            match_score=a.get("match_score"),
        )
        for a in res.data or []
    ]


@router.post("/apply/{job_id}")
async def apply_to_job(
    job_id: str,
    body: Dict[str, Any] = Body(default_factory=dict),
    user: AuthUser = Depends(require_role("candidate")),
    client: Client = Depends(get_supabase_user_client),
    settings: Settings = Depends(get_settings),
):
    cv_id = body.get("cv_id")
    cv_file_url = None
    cv_excerpt = None

    # If no cv_id provided, pick the latest CV for the candidate (if any)
    try:
        if cv_id:
            cv_res = (
                client.table("candidate_cvs")
                .select("id,file_url,parsed_text")
                .eq("id", cv_id)
                .eq("candidate_id", user.user_id)
                .limit(1)
                .execute()
            )
        else:
            cv_res = (
                client.table("candidate_cvs")
                .select("id,file_url,parsed_text")
                .eq("candidate_id", user.user_id)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
        if cv_res.data:
            cv_row = cv_res.data[0]
            cv_id = cv_row.get("id") or cv_id
            cv_file_url = cv_row.get("file_url")
            parsed_text = cv_row.get("parsed_text") or ""
            cv_excerpt = (parsed_text or "")[:800] if parsed_text else None
    except Exception:
        # Don't block application creation if CV lookup fails
        pass

    try:
        res = client.table("applications").insert(
            {
                "job_id": job_id,
                "candidate_id": user.user_id,
                "status": "applied",
                "applied_at": datetime.utcnow().isoformat(),
                "cv_id": cv_id,
                "cv_file_url": cv_file_url,
                "cv_excerpt": cv_excerpt,
            }
        ).execute()
        app_row = res.data[0] if res.data else None
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # Notify recruiter if job has a recruiter_id
    try:
        svc = supabase_service_client(settings)
        job_res = (
            svc.table("jobs")
            .select("id,title,recruiter_id")
            .eq("id", job_id)
            .limit(1)
            .execute()
        )
        job = job_res.data[0] if job_res.data else None
        recruiter_id = job.get("recruiter_id") if job else None
        if recruiter_id:
            svc.table("notifications").insert(
                {
                    "user_id": recruiter_id,
                    "type": "new_application",
                    "data": {
                        "job_id": job_id,
                        "job_title": job.get("title"),
                        "candidate_id": user.user_id,
                        "application_id": app_row.get("id") if app_row else None,
                    },
                }
            ).execute()
    except Exception:
        # Notification failures should not block apply flow
        pass

    return app_row or res.data


@router.post("/posts")
async def create_post(
    payload: PostCreate,
    user: AuthUser = Depends(require_role("candidate")),
    client: Client = Depends(get_supabase_user_client),
):
    return client.table("posts").insert(
        {"candidate_id": user.user_id, "body": payload.body, "visibility": payload.visibility}
    ).execute().data


@router.get("/posts")
async def list_posts(user: AuthUser = Depends(require_role("candidate")), client: Client = Depends(get_supabase_user_client)):
    return _safe_select(client, "posts", lambda tbl: tbl.select("*").eq("candidate_id", user.user_id))


@router.get("/feed")
async def feed(client: Client = Depends(get_supabase_user_client)):
    # Simple public feed
    return _safe_select(
        client,
        "posts",
        lambda tbl: tbl.select("*").eq("visibility", "public").order("created_at", desc=True).limit(20),
    )
