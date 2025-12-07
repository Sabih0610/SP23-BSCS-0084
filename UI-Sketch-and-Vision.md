# UI Sketch & Vision

## Sketch (ASCII)
```
Public Landing
┌───────────────────────────────────────────────┐
│ Hero: "Instant CV–JD fit with reasons"        │
│ [Signup Recruiter] [Signup Candidate] [Jobs]  │
│ Steps cards (Upload JD → Score → Explain)     │
└───────────────────────────────────────────────┘

Recruiter Dashboard
┌─────────Nav─────────┬─────────────────────────┐
│ Dashboard           │ KPIs: Open Jobs, Matches│
│ Jobs                │ Cards: Attention, Quick │
│ Candidates          │ Actions                 │
│ Settings            │ Table: Job pipeline     │
└─────────────────────┴─────────────────────────┘

Candidate Match Check
┌─────────Nav─────────┬─────────────────────────┐
│ Dashboard           │ Textarea: Paste JD      │
│ Profile             │ Select: CV to use       │
│ Match Checker       │ Button: Check my fit    │
│ Applications        │ Result card: Score,     │
│ Posts / Feed        │ matched/missing, tips   │
└─────────────────────┴─────────────────────────┘
```

## Vision (UI principles)
- **Clarity first:** Keep role-based layouts consistent (left nav, top KPIs, card grids). Use concise copy that explains “why” (matched vs missing skills).
- **Actionable AI:** AI buttons sit next to inputs (Improve JD, Autofill from CV, Score all) with inline status + retry guidance.
- **Explainability:** Always show score + rationale + matched/missing lists; color-coded pills instead of opaque percentages.
- **Low-friction onboarding:** Public jobs visible without login; signup routes pre-select role; local dev bypass keeps dashboards usable.
- **Scalable surfaces:** Tables and cards ready for pagination/filtering; notifications slot on top bar; consistent empty/error states.***
