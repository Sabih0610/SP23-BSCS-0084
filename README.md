# AI Recruitment System (Vite + React)

A single-page app for multi-role recruitment workflows (candidate, recruiter, admin) built with Vite, React, TypeScript, Tailwind, and shadcn-ui. Supabase handles auth and data; routing is client-side via React Router.

## Tech stack
- Vite + React + TypeScript
- Tailwind CSS + shadcn-ui
- Supabase (auth, Postgres)
- @tanstack/react-query

## Getting started
1) Install dependencies:
```bash
npm install
```
2) Copy env template and fill Supabase values:
```bash
cp .env.example .env.local
# set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
```
3) Run dev server:
```bash
npm run dev
```
4) Production build:
```bash
npm run build
```

## Environment variables
Required (local and Vercel):
- `VITE_SUPABASE_URL` – your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` – your Supabase anon public key

If either variable is missing, the app fails early during Supabase client creation.

## Deploying to Vercel
Configured via `vercel.json`:
- Build command: `npm run build`
- Output directory: `dist`
- SPA routing: all paths rewrite to `/index.html` for client-side routes
- Framework hint: `vite`

Steps:
1) Push the repo to GitHub/GitLab/Bitbucket.
2) Import into Vercel; keep the detected Vite settings (or the values above).
3) Add the two Supabase env vars for Production (and Preview if needed).
4) Deploy — routes like `/dashboard/*` work via the SPA rewrite.

## Available scripts
- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run preview` – preview the production build
- `npm run lint` – lint the project
