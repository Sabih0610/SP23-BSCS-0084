# api\app\services\matching.py
import json
from typing import Any, Dict, Optional

import anyio
import google.generativeai as genai
from supabase import Client

from ..config import Settings


def _strip_code_fences(text: str) -> str:
    """
    Gemini sometimes wraps JSON in ```json ... ``` fences.
    This removes them if present.
    """
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        return "\n".join(lines).strip()
    return text


def build_candidate_payload(profile: Dict[str, Any], cv_text: Optional[str]) -> Dict[str, Any]:
    """
    Build a simplified candidate payload for scoring prompts.
    Routers import this: from ..services.matching import build_candidate_payload
    """
    return {
        "headline": profile.get("headline"),
        "location": profile.get("location"),
        "remote_pref": profile.get("remote_pref"),
        "summary": profile.get("summary"),
        "skills": profile.get("skills") or [],
        "links": profile.get("links") or [],
        "cv_text": cv_text or "",
    }


class MatchingService:
    """
    Wrapper around Gemini for:
    - Improving job descriptions
    - Scoring candidates against jobs
    """

    def __init__(self, settings: Settings, supabase: Client):
        self.supabase = supabase
        genai.configure(api_key=settings.gemini_api_key)
        # Use a model available in your current SDK (see genai.list_models()).
        self.model = genai.GenerativeModel("gemini-2.5-flash")

    def _generate(self, prompt: str) -> str:
        response = self.model.generate_content(prompt)
        return response.text

    async def _generate_json(self, prompt: str) -> Dict[str, Any]:
        text = await anyio.to_thread.run_sync(self._generate, prompt)
        cleaned = _strip_code_fences(text)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return {}

    async def improve_job_description(self, jd_text: str) -> Dict[str, Any]:
        prompt = f"""
You are an expert technical recruiter.

You will receive a raw job description. Your job is to:
1. Clean and improve the description for clarity, structure, and attractiveness.
2. Extract MUST-HAVE skills (core requirements).
3. Extract NICE-TO-HAVE skills (bonuses, optional).

Return ONLY valid JSON with this exact structure:

{{
  "description": "Improved job description as a single long string...",
  "must_have": ["skill1", "skill2", "..."],
  "nice_to_have": ["skillA", "skillB", "..."]
}}

Do not include any explanatory text outside the JSON.
Here is the raw job description:

\"\"\"{jd_text}\"\"\"        
        """.strip()

        data = await self._generate_json(prompt)
        return {
            "description": data.get("description", jd_text),
            "must_have": data.get("must_have") or [],
            "nice_to_have": data.get("nice_to_have") or [],
        }

    async def suggest_profile_from_cv(self, cv_text: str) -> Dict[str, Any]:
        """
        Generate candidate profile suggestions (headline, summary, skills, links) from CV text.
        """
        prompt = f"""
You are a career coach helping a candidate set up a concise profile from their CV.

Return ONLY valid JSON:
{{
  "headline": "Short role/title headline",
  "summary": "2-4 sentence summary highlighting strengths",
  "skills": ["skill1","skill2", "..."],
  "links": ["https://example.com/portfolio", "..."]
}}

CV TEXT:
\"\"\"{cv_text[:6000]}\"\"\"
""".strip()
        data = await self._generate_json(prompt)
        return {
            "headline": data.get("headline"),
            "summary": data.get("summary"),
            "skills": data.get("skills") or [],
            "links": data.get("links") or [],
        }

    async def score_candidate_for_job(
        self,
        job: Dict[str, Any],
        candidate: Dict[str, Any],
    ) -> Dict[str, Any]:
        job_title = job.get("title") or "Role"
        job_desc = job.get("description") or ""
        job_skills = job.get("skills") or []

        cand_headline = candidate.get("headline") or ""
        cand_location = candidate.get("location") or ""
        cand_remote_pref = candidate.get("remote_pref") or ""
        cand_summary = candidate.get("summary") or ""
        cand_skills = candidate.get("skills") or []
        cand_links = candidate.get("links") or []
        cand_cv_text = candidate.get("cv_text") or ""

        prompt = f"""
You are an AI assistant helping a recruiter decide how well a candidate fits a job.

You will receive a job and a candidate profile (including parsed CV text).
You must evaluate the match and respond ONLY with valid JSON in this structure:

{{
  "score": 0-100 as a number,
  "band": "poor" | "ok" | "strong" | "excellent",
  "matched_skills": ["..."],
  "missing_skills": ["..."],
  "rationale": "Short explanation in 3–6 sentences."
}}

Give higher scores when the candidate clearly matches most of the core skills and responsibilities.

JOB:
- Title: {job_title}
- Description:
{job_desc}

- Explicit job skills (may be empty): {job_skills}

CANDIDATE:
- Headline: {cand_headline}
- Location: {cand_location}
- Remote preference: {cand_remote_pref}
- Summary:
{cand_summary}

- Declared skills: {cand_skills}
- Links: {cand_links}

- CV Text:
\"\"\"{cand_cv_text}\"\"\"        
        """.strip()

        data = await self._generate_json(prompt)

        score = float(data.get("score") or 0.0)
        band = data.get("band") or None
        matched_skills = data.get("matched_skills") or []
        missing_skills = data.get("missing_skills") or []
        rationale = data.get("rationale") or ""

        if score < 0:
            score = 0.0
        if score > 100:
            score = 100.0

        return {
            "score": score,
            "band": band,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "rationale": rationale,
        }
