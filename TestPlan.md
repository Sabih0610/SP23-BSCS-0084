
---

## 7. `TestPlan.md`

```markdown
# Test Plan – HR CV–JD Match Assistant

This document lists basic tests for the MVP implementation.

---

## Test Case 1 – Strong Match (Positive / Normal)

- **ID:** TC1
- **Description:** CV closely matches JD skills.
- **Input:**
  - CV: contains `react`, `javascript`, `html`, `css`, `git`, `rest`, `testing`.
  - JD: requires `react`, `javascript`, `html`, `css`, `git`, `rest`, `testing`.
- **Steps:**
  1. Save CV text to `cv_tc1.txt`.
  2. Save JD text to `jd_tc1.txt`.
  3. Run: `python cv_matcher.py cv_tc1.txt jd_tc1.txt`.
- **Expected Result:**
  - Match score close to 100%.
  - Match level: `High`.
  - Missing skills list: empty or very small.
- **Actual Result:** (to be filled after running)
- **Pass / Fail:** (to be filled)

---

## Test Case 2 – Partial Match (Medium)

- **ID:** TC2
- **Description:** CV has some but not all of the JD skills.
- **Input:**
  - CV: `react`, `javascript`, `html`, `css`.
  - JD: `react`, `javascript`, `html`, `css`, `git`, `rest`.
- **Steps:**
  1. Create `cv_tc2.txt` and `jd_tc2.txt` with above content.
  2. Run: `python cv_matcher.py cv_tc2.txt jd_tc2.txt`.
- **Expected Result:**
  - Match score around 40–70%.
  - Match level: `Medium`.
  - Missing skills include `git`, `rest`.
- **Actual Result:** …
- **Pass / Fail:** …

---

## Test Case 3 – Very Low Match (Negative)

- **ID:** TC3
- **Description:** CV is from a different domain, almost no overlapping skills.
- **Input:**
  - CV: text about “graphic design, Photoshop, Illustrator”.
  - JD: text about “Python, data analysis, SQL, statistics”.
- **Steps:**
  1. Save CV and JD to `cv_tc3.txt` and `jd_tc3.txt`.
  2. Run: `python cv_matcher.py cv_tc3.txt jd_tc3.txt`.
- **Expected Result:**
  - Match score very low (near 0%).
  - Match level: `Low`.
  - Almost all JD skills appear in missing list.
- **Actual Result:** …
- **Pass / Fail:** …

---

## Test Case 4 – Empty JD (Edge Case)

- **ID:** TC4
- **Description:** JD file is empty or has no meaningful words.
- **Input:**
  - CV: normal CV.
  - JD: empty file.
- **Steps:**
  1. Create `cv_tc4.txt` with some CV content.
  2. Create empty `jd_tc4.txt`.
  3. Run: `python cv_matcher.py cv_tc4.txt jd_tc4.txt`.
- **Expected Result:**
  - Warning about empty JD.
  - Match score: `0%`.
  - Match level: `Low`.
- **Actual Result:** …
- **Pass / Fail:** …

---

## Test Case 5 – JD with Repeated Skills (Robustness)

- **ID:** TC5
- **Description:** JD repeats some skills multiple times; score should still be fair.
- **Input:**
  - CV: has `react`, `javascript`, `html`.
  - JD: “We need React, React, React, JavaScript, HTML”.
- **Steps:**
  1. Save CV and JD texts to `cv_tc5.txt` and `jd_tc5.txt`.
  2. Run: `python cv_matcher.py cv_tc5.txt jd_tc5.txt`.
- **Expected Result:**
  - Duplicates do not overly inflate the score because keywords are treated as a set.
  - Match score based on unique skills `{react, javascript, html}`.
- **Actual Result:** …
- **Pass / Fail:** …
