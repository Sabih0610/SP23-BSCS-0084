# api\app\routers\recruiter.py
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from supabase import Client
from postgrest.exceptions import APIError
import io
from PyPDF2 import PdfReader
from docx import Document
from uuid import UUID

from ..config import get_settings
from ..dependencies import get_supabase_user_client, require_role
from ..schemas import (
    AuthUser,
    DashboardStat,
    JobCreate,
    JobUpdate,
    MatchRequest,
    MatchResult,
)
from ..services.matching import MatchingService, build_candidate_payload

router = APIRouter(prefix="/recruiter", tags=["recruiter"], dependencies=[Depends(require_role("recruiter"))])


def _matching_service(client: Client) -> MatchingService:
    return MatchingService(settings=get_settings(), supabase=client)


@router.get("/dashboard", response_model=List[DashboardStat])
async def dashboard(
    user: AuthUser = Depends(require_role("recruiter")),
    client: Client = Depends(get_supabase_user_client),
):
    try:
        UUID(str(user.user_id))
        jobs = client.table("jobs").select("id,status").eq("recruiter_id", user.user_id).execute().data or []
    except Exception:
        jobs = client.table("jobs").select("id,status").execute().data or []
    apps = client.table("applications").select("id").execute().data or []
    matches = client.table("matches").select("id").execute().data or []
    open_jobs = len([j for j in jobs if j.get("status") == "open"])
    return [
        DashboardStat(label="Open Jobs", value=str(open_jobs)),
        DashboardStat(label="Candidates in Pipeline", value=str(len(apps))),
        DashboardStat(label="Matches Run", value=str(len(matches))),
    ]


@router.get("/profile")
async def get_profile(
    user: AuthUser = Depends(require_role("recruiter")), client: Client = Depends(get_supabase_user_client)
):
    res = client.table("recruiters").select("*").eq("id", user.user_id).limit(1).execute()
    return res.data[0] if res.data else {}


@router.put("/profile")
async def update_profile(
    payload: Dict[str, Any],
    user: AuthUser = Depends(require_role("recruiter")),
    client: Client = Depends(get_supabase_user_client),
):
    res = client.table("recruiters").upsert({**payload, "id": user.user_id}).execute()
    return res.data


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


def _is_valid_uuid(value: str) -> bool:
    try:
        UUID(str(value))
        return True
    except Exception:
        return False


def _guess_title_and_skills(text: str) -> Dict[str, Any]:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    title = lines[0][:80] if lines else "Job Title"
    words = text.split()
    counts: Dict[str, int] = {}
    for w in words:
        if len(w) > 2 and len(w) <= 25 and w[0].isalpha():
            counts[w] = counts.get(w, 0) + 1
    top_terms = [w for w, _ in sorted(counts.items(), key=lambda x: x[1], reverse=True) if w[0].isupper()]
    skills = top_terms[:10]
    return {"title": title, "skills": skills}


def _load_job_owned(client: Client, job_id: str, recruiter_id: str, skip_owner_check: bool = False) -> Dict[str, Any]:
    """
    Fetch a job, optionally enforcing ownership. In local/dev, caller can skip
    the owner filter to avoid UUID/FK issues with the fake dev user.
    """
    if skip_owner_check or not _is_valid_uuid(recruiter_id):
        job_res = client.table("jobs").select("*").eq("id", job_id).limit(1).execute()
    else:
        try:
            job_res = (
                client.table("jobs")
                .select("*")
                .eq("id", job_id)
                .eq("recruiter_id", recruiter_id)
                .limit(1)
                .execute()
            )
        except APIError:
            # If the recruiter_id is not castable (e.g., local dev), fall back to ID-only filter.
            job_res = client.table("jobs").select("*").eq("id", job_id).limit(1).execute()
    if not job_res.data:
        raise HTTPException(status_code=404, detail="Job not found or not owned by recruiter")
    return job_res.data[0]


