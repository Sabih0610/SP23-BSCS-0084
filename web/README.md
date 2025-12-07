# HireMatch Web (React + Vite)

React + Vite frontend for HireMatch with public landing page, role-specific routes, and placeholders for recruiter/candidate/admin flows.

## Quickstart

```bash
cd web
npm install
npm run dev
```

## Routes
- Public: `/`, `/login`, `/signup?role=`, `/jobs`, `/jobs/:slug`
- Admin: `/admin/dashboard`, `/admin/users`, `/admin/companies`, `/admin/jobs`, `/admin/posts`
- Recruiter: `/recruiter/dashboard`, `/recruiter/profile`, `/recruiter/jobs`, `/recruiter/jobs/new`, `/recruiter/jobs/:id`, `/recruiter/jobs/:id/candidates/add`, `/recruiter/candidates/:id`, `/recruiter/settings`
- Candidate: `/candidate/dashboard`, `/candidate/profile`, `/candidate/match-check`, `/candidate/applications`, `/candidate/matches`, `/candidate/posts`, `/candidate/posts/new`, `/candidate/feed`

The landing page already highlights the two signup paths and the role summaries.
