# api\app\schemas.py
from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, EmailStr, HttpUrl, Field


class AuthUser(BaseModel):
    user_id: str
    role: Literal["admin", "recruiter", "candidate", "authenticated"]
    token: Optional[str] = None


class Company(BaseModel):
    id: str
    name: str
    website: Optional[HttpUrl] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    plan: Optional[str] = "free"


class RecruiterProfile(BaseModel):
    company_id: str
    title: Optional[str] = None
    linkedin_url: Optional[HttpUrl] = None
    about: Optional[str] = None


class CandidateProfile(BaseModel):
    headline: Optional[str] = None
    location: Optional[str] = None
    remote_pref: Optional[str] = None
    summary: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    links: List[HttpUrl] = Field(default_factory=list)


class JobSkill(BaseModel):
    skill: str
    importance: Literal["must", "nice"] = "must"


class JobCreate(BaseModel):
    title: str
    location: Optional[str] = None
    remote: bool = True
    employment_type: Optional[str] = None
    seniority: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    description: Optional[str] = None
    skills: List[JobSkill] = Field(default_factory=list)
    status: Literal["draft", "open", "closed"] = "open"


class JobUpdate(JobCreate):
    status: Literal["draft", "open", "closed"] = "open"


class JobPublic(BaseModel):
    id: str
    slug: str
    company: Company
    title: str
    location: Optional[str] = None
    remote: bool = True
    employment_type: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    status: str


class Application(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    cv_id: Optional[str] = None
    status: Literal["applied", "viewed", "shortlisted", "rejected"] = "applied"
    applied_at: datetime
    match_score: Optional[float] = None
    match_level: Optional[str] = None
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    rationale: Optional[str] = None
    best_fit: Optional[bool] = False
    last_scored_at: Optional[datetime] = None


class MatchRequest(BaseModel):
    job_id: str
    candidate_id: str
    cv_id: Optional[str] = None


class MatchResult(BaseModel):
    job_id: str
    candidate_id: str
    score: float
    match_level: Optional[str] = None
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    rationale: str
    created_at: datetime


class MatchCheckRequest(BaseModel):
    jd_text: str
    cv_id: Optional[str] = None


class MatchCheckResponse(BaseModel):
    score: float
    matched_skills: List[str]
    missing_skills: List[str]
    suggestions: str


class PostCreate(BaseModel):
    body: str
    visibility: Literal["public", "hidden"] = "public"


class DashboardStat(BaseModel):
    label: str
    value: str
    trend: Optional[str] = None
