# HireMatch - HR CV-JD Match Assistant

Monorepo with a FastAPI backend (Supabase auth/DB/storage + Gemini for matching) and a Vite/React frontend. Docs live at the repo root (`ProblemStatement.md`, `UseCases.md`, `TestPlan.md`, etc.).

## Stack
- Backend: FastAPI, Supabase (auth, Postgres, storage), Google Gemini, PyJWT
- Frontend: Vite + React + TypeScript, Tailwind CSS

## Repository layout
- `api/` – FastAPI app with routers for public, candidate, recruiter, admin, and notifications. SQL schema/seed in `api/db/`.
- `web/` – Vite + React frontend. Global styles in `web/src/index.css`; Tailwind config in `web/tailwind.config.cjs`.
- `*.md` – product docs and roadmap.

## Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Supabase project (URL, anon key, service key; optional JWT secret)
- Gemini API key (for AI matching/explanations)

## Backend (api) – local run
```powershell
Set-Location F:\hr\api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env   # fill Supabase + Gemini values
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Key environment variables (`api/.env.example`):
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET` (optional)
- `GEMINI_API_KEY`
- `APP_ENV=local`, `DISABLE_ROLE_CHECKS_LOCAL=true` (dev bypass)

Local auth shortcuts: with `APP_ENV=local`, you can skip JWT and send `X-Debug-Role: recruiter|candidate|admin` to simulate roles. Service/anon clients are built in `app/dependencies.py`; schema helpers live in `app/`.

## Frontend (web) – local run
```powershell
Set-Location F:\hr\web
npm install
npm run dev        # http://localhost:5173
```
Vite env (`web/.env.local`):
- `VITE_API_URL` (FastAPI base, defaults to http://127.0.0.1:8000 if unset)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Useful scripts:
- `npm run build` – production build to `web/dist`
- `npm run preview` – serve the production build locally

## Database
Apply `api/db/schema.sql` then `api/db/seed.sql` to your Supabase Postgres instance:
```powershell
psql "$SUPABASE_DB_URL" -f api/db/schema.sql
psql "$SUPABASE_DB_URL" -f api/db/seed.sql
```

## Checks
- Frontend: `npm run build`
- Backend: `py -m compileall app` (from `api/` with venv active)

## Notes
- `.env`/`.env.local` are ignored; only `api/.env.example` is committed.
- CORS is open for local dev (`allow_origins=["*"]`); tighten for production.
- Supabase RLS/role expectations should mirror the app’s routers (admin/recruiter/candidate).
