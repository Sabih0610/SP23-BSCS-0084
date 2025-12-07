# Use Cases & High-Level Design

## Use Case 1 – Recruiter checks one CV against one JD

**Name:** UC1 – Single CV–JD Match for Recruiter  
**Actor:** Recruiter  
**Goal:** Quickly understand how well a CV matches a specific job.

### Trigger

Recruiter receives a new CV for an open role and wants a quick match indication.

### Preconditions

- Recruiter has:
  - The CV saved as a text file.
  - The JD saved as a text file.
- The tool is installed (Python 3 available).

### Main Flow

1. Recruiter opens a terminal.
2. Recruiter runs:
   - `python cv_matcher.py cv.txt jd.txt`
3. System:
   1. Reads both files.
   2. Extracts keywords/skills from JD and CV.
   3. Calculates match score (%) and match level (Low/Medium/High).
   4. Identifies:
      - Skills present in both CV and JD (overlaps).
      - Skills present in JD but missing in CV (gaps).
4. System prints:
   - Match score (e.g., `72%`).
   - Match level (e.g., `High`).
   - List of matched skills.
   - List of missing skills.
5. Recruiter uses this information during initial screening.

### Alternate Flows

- **AF1 – Missing file path**
  - If either file path is invalid, system prints an error message and usage help.
- **AF2 – Empty JD text**
  - If JD file is empty, system prints a warning and returns a 0% match.

---

## Use Case 2 – Candidate self-checks fit before applying

**Name:** UC2 – Candidate Self-Assessment  
**Actor:** Candidate  
**Goal:** See whether their CV fits a specific role before applying.

### Trigger

Candidate finds a job ad and wants to understand if they are a good fit.

### Preconditions

- Candidate has their CV in text form.
- Candidate has copied the JD into a text file.
- Candidate can run simple Python scripts.

### Main Flow

1. Candidate saves:
   - `my_cv.txt`
   - `target_jd.txt`
2. Candidate runs:
   - `python cv_matcher.py my_cv.txt target_jd.txt`
3. System processes the input (same as UC1).
4. System prints match score, match level, matched skills, and missing skills.
5. Candidate reviews missing skills and decides:
   - Whether to still apply.
   - Whether to update CV or work on missing skills.

### Alternate Flows

- **AF1 – Candidate improves CV**
  - Candidate edits CV to better reflect actual skills and re-runs the tool to see improved match.

---

## Use Case 3 – Recruiter compares multiple CVs for a single JD (manual loop)

**Name:** UC3 – Manual Batch Comparison  
**Actor:** Recruiter  
**Goal:** Compare multiple candidates against the same JD using the tool.

### Trigger

Recruiter has a list of CVs shortlisted for an open role.

### Preconditions

- Recruiter has:
  - A JD text file, e.g., `frontend_jd.txt`.
  - Multiple CV text files, e.g., `cv_ali.txt`, `cv_sara.txt`, `cv_umar.txt`.
- Tool is installed.

### Main Flow

1. Recruiter runs the tool repeatedly:
   - `python cv_matcher.py cv_ali.txt frontend_jd.txt`
   - `python cv_matcher.py cv_sara.txt frontend_jd.txt`
   - `python cv_matcher.py cv_umar.txt frontend_jd.txt`
2. For each run, system prints:
   - Match score and level.
   - Top matched and missing skills.
3. Recruiter notes down the scores (e.g., in a spreadsheet) and compares candidates.
4. Recruiter uses scores + explanations to prioritize candidates for interviews.

### Alternate Flows

- **AF1 – Recruiter filters by threshold**
  - Recruiter decides to only consider candidates with `Medium` or `High` match level.

---

## High-Level Design & Data Flow

### Main Components

1. **Input Layer**
   - Reads CV and JD text files from disk.
   - Validates that files exist and are not empty.

2. **Text Processing & Keyword Extraction**
   - Converts text to lowercase.
   - Tokenizes into words.
   - Removes stopwords and very short tokens.
   - Produces two sets of keywords:
     - `jd_skills`
     - `cv_skills`

3. **Matching & Scoring Engine**
   - Computes:
     - `matched_skills = jd_skills ∩ cv_skills`
     - `missing_skills = jd_skills - cv_skills`
   - Calculates score:
     - `score = len(matched_skills) / len(jd_skills) * 100` (if JD has any skills).
   - Converts numeric score into:
     - `Low` / `Medium` / `High`.

4. **Explanation Generator**
   - Builds a short explanation with:
     - Count of overlapping skills.
     - Count of missing skills.
     - Lists of each.

5. **Output Layer**
   - Prints the results in a human-readable format:
     - Score, level, matched skills, missing skills.

### Simple Data Flow (Text)

```text
CV.txt + JD.txt
       │
       ▼
  Input Reader
       │
       ▼
  Text Cleaner & Keyword Extractor
       │
       ├──────────── jd_skills
       └──────────── cv_skills
                     │
                     ▼
           Matching & Scoring Engine
                     │
                     ▼
             Explanation Generator
                     │
                     ▼
        Console Output (score + reasons)
