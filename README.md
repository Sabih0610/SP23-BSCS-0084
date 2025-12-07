<<<<<<< Updated upstream
# HireMatch Blueprint

Scaffolded monorepo for HireMatch using FastAPI (Python) for the API and React + Vite for the frontend.

Quick overview
- `api/` — FastAPI backend (routers for admin, recruiter, candidate). Contains DB schema and seed SQL in `api/db/`.
- `web/` — Frontend built with Vite + React (TypeScript).

What I added for you
- `.gitignore` — excludes virtualenvs and `node_modules` so dependency directories are not committed.

Local setup (recommended)

1) Backend (Windows / PowerShell)

   - Create and activate a virtual environment:

# HireMatch — HR CV–JD Match Assistant

React/Vite frontend + FastAPI backend + Supabase (Auth/Postgres/Storage) + Gemini AI for JD improvement and CV–JD matching.

Overview
- `web/` — React + Vite frontend with public landing, auth, and role dashboards.
- `api/` — FastAPI backend with role-based routers and Gemini integration. DB schema & seed are in `api/db/`.

Docs & diagram
- Documentation files: `ProblemStatement.md`, `UseCases.md`, `TestPlan.md`, `AI-log.md`, `ReleaseRoadmap.md`, `UI-Sketch-and-Vision.md`.
- Diagram: `uml.png`.

Prerequisites
- Node 18+ and npm
- Python 3.11+ (Windows: `py` launcher available)
- Supabase project (URL, anon key, service key). Optional: JWT secret.
- Gemini API key (for AI features)

Local setup

1) Frontend (web)

   ```powershell
   Set-Location 'F:\hr\web'
   npm install
   npm run dev            # defaults to http://localhost:5173
   # Production build
   npm run build
   ```

   Env: set `VITE_API_URL` (FastAPI base), `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in `.env` or your shell. The code defaults to `http://127.0.0.1:8000` for local API.

2) Backend (api)

   ```powershell
   Set-Location 'F:\hr\api'
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   copy .env.example .env  # fill with your secrets
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

   Required `.env` keys: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`, `GEMINI_API_KEY`. Optional: `SUPABASE_JWT_SECRET`, `APP_ENV=local` for relaxed checks.

Database schema & seed
- SQL scripts: `api/db/schema.sql` and `api/db/seed.sql`. Apply to your Supabase project or Postgres instance:

  ```powershell
  psql "$SUPABASE_DB_URL" -f api/db/schema.sql
  psql "$SUPABASE_DB_URL" -f api/db/seed.sql
  ```

Example API calls
- List jobs (public):

  ```bash
  curl http://127.0.0.1:8000/jobs
  ```

- Candidate match check (requires Supabase auth token):

  ```bash
  curl -X POST http://127.0.0.1:8000/candidate/match-check \
    -H "Authorization: Bearer <supabase_jwt>" \
    -H "Content-Type: application/json" \
    -d '{"jd_text":"React frontend role...", "cv_id":null}'
  ```

Notes
- The `api/requirements.txt` lists Python dependencies. Use a virtual environment to avoid committing site-packages.
- `.gitignore` excludes `api/.venv/` and `web/node_modules/` to keep the repository small.
- If you previously pushed dependency folders and want to remove them from git history to reduce remote size, I can help (this rewrites history and requires a force-push).
- For production, store secrets in CI or environment settings — do not commit them.

Files of interest
- `api/db/schema.sql` — DB schema
- `api/db/seed.sql` — initial seed data
- `api/app/main.py` — FastAPI app entrypoint
- `web/src` — frontend source code

Tests & notes
- Example checks performed locally (2025-12-08): `npm run build` (web) and `py -m compileall app` (api) — both can be run locally; functional tests require Supabase + Gemini credentials as described in `TestPlan.md`.
- Local dev can bypass strict role checks with `disable_role_checks_local=True` in settings.
- CV uploads are stored in a Supabase storage bucket named `cvs` (created on-demand in local dev).

Next steps
- I can add/update an `MIT` `LICENSE` (or another license you prefer) and improve README examples of env variables. I can also purge large files from history if you want — this is optional and destructive to history (requires force-push).

---
