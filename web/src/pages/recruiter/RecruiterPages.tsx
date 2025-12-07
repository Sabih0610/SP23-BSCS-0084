//web\src\pages\recruiter\RecruiterPages.tsx
import { Card, DashboardLayout, SimpleTable } from "../../components/DashboardLayout";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";

const inputStyle = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #d5d8e5",
  fontSize: 16,
} as const;

export function RecruiterDashboard() {
  return (
    <DashboardLayout
      role="recruiter"
      title="Recruiter Dashboard"
      subtitle="See open jobs, pipeline, and recent matches."
      nav={[
        { label: "Dashboard", href: "/recruiter/dashboard" },
        { label: "Jobs", href: "/recruiter/jobs" },
        { label: "Create Job", href: "/recruiter/jobs/new" },
        { label: "Candidates", href: "/recruiter/candidates" },
        { label: "Settings", href: "/recruiter/settings" },
      ]}
      kpis={[
        { label: "Open Jobs", value: "4" },
        { label: "Pipeline Candidates", value: "57" },
        { label: "Matches This Month", value: "23" },
        { label: "New Applications (7d)", value: "12" },
      ]}
      actions={[
        <a key="create" className="button" href="/recruiter/jobs/new">Post a Job</a>,
        <a key="add" className="button secondary" href="/recruiter/jobs">View Candidates</a>,
      ]}
    >
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
        <Card title="Quick Actions">
          <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 8 }}>
            <a className="button" href="/recruiter/jobs/new">Create New Job</a>
            <a className="button secondary" href="/recruiter/jobs">View All Jobs</a>
            <a className="button secondary" href="/recruiter/jobs">Add Candidate</a>
          </div>
        </Card>
        <Card title="Attention">
          <ul style={{ paddingLeft: 18, margin: 0, display: "grid", gap: 6 }}>
            <li>5 new applications to review.</li>
            <li>2 candidates scored 90%+ for "Frontend Developer".</li>
            <li>Last match run: 1 day ago.</li>
          </ul>
        </Card>
      </div>

      <div style={{ marginTop: 16 }}>
        <Card title="Job Pipeline">
          <SimpleTable
            columns={["Job Title", "Status", "Applications", "High Matches", "Last Match", "Actions"]}
            rows={[
              ["Frontend Developer", "Open", "25", "8 (>=75%)", "03 Dec", <a href="/recruiter/jobs/1">View</a>],
              ["Data Analyst", "Open", "14", "3 (>=75%)", "02 Dec", <a href="/recruiter/jobs/2">View</a>],
              ["Backend Engineer", "Closed", "40", "5", "28 Nov", <a href="/recruiter/jobs/3">View</a>],
            ]}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}

export function RecruiterProfile() {
  return (
    <DashboardLayout
      role="recruiter"
      title="Recruiter Profile"
      subtitle="Company info, logo, website, recruiter name/title, LinkedIn link."
      nav={[
        { label: "Dashboard", href: "/recruiter/dashboard" },
        { label: "Jobs", href: "/recruiter/jobs" },
        { label: "Create Job", href: "/recruiter/jobs/new" },
        { label: "Candidates", href: "/recruiter/candidates" },
        { label: "Settings", href: "/recruiter/settings" },
      ]}
    >
      <Card title="Profile">Fill in your company details and contact links.</Card>
    </DashboardLayout>
  );
}

export function RecruiterJobs() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["recruiter-jobs"],
    queryFn: () => apiFetch("/recruiter/jobs"),
  });
  const jobs = (data as any[]) || [];
  return (
    <DashboardLayout
      role="recruiter"
      title="Jobs"
      subtitle="List of jobs with status (open/closed/draft). Click into detail for matches."
      nav={[
        { label: "Dashboard", href: "/recruiter/dashboard" },
        { label: "Jobs", href: "/recruiter/jobs" },
        { label: "Create Job", href: "/recruiter/jobs/new" },
        { label: "Candidates", href: "/recruiter/candidates" },
        { label: "Settings", href: "/recruiter/settings" },
      ]}
      actions={[<a key="create" className="button" href="/recruiter/jobs/new">Create New Job</a>]}
    >
      <Card title="Your Jobs">
        {error && <p style={{ color: "#c00" }}>Error loading jobs: {(error as Error).message}</p>}
        {isLoading ? (
          <p>Loading jobs...</p>
        ) : (
          <SimpleTable
            columns={["Job", "Status", "Actions"]}
            rows={
              jobs.length
                ? jobs.map((job) => [
                    job.title,
                    job.status || "open",
                    <div key={job.id} style={{ display: "flex", gap: 8 }}>
                      <a className="button secondary" href={`/recruiter/jobs/${job.id}`}>View</a>
                      <a className="button secondary" href={`/recruiter/jobs/${job.id}/applications`}>Applications</a>
                    </div>,
                  ])
                : [["No jobs yet", "-", "Create one above"]]
            }
          />
        )}
      </Card>
    </DashboardLayout>
  );
}

