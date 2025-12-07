# HireMatch API (FastAPI)

FastAPI backend scaffold for HireMatch. It wires Supabase (Auth + Postgres + Storage) and Gemini AI for matching, with role‑based routers for admin, recruiter, and candidate flows.

## Quickstart

1) Install dependencies (Python 3.10+):
```bash
cd api
python -m venv .venv
.venv/Scripts/activate  # on Windows
pip install -r requirements.txt
```

2) Configure environment:
- Copy `.env.example` to `.env`.
- Fill `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`.

3) Run dev server:
```bash
uvicorn app.main:app --reload --port 8000
```

## Structure
- `app/main.py` - FastAPI app factory + routers.
- `app/config.py` - settings from env.
- `app/dependencies.py` - auth/session helpers, Supabase client.
- `app/schemas.py` - Pydantic DTOs.
- `app/services/matching.py` - Gemini scoring service.
- `app/routers/` - public/admin/recruiter/candidate endpoints.
- `app/services/storage.py` - Supabase storage helpers for CVs (signed URLs).

## Notes
- Supabase RLS should mirror role rules described in the product blueprint.
- Admin access is expected to be created manually (seed in DB); JWT must carry `role=admin`.
- Matching endpoints currently stub Supabase persistence; plug in table names to match your schema.
