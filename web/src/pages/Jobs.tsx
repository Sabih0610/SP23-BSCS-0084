// web\src\pages\Jobs.tsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

type Job = {
  id?: string;
  slug: string;
  title: string;
  company: string;
  location?: string;
  summary?: string;
  match?: number;
};

export function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${API_URL}/jobs`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const formatted = (data || []).map((j: any) => ({
          id: j.id,
          slug: j.slug || j.id,
          title: j.title,
          company: j.company?.name || "Company",
          location: j.location,
          summary: j.description?.slice(0, 140) || "No description yet.",
          match: undefined,
        }));
        setJobs(formatted);
        setError(null);
      } catch (e: any) {
        setError(`Error loading jobs: ${e.message}`);
        setJobs([]);
      }
    };
    fetchJobs();
  }, []);

  return (
    <div className="app-shell">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ marginBottom: 8 }}>Open roles</h1>
          <p style={{ margin: 0 }}>Browse active jobs. Log in to see your personal match.</p>
        </div>
        <Link className="button secondary" to="/login">
          Login to apply
        </Link>
      </div>
      {error && <p style={{ color: "#c00" }}>{error}</p>}
      {jobs.length === 0 ? (
        <p>No jobs available yet.</p>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
          {jobs.map((job) => (
            <Link key={job.slug} to={`/jobs/${job.slug}`} className="card" style={{ display: "grid", gap: 6 }}>
              <strong>{job.title}</strong>
              <span>{job.company}</span>
              <small>{job.location}</small>
              <p>{job.summary}</p>
              <div className="pill secondary" style={{ background: "#f2f4f8", color: "#333" }}>
                View details
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function JobDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [job, setJob] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applyStatus, setApplyStatus] = useState<string | null>(null);
  const [matchStatus, setMatchStatus] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<any | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`${API_URL}/jobs/${slug}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setJob(data);
        setError(null);
      } catch (e: any) {
        setError(e.message);
        setJob(null);
      }
    };
    if (slug) fetchJob();
  }, [slug]);

  if (error) {
    return (
      <div className="app-shell">
        <p style={{ color: "#c00" }}>Error loading job: {error}</p>
      </div>
    );
  }
  if (!job) {
    return (
      <div className="app-shell">
        <p>Loading job...</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="card" style={{ display: "grid", gap: 8 }}>
        <div className="pill">Public job</div>
        <h1>{job.title}</h1>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span>{job.company?.name || "Company"}</span>
          <span>-</span>
          <span>{job.location}</span>
        </div>
        <p>{job.description || job.summary}</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            className="button"
            type="button"
            onClick={async () => {
              if (!job.id) return;
              setApplyStatus("Applying...");
              try {
                await apiFetch(`/candidate/apply/${job.id}`, { method: "POST", body: JSON.stringify({}) });
                setApplyStatus("Applied with profile.");
              } catch (e: any) {
                setApplyStatus(e.message || "Apply failed. Ensure you are logged in as candidate.");
              }
            }}
          >
            Apply with profile
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={async () => {
              setMatchStatus("Checking match...");
              setMatchResult(null);
              try {
                const res = await apiFetch(`/candidate/match-check`, {
                  method: "POST",
                  body: JSON.stringify({
                    jd_text: job.description || job.title,
                    cv_id: null,
                  }),
                });
                setMatchResult(res);
                setMatchStatus("Match calculated.");
              } catch (e: any) {
                setMatchStatus(e.message || "Match check failed. Ensure you are logged in as candidate.");
              }
            }}
          >
            Check my match
          </button>
        </div>
        {applyStatus && <div style={{ color: applyStatus.includes("failed") ? "#c00" : "#0a7" }}>{applyStatus}</div>}
        {matchStatus && <div style={{ color: matchStatus.includes("failed") ? "#c00" : "#0a7" }}>{matchStatus}</div>}
        {matchResult && (
          <div className="card" style={{ background: "#f6f7fb", marginTop: 8 }}>
            <strong>Match Score: {Math.round(matchResult.score || 0)}%</strong>
            <div style={{ fontSize: 14, color: "#444", marginTop: 4 }}>{matchResult.suggestions || matchResult.rationale || ""}</div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 6 }}>
              Matched: {(matchResult.matched_skills || []).join(", ") || "-"}
            </div>
            <div style={{ fontSize: 13, color: "#666" }}>
              Missing: {(matchResult.missing_skills || []).join(", ") || "-"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