export function RecruiterJobNew() {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("Full-time");
  const [seniority, setSeniority] = useState("Mid");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [description, setDescription] = useState("");
  const [mustSkills, setMustSkills] = useState("");
  const [niceSkills, setNiceSkills] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setDescription(text);
      // naive extraction: first line as title, rest to description
      const firstLine = text.split("\n").find((l) => l.trim().length > 0);
      if (firstLine && !title) setTitle(firstLine.trim().slice(0, 80));
      // basic skill guess by common delimiters
      const guessedSkills = Array.from(
        new Set(
          (text.match(/\b[A-Z][a-zA-Z+\-.]{1,}\b/g) || [])
            .filter((w) => w.length <= 18)
            .slice(0, 12)
        )
      );
      if (guessedSkills.length) setMustSkills(guessedSkills.join(", "));
    };
    reader.readAsText(file);
  };

  const onPublish = async () => {
    setBusy(true);
    setStatusMsg(null);
    try {
      const skills = [
        ...mustSkills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((skill) => ({ skill, importance: "must" as const })),
        ...niceSkills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((skill) => ({ skill, importance: "nice" as const })),
      ];
      await apiFetch("/recruiter/jobs", {
        method: "POST",
        body: JSON.stringify({
          title,
          location,
          employment_type: employmentType,
          seniority,
          salary_min: salaryMin ? Number(salaryMin) : null,
          salary_max: salaryMax ? Number(salaryMax) : null,
          description,
          skills,
          status: "open",
        }),
      });
      setStatusMsg("Job published. Check /recruiter/jobs for the listing.");
      setBusy(false);
    } catch (e: any) {
      setStatusMsg(`Publish failed: ${e.message}`);
      setBusy(false);
    }
  };

  const onAiImprove = async () => {
    if (!description) {
      setStatusMsg("Paste or upload a JD first, then ask AI.");
      return;
    }
    setBusy(true);
    setStatusMsg("Asking AI to improve the JD...");
    try {
      const data = await apiFetch("/recruiter/jobs/improve", {
        method: "POST",
        body: JSON.stringify({ description }),
      });
      if (data.description) setDescription(data.description);
      if (data.must_skills?.length) setMustSkills(data.must_skills.join(", "));
      if (data.nice_skills?.length) setNiceSkills(data.nice_skills.join(", "));
      setStatusMsg("AI suggestions applied. Review before publishing.");
    } catch (e: any) {
      setStatusMsg(`AI improve failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const onExtractSkills = () => {
    if (!description) {
      setStatusMsg("Paste or upload a JD first to extract skills.");
      return;
    }
    // very rough skill extraction (replace later with AI)
    const words = description
      .split(/[^A-Za-z0-9+.#-]/)
      .filter((w) => w.length > 1 && w.length <= 20);
    const counts: Record<string, number> = {};
    words.forEach((w) => {
      counts[w] = (counts[w] || 0) + 1;
    });
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([w]) => w)
      .filter((w) => /^[A-Z]/.test(w))
      .slice(0, 10);
    if (sorted.length) setMustSkills(sorted.join(", "));
    setStatusMsg("Extracted top terms; replace with AI when available.");
  };

  const onUploadIngest = async (file: File) => {
    setBusy(true);
    setStatusMsg("Processing JD...");
    try {
      const form = new FormData();
      form.append("file", file);
      const data = await apiFetch("/recruiter/jobs/ingest", {
        method: "POST",
        body: form,
      });
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      const must = (data.must_skills || []).join(", ");
      if (must) setMustSkills(must);
      const nice = (data.nice_skills || []).join(", ");
      if (nice) setNiceSkills(nice);
      setStatusMsg("JD parsed. Review and publish.");
    } catch (e: any) {
      setStatusMsg(`Ingest failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout
      role="recruiter"
      title="Create Job"
      subtitle="Job title, location/remote, employment type, seniority, salary range, JD, skills."
      nav={[
        { label: "Dashboard", href: "/recruiter/dashboard" },
        { label: "Jobs", href: "/recruiter/jobs" },
        { label: "Create Job", href: "/recruiter/jobs/new" },
        { label: "Candidates", href: "/recruiter/candidates" },
        { label: "Settings", href: "/recruiter/settings" },
      ]}
    >
      <Card title="Form">
        <div className="grid" style={{ gap: 10 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Job title" style={inputStyle} />
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" style={inputStyle} />
          <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} style={inputStyle}>
            <option>Employment type</option>
            <option>Full-time</option>
            <option>Contract</option>
          </select>
          <select value={seniority} onChange={(e) => setSeniority(e.target.value)} style={inputStyle}>
            <option>Seniority</option>
            <option>Junior</option>
            <option>Mid</option>
            <option>Senior</option>
          </select>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 8 }}>
            <input value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder="Salary min" style={inputStyle} />
            <input value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder="Salary max" style={inputStyle} />
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Paste JD or type it here"
            style={{ ...inputStyle, minHeight: 160 }}
          />
          <div>
            <label style={{ fontSize: 14, color: "#555" }}>Upload JD (PDF/DOCX/text)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.type === "application/pdf" || file.type.includes("word")) {
                    onUploadIngest(file);
                  } else if (file.type.startsWith("text/")) {
                    handleFile(file);
                  } else {
                    setStatusMsg("Unsupported file type. Use PDF, DOCX, or TXT.");
                  }
                }
              }}
              style={{ marginTop: 6 }}
            />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="button secondary" type="button" onClick={onAiImprove}>Ask AI to improve JD</button>
            <button className="button secondary" type="button" onClick={onExtractSkills}>Extract skills from JD</button>
          </div>
          <input
            value={mustSkills}
            onChange={(e) => setMustSkills(e.target.value)}
            placeholder="Must-have skills (comma separated)"
            style={inputStyle}
          />
          <input
            value={niceSkills}
            onChange={(e) => setNiceSkills(e.target.value)}
            placeholder="Nice-to-have skills (comma separated)"
            style={inputStyle}
          />
          <button className="button" type="button" disabled={busy} onClick={onPublish}>
            {busy ? "Publishing..." : "Publish job"}
          </button>
          {statusMsg && <div style={{ color: statusMsg.startsWith("Publish failed") ? "#c00" : "#0b7" }}>{statusMsg}</div>}
        </div>
      </Card>
    </DashboardLayout>
  );
}