def _load_candidate(client: Client, candidate_id: str) -> Dict[str, Any]:
    cand_res = client.table("candidates").select("*").eq("id", candidate_id).limit(1).execute()
    if not cand_res.data:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return cand_res.data[0]


def _get_cv_text(client: Client, cv_id: Optional[str]) -> Optional[str]:
    if not cv_id:
        return None
    cv_res = client.table("candidate_cvs").select("parsed_text").eq("id", cv_id).limit(1).execute()
    if cv_res.data:
        return cv_res.data[0].get("parsed_text")
    return None


async def _score_application_record(
    client: Client,
    match_service: MatchingService,
    job: Dict[str, Any],
    application: Dict[str, Any],
) -> Dict[str, Any]:
    candidate_profile = _load_candidate(client, application["candidate_id"])
    cv_text = _get_cv_text(client, application.get("cv_id"))
    candidate_payload = build_candidate_payload(candidate_profile, cv_text)
    result = await match_service.score_candidate_for_job(job=job, candidate=candidate_payload)
    score = float(result.get("score") or 0.0)
    match_level = result.get("band")
    update_fields = {
        "match_score": score,
        "match_level": match_level,
        "matched_skills": result.get("matched_skills", []),
        "missing_skills": result.get("missing_skills", []),
        "rationale": result.get("rationale", ""),
        "last_scored_at": datetime.utcnow().isoformat(),
    }
    client.table("applications").update(update_fields).eq("id", application["id"]).execute()
    client.table("matches").insert(
        {
            "job_id": job["id"],
            "candidate_id": application["candidate_id"],
            "score": score,
            "matched_skills": result.get("matched_skills", []),
            "missing_skills": result.get("missing_skills", []),
            "rationale": result.get("rationale", ""),
            "source": "batch",
        }
    ).execute()
    return {**application, **update_fields}


@router.post("/jobs/ingest")
async def ingest_job_file(
    file: UploadFile = File(...),
    user: AuthUser = Depends(require_role("recruiter")),
    client: Client = Depends(get_supabase_user_client),
):
    content = await file.read()
    text = ""
    if file.content_type == "application/pdf":
        text = _extract_text_from_pdf(content)
    elif file.content_type in ("application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"):
        text = _extract_text_from_docx(content)
    elif file.content_type.startswith("text/"):
        text = content.decode(errors="ignore")
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    match_service = _matching_service(client)
    ai_payload = await match_service.improve_job_description(text[:6000])
    description = ai_payload.get("description") or text[:4000]
    must_ai = ai_payload.get("must_have") or []
    nice_ai = ai_payload.get("nice_to_have") or []
    guessed = _guess_title_and_skills(text)
    return {
        "title": guessed["title"],
        "description": description,
        "must_skills": must_ai or guessed["skills"],
        "nice_skills": nice_ai,
    }


@router.post("/jobs/improve")
async def improve_job_description(
    body: Dict[str, str],
    user: AuthUser = Depends(require_role("recruiter")),
    client: Client = Depends(get_supabase_user_client),
):
    jd_text = body.get("description") or ""
    if not jd_text:
        raise HTTPException(status_code=400, detail="description is required")
    match_service = _matching_service(client)
    try:
        improved = await match_service.improve_job_description(jd_text)
    except Exception as exc:
        print("Error improving JD:", repr(exc))
        raise HTTPException(status_code=502, detail="Error calling AI model. Try again later.")
    return {
        "description": improved.get("description", jd_text),
        "must_skills": improved.get("must_have", []),
        "nice_skills": improved.get("nice_to_have", []),
    }


@router.post("/jobs")
async def create_job(
    payload: JobCreate,
    user: AuthUser = Depends(require_role("recruiter")),
    client: Client = Depends(get_supabase_user_client),
):
    data = payload.model_dump()
    settings = get_settings()
    # In local/dev without a real Supabase user, avoid FK errors by leaving recruiter_id null.
    if settings.app_env.lower() == "local" and not user.token:
        data["recruiter_id"] = None
    else:
        try:
            UUID(str(user.user_id))
            data["recruiter_id"] = user.user_id
        except Exception:
            data["recruiter_id"] = None
    res = client.table("jobs").insert(data).execute()
    return res.data


