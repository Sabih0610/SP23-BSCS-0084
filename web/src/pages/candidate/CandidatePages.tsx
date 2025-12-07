import type React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, DashboardLayout, SimpleTable } from "../../components/DashboardLayout";
import { apiFetch } from "../../lib/api";

type DashboardStat = { label: string; value: string; trend?: string };
type CandidateProfile = {
  headline?: string;
  location?: string;
  remote_pref?: string;
  summary?: string;
  skills?: string[];
  links?: string[];
};
type Application = {
  id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  applied_at?: string;
  match_score?: number | null;
};
type Post = { id: string; body: string; visibility: string; created_at?: string; candidate_id?: string };
type CvItem = { id: string; file_url: string; created_at?: string };

const candidateNav = [
  { label: "Dashboard", href: "/candidate/dashboard" },
  { label: "Profile", href: "/candidate/profile" },
  { label: "Jobs", href: "/jobs" },
  { label: "Match Checker", href: "/candidate/match-check" },
  { label: "Applications", href: "/candidate/applications" },
  { label: "Posts", href: "/candidate/posts" },
  { label: "Feed", href: "/candidate/feed" },
];

const inputStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #d5d8e5",
  fontSize: 16,
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
};

export function CandidateDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStat[]>({
    queryKey: ["candidate-dashboard"],
    queryFn: () => apiFetch("/candidate/dashboard"),
  });
  const { data: profile, isLoading: profileLoading } = useQuery<CandidateProfile>({
    queryKey: ["candidate-profile"],
    queryFn: () => apiFetch("/candidate/profile"),
  });
  const { data: feed, isLoading: feedLoading } = useQuery<Post[]>({
    queryKey: ["candidate-feed"],
    queryFn: () => apiFetch("/candidate/feed"),
  });
  const { data: applications, isLoading: appsLoading } = useQuery<Application[]>({
    queryKey: ["candidate-applications"],
    queryFn: () => apiFetch("/candidate/applications"),
  });

  return (
    <DashboardLayout
      role="candidate"
      title="Dashboard"
      subtitle="Live view of your profile, applications, and public feed."
      nav={candidateNav}
      actions={[
        <Link key="new-post" className="button" to="/candidate/posts/new">
          Create post
        </Link>,
      ]}
      kpis={(stats || []).map((s) => ({ label: s.label, value: s.value, helper: s.trend }))}
    >
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}>
        <Card title="Profile">
          {profileLoading ? (
            <p>Loading profile...</p>
          ) : profile ? (
            <div style={{ display: "grid", gap: 6 }}>
              <strong>{profile.headline || "Add a headline"}</strong>
              <div>{profile.location || "Add your location"}</div>
              <div>{profile.summary || "Add a summary to improve matching."}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(profile.skills || []).map((skill) => (
                  <span key={skill} className="pill">
                    {skill}
                  </span>
                ))}
              </div>
              <Link className="button secondary" to="/candidate/profile">
                Update profile
              </Link>
            </div>
          ) : (
            <p>No profile yet.</p>
          )}
        </Card>

        <Card title="Applications">
          {appsLoading ? (
            <p>Loading applications...</p>
          ) : (
            <SimpleTable
              columns={["Job", "Applied", "Status", "Match"]}
              rows={
                (applications || []).length
                  ? (applications || []).map((app) => [
                      app.job_id || "Job",
                      formatDate(app.applied_at),
                      app.status || "applied",
                      app.match_score !== undefined && app.match_score !== null
                        ? `${Math.round(app.match_score)}%`
                        : "Not scored",
                    ])
                  : [["No applications yet", "-", "-", "-"]]
              }
            />
          )}
        </Card>

        <Card title="Feed (public)">
          {feedLoading ? (
            <p>Loading feed...</p>
          ) : (feed || []).length ? (
            <div style={{ display: "grid", gap: 10 }}>
              {(feed || []).map((post) => (
                <div key={post.id} className="card" style={{ background: "#f6f7fb" }}>
                  <div style={{ fontSize: 13, color: "#6b708a" }}>{formatDate(post.created_at)}</div>
                  <div>{post.body}</div>
                  <span className="pill" style={{ width: "fit-content" }}>
                    {post.visibility}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p>No public posts yet.</p>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

export function CandidateProfile() {
  const { data: profile, isLoading, refetch } = useQuery<CandidateProfile>({
    queryKey: ["candidate-profile"],
    queryFn: () => apiFetch("/candidate/profile"),
  });
  const { data: cvs, refetch: refetchCvs } = useQuery<CvItem[]>({
    queryKey: ["candidate-cvs"],
    queryFn: () => apiFetch("/candidate/cvs"),
  });
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [remotePref, setRemotePref] = useState("");
  const [summary, setSummary] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [linksText, setLinksText] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [cvStatus, setCvStatus] = useState<string | null>(null);
  const [selectedCv, setSelectedCv] = useState<string>("");

  useEffect(() => {
    if (profile) {
      setHeadline(profile.headline || "");
      setLocation(profile.location || "");
      setRemotePref(profile.remote_pref || "");
      setSummary(profile.summary || "");
      setSkillsText((profile.skills || []).join(", "));
      setLinksText((profile.links || []).join(", "));
    }
  }, [profile]);

  const saveProfile = useMutation({
    mutationFn: () =>
      apiFetch("/candidate/profile", {
        method: "PUT",
        body: JSON.stringify({
          headline,
          location,
          remote_pref: remotePref,
          summary,
          skills: skillsText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          links: linksText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      }),
    onSuccess: () => {
      setStatusMsg("Profile updated.");
      refetch();
    },
    onError: (err: Error) => setStatusMsg(err.message),
  });

  const uploadCv = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return apiFetch("/candidate/cv", { method: "POST", body: form });
    },
    onSuccess: () => {
      setCvStatus("CV uploaded.");
      refetchCvs();
    },
    onError: (err: Error) => setCvStatus(err.message),
  });

  const autofill = useMutation({
    mutationFn: () =>
      apiFetch("/candidate/profile/autofill", {
        method: "POST",
        body: JSON.stringify({ cv_id: selectedCv || null }),
      }),
    onSuccess: (data: any) => {
      setHeadline(data.headline || headline);
      setSummary(data.summary || summary);
      setSkillsText((data.skills || []).join(", "));
      setLinksText((data.links || []).join(", "));
      setStatusMsg("Autofilled from CV. Review and save.");
    },
    onError: (err: Error) => setStatusMsg(err.message),
  });

  return (
    <DashboardLayout
      role="candidate"
      title="Profile"
      subtitle="Headline, location, summary, skills, links, CV, and autofill."
      nav={candidateNav}
      actions={[
        <button key="refresh" className="button secondary" type="button" onClick={() => refetch()}>
          Refresh
        </button>,
      ]}
    >
      <div
        style={{
          background: "linear-gradient(120deg,#1f3ff5,#0fb9b1)",
          color: "#fff",
          borderRadius: 14,
          padding: "26px 20px 34px",
          marginBottom: 16,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.12), transparent 40%)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#fff", color: "#0b1021", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 24 }}>
            {headline ? headline.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{headline || "Add your headline"}</div>
            <div style={{ opacity: 0.9 }}>{location || "Add your location"}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
              <span className="pill" style={{ background: "#fff", color: "#0b1021" }}>Open to work</span>
              <span className="pill" style={{ background: "#fff", color: "#0b1021" }}>Enhance profile</span>
            </div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <button className="button secondary" type="button" onClick={() => refetch()}>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", gap: 16, alignItems: "start" }}>
        <div className="card" style={{ padding: 16, display: "grid", gap: 14 }}>
          <h3 style={{ margin: 0 }}>Edit Profile</h3>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <>
              <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Headline" style={inputStyle} />
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" style={inputStyle} />
              <input value={remotePref} onChange={(e) => setRemotePref(e.target.value)} placeholder="Remote preference" style={inputStyle} />
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Summary / About"
                style={{ ...inputStyle, minHeight: 120 }}
              />
              <input
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="Skills (comma separated)"
                style={inputStyle}
              />
              <input
                value={linksText}
                onChange={(e) => setLinksText(e.target.value)}
                placeholder="Links (comma separated URLs)"
                style={inputStyle}
              />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="button" type="button" onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>
                  {saveProfile.isPending ? "Saving..." : "Save profile"}
                </button>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => autofill.mutate()}
                  disabled={autofill.isPending}
                >
                  {autofill.isPending ? "Autofilling..." : "Autofill from CV"}
                </button>
                {statusMsg && <span style={{ color: statusMsg.includes("Autofilled") || statusMsg.includes("updated") ? "#0a7" : "#c00" }}>{statusMsg}</span>}
              </div>
            </>
          )}
        </div>

        <div className="grid" style={{ gap: 12 }}>
          <div className="card" style={{ padding: 14, display: "grid", gap: 10 }}>
            <h3 style={{ marginTop: 0 }}>CV & Media</h3>
            <p style={{ color: "#555", fontSize: 14 }}>Upload your CV to feed the matcher. PDF/DOCX/TXT supported.</p>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadCv.mutate(file);
              }}
              style={{ margin: "4px 0 8px" }}
            />
            {cvStatus && <div style={{ color: cvStatus === "CV uploaded." ? "#0a7" : "#c00" }}>{cvStatus}</div>}
            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontSize: 13, color: "#555" }}>Use CV for autofill</label>
              <select value={selectedCv} onChange={(e) => setSelectedCv(e.target.value)} style={inputStyle}>
                <option value="">Latest CV</option>
                {(cvs || []).map((cv) => (
                  <option key={cv.id} value={cv.id}>
                    {cv.file_url}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ marginTop: 0 }}>Highlights</h3>
            <ul style={{ paddingLeft: 16, margin: 0, display: "grid", gap: 6 }}>
              <li>Add at least 5 skills to improve matching.</li>
              <li>Include portfolio / GitHub / LinkedIn links.</li>
              <li>Keep your summary concise and role-specific.</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export function CandidateMatchCheck() {
  const [jd, setJd] = useState("");
  const [cvId, setCvId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () =>
      apiFetch("/candidate/match-check", {
        method: "POST",
        body: JSON.stringify({ jd_text: jd, cv_id: cvId || null }),
      }),
    onSuccess: (data) => setResult(data),
    onError: (err: Error) => setStatusMsg(err.message),
  });

  return (
    <DashboardLayout
      role="candidate"
      title="Match Checker"
      subtitle="Paste a JD, pick a CV, and get an AI score."
      nav={candidateNav}
      actions={[<a key="history" className="button secondary" href="/candidate/matches">View history</a>]}
    >
      <Card title="Run a Check">
        <div className="grid" style={{ gap: 10 }}>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste a Job Description here"
            style={{ minHeight: 140, borderRadius: 12, border: "1px solid #d9dce7", padding: 10 }}
          />
          <input
            value={cvId}
            onChange={(e) => setCvId(e.target.value)}
            placeholder="Optional CV ID (from your uploads)"
            style={inputStyle}
          />
          <button className="button" type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Scoring..." : "Check my fit"}
          </button>
          {statusMsg && <div style={{ color: "#c00" }}>{statusMsg}</div>}
          {result && (
            <div className="card" style={{ background: "#f6f7fb" }}>
              <strong>Result</strong>
              <ul style={{ paddingLeft: 18, margin: 8, display: "grid", gap: 4 }}>
                <li>Score: {Math.round(result.score || 0)}%</li>
                <li>Matched: {(result.matched_skills || []).join(", ") || "-"}</li>
                <li>Missing: {(result.missing_skills || []).join(", ") || "-"}</li>
                <li>Suggestion: {result.suggestions || result.rationale || "-"}</li>
              </ul>
            </div>
          )}
        </div>
      </Card>
    </DashboardLayout>
  );
}

