// web\src\pages\LandingPage.tsx
import { Link } from "react-router-dom";

const steps = [
  { title: "Post or paste a job", copy: "Recruiters drop a JD or upload a file. Candidates paste any JD they want to test." },
  { title: "Upload CVs & profiles", copy: "CVs land in Supabase storage; profiles stay structured for clean matching inputs." },
  { title: "Let AI rank & explain", copy: "Gemini scores fit, highlights gaps, and surfaces quick filters for recruiters." },
];

const features = [
  { title: "AI Matching", copy: "Gemini-powered matching with explanations, cached by job/candidate to save credits." },
  { title: "Job + CV Intake", copy: "Recruiters post roles, attach sourced CVs, or accept candidate self-applies." },
  { title: "Candidate Showcase", copy: "Profiles + LinkedIn-lite posts help surface motivated, active candidates." },
  { title: "Admin Oversight", copy: "Platform-level visibility into users, jobs, matches, posts, and plans." },
];

const audience = [
  { title: "Recruiters & HR", copy: "See which CVs match your job in seconds. Share public job links or keep private." },
  { title: "Candidates", copy: "Check your fit before applying, keep your profile tight, and post your work-in-progress." },
  { title: "Admins", copy: "Internal role. Monitor usage, manage companies, and keep the feed clean." },
];

export default function LandingPage() {
  return (
    <div className="app-shell">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ fontWeight: 700, letterSpacing: -0.5, fontSize: 18 }}>HireMatch</div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link className="button secondary" to="/login">
            Login
          </Link>
          <Link className="button" to="/signup">
            Get Started
          </Link>
        </div>
      </header>

      <section className="section" style={{ display: "grid", gap: 18 }}>
        <div className="pill">AI-first hiring OS</div>
        <h1 style={{ margin: 0, fontSize: 48, lineHeight: 1.05 }}>
          HireMatch pairs recruiters and candidates with instant, explained fit scores.
        </h1>
        <p style={{ maxWidth: 720 }}>
          Post a job, drop CVs, and see a ranked list with Gemini explanations. Candidates can self-check their fit before
          applying and keep their profile + posts fresh to stay discoverable.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="button" to="/signup?role=recruiter">
            Sign Up as Recruiter
          </Link>
          <Link className="button secondary" to="/signup?role=candidate">
            Sign Up as Candidate
          </Link>
          <Link className="button secondary" to="/jobs">
            Browse Jobs
          </Link>
        </div>
        <div className="card" style={{ display: "grid", gap: 12 }}>
          <strong>3 things you can do today</strong>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            {steps.map((step) => (
              <div key={step.title} className="card" style={{ background: "#0b1021", color: "#fff" }}>
                <div style={{ fontWeight: 700 }}>{step.title}</div>
                <p>{step.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Problem & Pain</h2>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
          <div className="card">
            <strong>Recruiters waste hours triaging CVs.</strong>
            <p>Manual screening slows down pipelines. HireMatch runs AI scoring with explanations so you know why someone fits.</p>
          </div>
          <div className="card">
            <strong>Candidates guess if they fit.</strong>
            <p>The match checker lets candidates validate before applying and tune their profile with suggested gaps.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>How it Works</h2>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          {steps.map((step, idx) => (
            <div key={step.title} className="card">
              <div className="pill" style={{ background: "#e0fbff", color: "#0f6a6a" }}>Step {idx + 1}</div>
              <h3 style={{ marginBottom: 8 }}>{step.title}</h3>
              <p>{step.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Features</h2>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
          {features.map((feature) => (
            <div key={feature.title} className="card">
              <h3 style={{ marginBottom: 8 }}>{feature.title}</h3>
              <p>{feature.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Who it's for</h2>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
          {audience.map((item) => (
            <div key={item.title} className="card">
              <strong>{item.title}</strong>
              <p>{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Pricing teaser</h2>
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div><strong>Free</strong> - start now, run matches, post roles.</div>
          <div><strong>Pro</strong> - coming soon: higher match limits, analytics, collaboration.</div>
          <div><strong>Enterprise</strong> - SSO, audit logs, volume pricing.</div>
        </div>
      </section>

      <section className="section">
        <h2>Ready?</h2>
        <div className="card" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: "1 1 260px" }}>
            <strong>Start matching in minutes.</strong>
            <p>Choose your lane and you'll land in the right workspace. Switch roles in signup if needed.</p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link className="button" to="/signup?role=recruiter">
              I'm a Recruiter / HR
            </Link>
            <Link className="button secondary" to="/signup?role=candidate">
              I'm a Candidate
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