@router.get("/jobs")
async def list_jobs(
    user: AuthUser = Depends(require_role("recruiter")),
    client: Client = Depends(get_supabase_user_client),
    settings=Depends(get_settings),
):
    # In local dev without JWT, return all jobs (recruiter_id is null) to keep UI usable.
    if settings.app_env.lower() == "local" and not user.token:
        return client.table("jobs").select("*").execute().data
    # Otherwise enforce recruiter ownership when possible.
    try:
        UUID(str(user.user_id))
        return client.table("jobs").select("*").eq("recruiter_id", user.user_id).execute().data
    except Exception:
        return client.table("jobs").select("*").execute().data


@router.get("/jobs/{job_id}")
async def job_detail(
    job_id: str,
    user: AuthUser = Depends(require_role("recruiter")),
    client: Client = Depends(get_supabase_user_client),
):
    res = client.table("jobs").select("*").eq("id", job_id).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Job not found")
    return res.data[0]


@router.put("/jobs/{job_id}")
async def update_job(
    job_id: str,
    payload: JobUpdate,
    user: AuthUser = Depends(require_role("recruiter")),
    client: Client = Depends(get_supabase_user_client),
):
    res = client.table("jobs").update(payload.model_dump()).eq("id", job_id).execute()
    return res.data


@router.post("/jobs/{job_id}/candidates")
async def attach_candidate_to_job(
    job_id: str,
    body: Dict[str, Any],
    user: AuthUser = Depends(require_role("recruiter")),
    client: Client = Depends(get_supabase_user_client),
):
    candidate_id = body.get("candidate_id")
    if not candidate_id:
        raise HTTPException(status_code=400, detail="candidate_id required")
    res = client.table("applications").upsert(
        {
            "job_id": job_id,
            "candidate_id": candidate_id,
            "status": "applied",
            "applied_at": datetime.utcnow().isoformat(),
        }
    ).execute()
    return res.data


@router.post("/jobs/{job_id}/match", response_model=MatchResult)
async def run_match_for_candidate(
    job_id: str,
    payload: MatchRequest,
    user: AuthUser = Depends(require_role("recruiter")),
    client: Client = Depends(get_supabase_user_client),
):
    settings = get_settings()
    skip_owner = settings.app_env.lower() == "local" and not user.token
    job = _load_job_owned(client, job_id, user.user_id, skip_owner_check=skip_owner)
    match_service = _matching_service(client)
    app_res = (
        client.table("applications")
        .select("*")
        .eq("job_id", job_id)
        .eq("candidate_id", payload.candidate_id)
        .limit(1)
        .execute()
    )
    application = app_res.data[0] if app_res.data else None
    if application is None:
        inserted = (
            client.table("applications")
            .insert(
                {
                    "job_id": job_id,
                    "candidate_id": payload.candidate_id,
                    "status": "applied",
                    "applied_at": datetime.utcnow().isoformat(),
                    "cv_id": payload.cv_id,
                }
            )
            .execute()
        )
        application = inserted.data[0]
    # Ensure cv_id is respected for scoring
    application["cv_id"] = payload.cv_id or application.get("cv_id")
    scored_app = await _score_application_record(client, match_service, job, application)
    return MatchResult(
        job_id=job_id,
        candidate_id=payload.candidate_id,
        score=scored_app.get("match_score", 0.0),
        match_level=scored_app.get("match_level"),
        matched_skills=scored_app.get("matched_skills", []),
        missing_skills=scored_app.get("missing_skills", []),
        rationale=scored_app.get("rationale", ""),
        created_at=datetime.utcnow(),
    )