export function RecruiterJobDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading, error } = useQuery({
    queryKey: ["recruiter-job", id],
    queryFn: () => apiFetch(`/recruiter/jobs/${id}`),
    enabled: Boolean(id),
  });
  return (
    <DashboardLayout
      role="recruiter"
      title={job?.title || "Job Detail"}
      subtitle="Tabs: Overview, Candidates, Match Results. Run matching and shortlist candidates."
      nav={[
        { label: "Dashboard", href: "/recruiter/dashboard" },
        { label: "Jobs", href: "/recruiter/jobs" },
        { label: "Create Job", href: "/recruiter/jobs/new" },
        { label: "Candidates", href: "/recruiter/candidates" },
        { label: "Settings", href: "/recruiter/settings" },
      ]}
      actions={[
        <a key="add" className="button secondary" href={`/recruiter/jobs/${id}/candidates/add`}>Add candidates</a>,
        <a key="apps" className="button secondary" href={`/recruiter/jobs/${id}/applications`}>View applications</a>,
        <button key="run" className="button" type="button">Run matching</button>,
      ]}
    >
      {error && <p style={{ color: "#c00" }}>Error loading job: {(error as Error).message}</p>}
      {isLoading && <p>Loading job...</p>}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, alignItems: "start" }}>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}>
          <Card title="Overview">
            <ul style={{ paddingLeft: 16, margin: 0, display: "grid", gap: 6 }}>
              <li>Status: {job?.status || "Open"}</li>
              <li>Location: {job?.location || "Remote"}</li>
              <li>Employment: {job?.employment_type || "N/A"}</li>
              <li>Skills: {(job?.skills || []).map((s: any) => s.skill).join(", ") || "TBD"}</li>
              <li>Created: {job?.created_at ? new Date(job.created_at).toLocaleDateString() : "-"}</li>
            </ul>
          </Card>
          <Card title="Candidates">
            <SimpleTable
              columns={["Name", "Source", "Applied", "Status", "Match", "Actions"]}
              rows={[
                ["Ali Khan", "Applied", "02 Dec", "New", "87%", <a href="/recruiter/candidates/1">View</a>],
                ["Maria Smith", "Manual", "01 Dec", "Shortlisted", "72%", <a href="/recruiter/candidates/2">View</a>],
              ]}
            />
          </Card>
          <Card title="Match Results">
            <SimpleTable
              columns={["Candidate", "Score", "Last Run"]}
              rows={[
                ["Ali Khan", "92%", "Today"],
                ["Maria Smith", "78%", "Today"],
              ]}
            />
          </Card>
        </div>

        <Card title="AI Screening Assistant" action={<button className="button secondary" type="button">Ask</button>}>
          <div style={{ display: "grid", gap: 10 }}>
            <button className="button secondary" type="button">Summarize job + ideal candidate</button>
            <button className="button secondary" type="button">Explain top 5 candidates</button>
            <button className="button secondary" type="button">Show risk candidates</button>
            <button className="button secondary" type="button">Draft rejection email</button>
            <textarea
              placeholder="Ask: Why did Sabih get 86% and Maria 73%?"
              style={{ minHeight: 90, borderRadius: 12, border: "1px solid #d9dce7", padding: 10 }}
            />
            <div className="card" style={{ background: "#f6f7fb" }}>
              <strong>AI response</strong>
              <p style={{ margin: 6 }}>This is a placeholder for AI outputs: matched skills, gaps, risk flags, and email drafts.</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export function RecruiterAddCandidates() {
  return (
    <DashboardLayout
      role="recruiter"
      title="Attach Candidates"
      subtitle="Add candidates manually or attach applicants to this job."
      nav={[
        { label: "Dashboard", href: "/recruiter/dashboard" },
        { label: "Jobs", href: "/recruiter/jobs" },
        { label: "Create Job", href: "/recruiter/jobs/new" },
        { label: "Candidates", href: "/recruiter/candidates" },
        { label: "Settings", href: "/recruiter/settings" },
      ]}
    >
      <Card title="Add Candidate">Form placeholder for adding candidates.</Card>
    </DashboardLayout>
  );
}