export function CandidateApplications() {
  const { data: apps, isLoading, error, refetch } = useQuery<Application[]>({
    queryKey: ["candidate-applications"],
    queryFn: () => apiFetch("/candidate/applications"),
  });
  return (
    <DashboardLayout
      role="candidate"
      title="Applications"
      subtitle="Applied / viewed / shortlisted / rejected with match scores."
      nav={candidateNav}
      actions={[
        <button key="refresh" className="button secondary" type="button" onClick={() => refetch()}>
          Refresh
        </button>,
      ]}
    >
      <Card title="Applications">
        {error && <p style={{ color: "#c00" }}>Error loading: {(error as Error).message}</p>}
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <SimpleTable
            columns={["Job", "Applied", "Status", "Match"]} 
            rows={
              (apps || []).length
                ? (apps || []).map((a) => [
                    a.job_id || "Job",
                    formatDate(a.applied_at),
                    a.status || "applied",
                    a.match_score !== undefined && a.match_score !== null ? `${Math.round(a.match_score)}%` : "Not scored",
                  ])
                : [["No applications yet", "-", "-", "-"]]
            }
          />
        )}
      </Card>
    </DashboardLayout>
  );
}

export function CandidateMatches() {
  const { data: checks, isLoading, error } = useQuery<any[]>({
    queryKey: ["candidate-match-checks"],
    queryFn: () => apiFetch("/candidate/matches"),
  });
  return (
    <DashboardLayout
      role="candidate"
      title="Match History"
      subtitle="Log of all match checks you've run."
      nav={candidateNav}
    >
      <Card title="History">
        {error && <p style={{ color: "#c00" }}>Error loading: {(error as Error).message}</p>}
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <SimpleTable
            columns={["JD", "Score", "Date"]}
            rows={
              (checks || []).length
                ? (checks || []).map((c) => [
                    (c.jd_text || "").slice(0, 60) || "JD",
                    c.match_score !== undefined && c.match_score !== null ? `${Math.round(c.match_score)}%` : "-",
                    formatDate(c.created_at),
                  ])
                : [["No checks yet", "-", "-"]]
            }
          />
        )}
      </Card>
    </DashboardLayout>
  );
}

