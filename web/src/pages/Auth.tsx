// web\src\pages\Auth.tsx
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const onLogin = async () => {
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
    } else {
      const { data } = await supabase.auth.getUser();
      const role = data.user?.user_metadata?.role;
      if (role === "recruiter") navigate("/recruiter/dashboard");
      else if (role === "admin") navigate("/admin/dashboard");
      else navigate("/candidate/dashboard");
    }
  };

  return (
    <div className="app-shell">
      <div className="card">
        <h1>Login</h1>
        <p>Supabase email/password auth using your anon key.</p>
        <form className="grid" style={{ maxWidth: 360 }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" style={inputStyle} />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" style={inputStyle} />
          <button className="button" type="button" onClick={onLogin}>
            Login
          </button>
        </form>
        {message && <p style={{ marginTop: 12 }}>{message}</p>}
      </div>
    </div>
  );
}

export function SignupPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const roleParam = params.get("role");
  const role: "recruiter" | "candidate" = roleParam === "recruiter" ? "recruiter" : "candidate";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const onSignup = async () => {
    setMessage(null);
    // Store the chosen role in user_metadata; your backend/RLS can read it from JWT.
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },
    });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email to confirm your account.");
      // Navigate to the relevant dashboard after signup; in real app wait for email verification.
      if (role === "recruiter") navigate("/recruiter/dashboard");
      else navigate("/candidate/dashboard");
    }
  };

  return (
    <div className="app-shell">
      <div className="card">
        <h1>Create your account</h1>
        <p>
          You are signing up as <strong>{role === "recruiter" ? "Recruiter / HR" : "Candidate"}</strong>.
        </p>
        <p style={{ fontSize: 13, color: "#666" }}>
          This role is stored with your account and controls your dashboard & permissions.
        </p>
        <form className="grid" style={{ maxWidth: 360 }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Work email" style={inputStyle} />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" style={inputStyle} />
          <button className="button" type="button" onClick={onSignup}>
            Continue
          </button>
        </form>
        {message && <p style={{ marginTop: 12 }}>{message}</p>}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #d5d8e5",
  fontSize: 16,
};