export function RecruiterCandidateDetail() {
  return (
    <DashboardLayout
      role="recruiter"
      title="Candidate Profile"
      subtitle="Skills, CV preview, posts, applications, match scores."
      nav={[
        { label: "Dashboard", href: "/recruiter/dashboard" },
        { label: "Jobs", href: "/recruiter/jobs" },
        { label: "Create Job", href: "/recruiter/jobs/new" },
        { label: "Candidates", href: "/recruiter/candidates" },
        { label: "Settings", href: "/recruiter/settings" },
      ]}
      actions={[<button key="bookmark" className="button secondary" type="button">Bookmark</button>]}
    >
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}>
        <Card title="Profile Summary">
          <ul style={{ paddingLeft: 16, margin: 0, display: "grid", gap: 6 }}>
            <li>Name: Candidate Name</li>
            <li>Title: Frontend Developer</li>
            <li>Location: Remote</li>
            <li>Skills: React, TS, Node</li>
            <li>Match Score: 87%</li>
          </ul>
        </Card>
        <Card title="Applications">
          <SimpleTable
            columns={["Job", "Status", "Match"]}
            rows={[
              ["Frontend Developer", "New", "87%"],
              ["Data Analyst", "Rejected", "55%"],
            ]}
          />
        </Card>
        <Card title="Activity / Posts">
          <ul style={{ paddingLeft: 16, margin: 0, display: "grid", gap: 6 }}>
            <li>"Building a React dashboard for analytics."</li>
            <li>"Published a small open-source library."</li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export function RecruiterJobApplications() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: job } = useQuery({
    queryKey: ["recruiter-job", id],
    queryFn: () => apiFetch(`/recruiter/jobs/${id}`),
    enabled: Boolean(id),
  });
  const {
    data: applications,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["job-applications", id],
    queryFn: () => apiFetch(`/recruiter/jobs/${id}/applications?include_best=true`),
    enabled: Boolean(id),
  });

  const scoreAll = useMutation({
    mutationFn: () => apiFetch(`/recruiter/jobs/${id}/applications/score`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-applications", id] });
    },
  });

  const scoreOne = useMutation({
    mutationFn: (applicationId: string) =>
      apiFetch(`/recruiter/jobs/${id}/applications/${applicationId}/score`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["job-applications", id] }),
  });

  const apps = (applications as any[]) || [];

  return (
    <DashboardLayout
      role="recruiter"
      title={job?.title ? `${job.title} - Applications` : "Applications"}
      subtitle="Review applicants, score them with AI, and see the best fit."
      nav={[
        { label: "Dashboard", href: "/recruiter/dashboard" },
        { label: "Jobs", href: "/recruiter/jobs" },
        { label: "Create Job", href: "/recruiter/jobs/new" },
        { label: "Candidates", href: "/recruiter/candidates" },
        { label: "Settings", href: "/recruiter/settings" },
      ]}
      actions={[
        <button
          key="score-all"
          className="button"
          type="button"
          onClick={() => scoreAll.mutate()}
          disabled={scoreAll.isPending}
        >
          {scoreAll.isPending ? "Scoring..." : "Score all"}
        </button>,
      ]}
    >
      {error && <p style={{ color: "#c00" }}>Error loading applications: {(error as Error).message}</p>}
      {isLoading ? (
        <p>Loading applications...</p>
      ) : (
        <Card title="Applications">
          <SimpleTable
            columns={[
              "Candidate",
              "Email",
              "Applied",
              "Match",
              "Band",
              "Best fit",
              "CV",
              "Reasons",
              "Actions",
            ]}
            rows={
              apps.length
                ? apps.map((app) => [
                    app.candidate?.headline || "Candidate",
                    app.email || "-",
                    app.applied_at ? new Date(app.applied_at).toLocaleDateString() : "-",
                    app.match_score !== null && app.match_score !== undefined ? `${Math.round(app.match_score)}%` : "Not scored",
                    app.match_level || "-",
                    app.best_fit ? <span className="pill">Best fit</span> : "-",
                    app.cv_file_url ? (
                      <a href={app.cv_file_url} target="_blank" rel="noreferrer">
                        Open CV
                      </a>
                    ) : (
                      "No CV"
                    ),
                    <div key={`${app.id}-reason`} style={{ display: "grid", gap: 4 }}>
                      <small>Matched: {(app.matched_skills || []).join(", ") || "-"}</small>
                      <small>Missing: {(app.missing_skills || []).join(", ") || "-"}</small>
                      <small>{app.rationale || ""}</small>
                    </div>,
                    <div key={`${app.id}-actions`} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        className="button secondary"
                        type="button"
                        onClick={() => scoreOne.mutate(app.id)}
                        disabled={scoreOne.isPending}
                      >
                        Score
                      </button>
                    </div>,
                  ])
                : [["No applications yet", "-", "-", "-", "-", "-", "-", "-"]]
            }
          />
        </Card>
      )}
    </DashboardLayout>
  );
}

