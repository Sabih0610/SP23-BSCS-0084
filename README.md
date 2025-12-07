# HireMatch Blueprint

Scaffolded monorepo for HireMatch using FastAPI (Python) + React/Vite, with Supabase for auth/storage/DB and Gemini for AI matching.

## Structure
- `api/` - FastAPI service with role-based routers (admin, recruiter, candidate), Supabase + Gemini integration stubs.
- `web/` - React + Vite frontend with landing page, public job views, and routes for each role.

## Getting started
1. Backend: see `api/README.md` (venv, env vars, `uvicorn app.main:app --reload`).
2. Frontend: see `web/README.md` (`npm install && npm run dev`).
3. Configure Supabase tables/RLS per the schema in the planning notes; ensure JWTs include `role`.

## Supabase schema & seed
- SQL scripts are in `api/db/schema.sql` and `api/db/seed.sql`.
- Apply with psql or Supabase SQL editor:
  - `psql "$SUPABASE_DB_URL" -f api/db/schema.sql`
  - `psql "$SUPABASE_DB_URL" -f api/db/seed.sql`

## Env vars
Copy `api/.env.example` -> `.env` and fill Supabase + Gemini keys.