@router.get("/jobs/{job_id}/applications")
async def list_job_applications(
    job_id: str,
    include_best: bool = Query(False),
    user: AuthUser = Depends(require_role("recruiter")),
    client: Client = Depends(get_supabase_user_client),
):
    settings = get_settings()
    skip_owner = settings.app_env.lower() == "local" and not user.token
    # If user_id is a UUID and not skipping owner check, enforce ownership; otherwise skip (local dev bypass)
    if not skip_owner:
        try:
            UUID(str(user.user_id))
            _load_job_owned(client, job_id, user.user_id)
        except Exception:
            pass
    apps = client.table("applications").select("*").eq("job_id", job_id).execute().data or []
    candidate_ids = list({a["candidate_id"] for a in apps if a.get("candidate_id")})
    candidates = (
        client.table("candidates").select("*").in_("id", candidate_ids).execute().data if candidate_ids else []
    )
    users = client.table("users").select("id,email").in_("id", candidate_ids).execute().data if candidate_ids else []
    cand_map = {c["id"]: c for c in candidates or []}
    user_map = {u["id"]: u for u in users or []}

    sorted_apps = sorted(
        apps,
        key=lambda a: (a.get("match_score") is not None, a.get("match_score") or 0),
        reverse=True,
    )
    if include_best and sorted_apps:
        best_id = sorted_apps[0]["id"]
        client.table("applications").update({"best_fit": False}).eq("job_id", job_id).execute()
        client.table("applications").update({"best_fit": True}).eq("id", best_id).execute()
        sorted_apps[0]["best_fit"] = True
    enriched = []
    for app in sorted_apps:
        candidate = cand_map.get(app.get("candidate_id")) or {}
        enriched.append(
            {
                **app,
                "candidate": candidate,
                "email": user_map.get(app.get("candidate_id"), {}).get("email"),
            }
        )
    return enriched


@router.post("/jobs/{job_id}/applications/score")
async def score_all_applications_for_job(
    job_id: str,
    user: AuthUser = Depends(require_role("recruiter")),
    client: Client = Depends(get_supabase_user_client),
):
    settings = get_settings()
    skip_owner = settings.app_env.lower() == "local" and not user.token
    job = _load_job_owned(client, job_id, user.user_id, skip_owner_check=skip_owner)
    apps = client.table("applications").select("*").eq("job_id", job_id).execute().data or []
    if not apps:
        return {"scored": 0, "best_fit_id": None}
    match_service = _matching_service(client)
    scored: List[Dict[str, Any]] = []
    for app in apps:
        scored_app = await _score_application_record(client, match_service, job, app)
        scored.append(scored_app)
    best_fit_id = None
    if scored:
        client.table("applications").update({"best_fit": False}).eq("job_id", job_id).execute()
        best = sorted(scored, key=lambda a: a.get("match_score") or 0, reverse=True)[0]
        best_fit_id = best.get("id")
        if best_fit_id:
            client.table("applications").update({"best_fit": True}).eq("id", best_fit_id).execute()
    return {"scored": len(scored), "best_fit_id": best_fit_id}


@router.post("/jobs/{job_id}/applications/{application_id}/score", response_model=MatchResult)
async def score_single_application(
    job_id: str,
    application_id: str,
    user: AuthUser = Depends(require_role("recruiter")),
    client: Client = Depends(get_supabase_user_client),
):
    settings = get_settings()
    skip_owner = settings.app_env.lower() == "local" and not user.token
    job = _load_job_owned(client, job_id, user.user_id, skip_owner_check=skip_owner)
    app_res = (
        client.table("applications")
        .select("*")
        .eq("job_id", job_id)
        .eq("id", application_id)
        .limit(1)
        .execute()
    )
    if not app_res.data:
        raise HTTPException(status_code=404, detail="Application not found")
    application = app_res.data[0]
    match_service = _matching_service(client)
    scored_app = await _score_application_record(client, match_service, job, application)
    all_apps = client.table("applications").select("id,match_score").eq("job_id", job_id).execute().data or []
    if all_apps:
        client.table("applications").update({"best_fit": False}).eq("job_id", job_id).execute()
        best = sorted(all_apps, key=lambda a: a.get("match_score") or 0, reverse=True)[0]
        client.table("applications").update({"best_fit": True}).eq("id", best["id"]).execute()
        if scored_app.get("id") == best.get("id"):
            scored_app["best_fit"] = True
    return MatchResult(
        job_id=job_id,
        candidate_id=scored_app.get("candidate_id", ""),
        score=scored_app.get("match_score", 0.0),
        match_level=scored_app.get("match_level"),
        matched_skills=scored_app.get("matched_skills", []),
        missing_skills=scored_app.get("missing_skills", []),
        rationale=scored_app.get("rationale", ""),
        created_at=datetime.utcnow(),
    )


