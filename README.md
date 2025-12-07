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

     ```powershell
     Set-Location 'F:\hr\api'
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```

   - Install dependencies and run the API:

     ```powershell
     pip install -r requirements.txt
     uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
     ```

   - Database schema and seed (if using Supabase or Postgres locally):

     ```powershell
     psql "$SUPABASE_DB_URL" -f api/db/schema.sql
     psql "$SUPABASE_DB_URL" -f api/db/seed.sql
     ```

   - Environment variables: copy or create `api/.env` (not committed). The project expects Supabase keys and any other secrets referenced in `api/config.py`.

2) Frontend

   - From the repo root:

     ```powershell
     Set-Location 'F:\hr\web'
     npm install
     npm run dev
     ```

   - The dev server runs on a Vite port (typically `5173`). Update API URLs in `web/src/lib/api.ts` if needed.

Notes
- The `api/requirements.txt` lists Python deps. Use the virtual environment to avoid committing site-packages.
- `api/.venv/` and `web/node_modules/` are now ignored by `.gitignore`; if you previously pushed large directories and want to remove them from git history, I can help (this requires rewriting history and force-push).
- If you deploy, provide production environment variables securely (CI secrets / environment settings).

Repository files of interest
- `api/db/schema.sql` — DB schema
- `api/db/seed.sql` — initial seed data
- `api/app/main.py` — FastAPI app entrypoint
- `web/src` — frontend source code

Need help next?
- I can add an `MIT` `LICENSE` now and push it, and optionally enhance this README with more details (examples of env variables). I can also rewrite history to purge large files if you want — say `A` (add MIT + README improvements) or `B` (purge history) or `C` (both).

---
