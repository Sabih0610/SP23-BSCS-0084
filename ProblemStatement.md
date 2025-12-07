# HR CV–JD Match Assistant – Problem Statement

## 1. Pain Point & Why It Matters

Recruiters and hiring managers often receive dozens or hundreds of CVs for a single job.  
Manually scanning each CV against the Job Description (JD) is:

- **Slow** – repetitive reading of similar CVs and JDs.
- **Inconsistent** – different recruiters judge “fit” differently.
- **Error-prone** – easy to miss missing key skills or requirements.
- **Hard for candidates** – they don’t clearly see how well they fit a role.

This leads to:

- Wasted recruiter time during initial screening.
- Good candidates being overlooked.
- Candidates applying blindly without understanding their match level.

A simple assistant that quickly shows **how well a CV matches a JD** and **why** can make early screening faster and more transparent for both recruiters and candidates.

---

## 2. Primary Users

1. **Primary user – Recruiter / HR professional**
   - Needs a quick way to see if a candidate is a good fit for a specific role.
   - Wants a simple match indicator and a short explanation.

2. **Secondary user – Candidate / Job seeker**
   - Wants to self-check their CV against a JD before applying.
   - Wants to understand which skills and requirements they are missing.

---

## 3. MVP Goal

Build a **minimal working tool** that:

- Accepts **one CV** (plain text) and **one JD** (plain text).
- Extracts simple **skills/keywords** from both.
- Computes a **match score** (percentage) and a **match level** (`Low`, `Medium`, `High`).
- Highlights:
  - Skills present in both CV and JD (strong overlaps).
  - Skills required in the JD but missing from the CV (gaps).

The focus is on **supporting initial screening**, not making a final hiring decision.

---

## 4. In Scope (MVP)

- Input format:
  - CV text as a `.txt` file.
  - JD text as a `.txt` file.
- Simple keyword / skill extraction:
  - Lowercasing, basic tokenization, removal of stop-words.
  - Treat remaining words as candidate “keywords/skills”.
- Match logic:
  - Match score = `(number of JD skills found in CV) / (total distinct JD skills) * 100`.
  - Match level thresholds:
    - `High` ≥ 70%
    - `Medium` 40–69%
    - `Low` < 40%
- Explanation:
  - List of **matched skills**.
  - List of **missing skills** from the JD.
- Simple command-line interface (CLI):
  - Run via `python cv_matcher.py sample_cv.txt sample_jd.txt`.
  - Prints score, level, and explanation to console.

---

## 5. Explicitly Out of Scope (for MVP)

These are useful but **not** implemented in the first version:

- No multi-language support (English-only text assumed).
- No advanced NLP (no embeddings, ML model, or POS tagging).
- No separate parsing of:
  - Years of experience.
  - Education level.
  - Job titles.
- No web UI or database storage (MVP is a local CLI tool).
- No handling of multiple CVs or multiple JDs at once (one CV vs one JD at a time).
- No integration with real ATS systems, job boards, or email.
- No user authentication or role management.

---

## 6. Assumptions

- CVs and JDs are available as **reasonably clean English text**.
- Recruiters are comfortable running a simple Python script from the command line.
- Recruiters understand that the tool is a **supporting assistant**, not a final decision-maker.
- A simple skill-based overlap is acceptable as a **first approximation** of match (good enough for a midterm MVP).
- For now, “skills” are approximated by filtered keywords; this will be refined in future versions.