@router.get("/candidates/{candidate_id}")
async def candidate_detail(
    candidate_id: str,
    user: AuthUser = Depends(require_role("recruiter")),
    client: Client = Depends(get_supabase_user_client),
):
    profile = client.table("candidates").select("*").eq("id", candidate_id).limit(1).execute().data
    posts = client.table("posts").select("*").eq("candidate_id", candidate_id).execute().data
    applications = (
        client.table("applications").select("*").eq("candidate_id", candidate_id).execute().data
    )
    return {"profile": profile[0] if profile else {}, "posts": posts, "applications": applications}


@router.get("/candidates")
async def list_candidates(
    user: AuthUser = Depends(require_role("recruiter")),
    client: Client = Depends(get_supabase_user_client),
):
    # Candidates that have applied to any of this recruiter's jobs. In local mode (non-UUID user),
    # fall back to all jobs to avoid UUID cast errors.
    job_ids = client.table("jobs").select("id").execute().data or []
    try:
        UUID(str(user.user_id))
        job_ids = client.table("jobs").select("id").eq("recruiter_id", user.user_id).execute().data or job_ids
    except Exception:
        # keep job_ids as all jobs when user_id isn't a UUID (local dev)
        pass

    job_ids_list = [j["id"] for j in job_ids]
    if not job_ids_list:
        return []

    apps = client.table("applications").select("*").in_("job_id", job_ids_list).execute().data or []
    candidate_ids = list({a["candidate_id"] for a in apps if a.get("candidate_id")})
    if not candidate_ids:
        return []
    candidates = client.table("candidates").select("*").in_("id", candidate_ids).execute().data or []
    users = client.table("users").select("id,email").in_("id", candidate_ids).execute().data or []
    cand_map = {c["id"]: c for c in candidates}
    user_map = {u["id"]: u for u in users}
    return [
        {
            "id": cid,
            "candidate": cand_map.get(cid, {}),
            "email": user_map.get(cid, {}).get("email"),
            "applications": [a for a in apps if a.get("candidate_id") == cid],
        }
        for cid in candidate_ids
    ]


@router.post("/candidates/{candidate_id}/bookmark")
async def bookmark_candidate(
    candidate_id: str,
    body: Dict[str, Any],
    user: AuthUser = Depends(require_role("recruiter")),
    client: Client = Depends(get_supabase_user_client),
):
    note = body.get("note", "")
    res = client.table("bookmarks").insert(
        {"recruiter_id": user.user_id, "candidate_id": candidate_id, "note": note}
    ).execute()
    return res.data


@router.post("/candidates/{candidate_id}/notes")
async def add_note(
    candidate_id: str,
    body: Dict[str, Any],
    user: AuthUser = Depends(require_role("recruiter")),
    client: Client = Depends(get_supabase_user_client),
):
    note = body.get("note")
    if not note:
        raise HTTPException(status_code=400, detail="note required")
    res = client.table("notes").insert(
        {
            "candidate_id": candidate_id,
            "note": note,
            "author_id": user.user_id,
            "created_at": datetime.utcnow().isoformat(),
        }
    ).execute()
    return res.data
