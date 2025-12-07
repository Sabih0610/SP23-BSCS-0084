# Release Roadmap

## 0–3 Months (MVP polish)
- Stabilize Supabase schema/RLS; add migrations + seed automation.
- Harden auth flows (email verification path, role enforcement, audit logging).
- Improve match prompts + caching; handle AI failures gracefully.
- Add minimal analytics in admin (job views, matches run).
- Ship basic error states + loading skeletons on frontend.

## 3–12 Months (Product fit)
- Add candidate/job search with embeddings for fuzzy skill match.
- Introduce recruiter shortlists, comments, and lightweight Kanban pipeline.
- Add scheduled rescoring + notifications when scores change.
- Integrate email/Slack for recruiter notifications; webhook for ATS ingestion.
- Expand testing: contract tests for API + frontend e2e smoke.

## 12–24 Months (Scale & integrations)
- Multi-tenant controls (orgs, billing plans, seat management, usage quotas).
- SOC2-ready controls: audit trails, secrets management, PII redaction.
- ATS/HRIS integrations (Greenhouse/Lever), LinkedIn/Indeed job sync.
- Model improvements: domain-tuned embeddings, safety filters, prompt versioning.
- Advanced analytics: conversion funnels, time-to-fill, bias checks.***