export function CandidatePosts() {
  const { data: posts, isLoading, error, refetch } = useQuery<Post[]>({
    queryKey: ["candidate-posts"],
    queryFn: () => apiFetch("/candidate/posts"),
  });
  return (
    <DashboardLayout
      role="candidate"
      title="Your Posts"
      subtitle="Share updates that are visible to other users (public visibility)."
      nav={candidateNav}
      actions={[
        <Link key="create" className="button" to="/candidate/posts/new">
          Create post
        </Link>,
        <button key="refresh" className="button secondary" type="button" onClick={() => refetch()}>
          Refresh
        </button>,
      ]}
    >
      <Card title="Posts">
        {error && <p style={{ color: "#c00" }}>Error loading: {(error as Error).message}</p>}
        {isLoading ? (
          <p>Loading...</p>
        ) : (posts || []).length ? (
          <div className="grid" style={{ gap: 10 }}>
            {(posts || []).map((post) => (
              <div key={post.id} className="card" style={{ background: "#f6f7fb" }}>
                <div style={{ fontSize: 13, color: "#6b708a" }}>{formatDate(post.created_at)}</div>
                <div>{post.body}</div>
                <span className="pill" style={{ width: "fit-content" }}>
                  {post.visibility}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p>No posts yet.</p>
        )}
      </Card>
    </DashboardLayout>
  );
}

export function CandidatePostNew() {
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => apiFetch("/candidate/posts", { method: "POST", body: JSON.stringify({ body, visibility }) }),
    onSuccess: () => {
      setStatusMsg("Posted.");
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["candidate-posts"] });
      queryClient.invalidateQueries({ queryKey: ["candidate-feed"] });
    },
    onError: (err: Error) => setStatusMsg(err.message),
  });

  return (
    <DashboardLayout
      role="candidate"
      title="Create Post"
      subtitle="Text post visible to everyone when set to public."
      nav={candidateNav}
    >
      <Card title="Post Composer">
        <div className="grid" style={{ gap: 10 }}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share an update, link, or announcement"
            style={{ minHeight: 120, borderRadius: 12, border: "1px solid #d9dce7", padding: 10 }}
          />
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)} style={inputStyle}>
            <option value="public">Public (visible to all users)</option>
            <option value="hidden">Hidden</option>
          </select>
          <button className="button" type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Posting..." : "Publish"}
          </button>
          {statusMsg && <div style={{ color: statusMsg === "Posted." ? "#0a7" : "#c00" }}>{statusMsg}</div>}
        </div>
      </Card>
    </DashboardLayout>
  );
}

export function CandidateFeed() {
  const { data: feed, isLoading, error, refetch } = useQuery<Post[]>({
    queryKey: ["candidate-feed"],
    queryFn: () => apiFetch("/candidate/feed"),
  });
  return (
    <DashboardLayout
      role="candidate"
      title="Feed"
      subtitle="Public posts from you and other users."
      nav={candidateNav}
      actions={[
        <button key="refresh" className="button secondary" type="button" onClick={() => refetch()}>
          Refresh
        </button>,
      ]}
    >
      <Card title="Feed">
        {error && <p style={{ color: "#c00" }}>Error loading: {(error as Error).message}</p>}
        {isLoading ? (
          <p>Loading...</p>
        ) : (feed || []).length ? (
          <div className="grid" style={{ gap: 10 }}>
            {(feed || []).map((post) => (
              <div key={post.id} className="card" style={{ background: "#f6f7fb" }}>
                <div style={{ fontSize: 13, color: "#6b708a" }}>{formatDate(post.created_at)}</div>
                <div>{post.body}</div>
                <span className="pill" style={{ width: "fit-content" }}>
                  {post.visibility}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p>No public posts yet.</p>
        )}
      </Card>
    </DashboardLayout>
  );
}
