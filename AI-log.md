# AI-log – HR CV–JD Match Assistant

## Tool 1 – ChatGPT (OpenAI, GPT-5.1 Thinking via ChatGPT)

### What I used it for

- Clarifying the midterm requirements and constraints.
- Drafting initial versions of:
  - `ProblemStatement.md`
  - `UseCases.md`
  - `TestPlan.md`
  - `UI-Sketch-and-Vision.md`
  - `ReleaseRoadmap.md`
- Getting a starting point for the Python MVP (`cv_matcher.py`) and example test cases.
- Getting suggestions for a simple UI sketch using PlantUML notation.

  Prompts Used

1. **Prompt 1 (requirements understanding)**  
   > “Go through this pdf. My project is this: Option 1 – HR CV–JD Match Assistant… I want you to solve these deliverables.”

   **Used for:**  
   Understanding the assignment, confirming required files and structure.

2. **Prompt 2 (design + files)**  
   > “Do these and create these files so I could just push them on GitHub; for UI provide PlantUML.”

   **Used for:**  
   Getting draft content for markdown files (ProblemStatement, UseCases, TestPlan, README, AI-log, UI sketch, Release roadmap) and a simple Python MVP.


---

### How I Edited / Verified the AI Output

- I read through all generated markdown files and:
  - Adjusted wording where needed to match my own understanding and style.
  - Ensured the scope, users and assumptions match what I actually want to implement.
- I went through the Python file `cv_matcher.py` line by line and made sure I can explain:
  - How text is cleaned and tokenized.
  - How stopwords and short tokens are removed.
  - How matched and missing skills are computed.
  - How the score and match level are derived.

I also ran the script locally with sample CV/JD text and verified that:

- The score changes when I add/remove skills from the CV.
- The match level changes (`Low`, `Medium`, `High`) when the score crosses thresholds.

---

### Reflection – Usefulness vs Risks

**Usefulness**

- Saved time on boilerplate documentation (file structure, headings, standard wording).
- Helped me structure my solution (problem framing, use cases, test plan).
- Provided a working base implementation faster than writing everything from scratch.

**Risks / Limitations**

- If I just copy/paste without understanding, I could fail the viva (straight F).
- The AI does not know my teacher’s exact marking scheme.
- The suggested algorithm is simple (keyword overlap), not an advanced AI model.

**How I Mitigated Risks**

- I made sure I can explain each part of the code and design in my own words.
- I adjusted details (e.g., thresholds, wording) where necessary.
- I plan to treat this as a **starting point**, not blind truth; I am responsible for the final submission.