export function RecruiterCandidates() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["recruiter-candidates"],
    queryFn: () => apiFetch("/recruiter/candidates"),
  });
  const candidates = (data as any[]) || [];
  return (
    <DashboardLayout
      role="recruiter"
      title="Candidates"
      subtitle="Applicants across your jobs with latest match info."
      nav={[
        { label: "Dashboard", href: "/recruiter/dashboard" },
        { label: "Jobs", href: "/recruiter/jobs" },
        { label: "Create Job", href: "/recruiter/jobs/new" },
        { label: "Candidates", href: "/recruiter/candidates" },
        { label: "Settings", href: "/recruiter/settings" },
      ]}
    >
      <Card title="Applicants">
        {error && <p style={{ color: "#c00" }}>Error loading candidates: {(error as Error).message}</p>}
        {isLoading ? (
          <p>Loading candidates...</p>
        ) : (
          <SimpleTable
            columns={["Candidate", "Email", "Applications", "Actions"]}
            rows={
              candidates.length
                ? candidates.map((c) => [
                    c.candidate?.headline || "Candidate",
                    c.email || "-",
                    (c.applications || []).length.toString(),
                    <div key={c.id} style={{ display: "flex", gap: 8 }}>
                      <a className="button secondary" href={`/recruiter/candidates/${c.id}`}>View</a>
                    </div>,
                  ])
                : [["No candidates yet", "-", "-", "-"]]
            }
          />
        )}
      </Card>
    </DashboardLayout>
  );
}

export function RecruiterSettings() {
  return (
    <DashboardLayout
      role="recruiter"
      title="Settings"
      subtitle="Notification preferences and account controls."
      nav={[
        { label: "Dashboard", href: "/recruiter/dashboard" },
        { label: "Jobs", href: "/recruiter/jobs" },
        { label: "Create Job", href: "/recruiter/jobs/new" },
        { label: "Candidates", href: "/recruiter/candidates" },
        { label: "Settings", href: "/recruiter/settings" },
      ]}
    >
      <Card title="Settings">Add your settings form here.</Card>
    </DashboardLayout>
  );
}
