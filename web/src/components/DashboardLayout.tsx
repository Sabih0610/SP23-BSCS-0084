//web\src\components\DashboardLayout.tsx 
import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

type NavItem = { label: string; href: string };
type Kpi = { label: string; value: string; helper?: string };

export function DashboardLayout({
  role,
  title,
  subtitle,
  nav,
  kpis = [],
  actions = [],
  children,
}: {
  role: "admin" | "recruiter" | "candidate";
  title: string;
  subtitle?: string;
  nav: NavItem[];
  kpis?: Kpi[];
  actions?: ReactNode[];
  children: ReactNode;
}) {
  const location = useLocation();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "100vh", background: "#f6f7fb" }}>
      <aside style={{ borderRight: "1px solid #e5e7ef", padding: "20px 16px", background: "#0b1021", color: "#fff" }}>
        <div style={{ fontWeight: 700, letterSpacing: -0.4, marginBottom: 20 }}>HireMatch</div>
        <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 16, textTransform: "uppercase" }}>{role}</div>
        <nav style={{ display: "grid", gap: 8 }}>
          {nav.map((item) => {
            const active = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: active ? "#1a2142" : "transparent",
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main style={{ padding: "20px 24px 48px" }}>
        <TopBar />
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0 18px" }}>
          <div>
            <h1 style={{ margin: 0 }}>{title}</h1>
            {subtitle && <p style={{ margin: "6px 0 0", color: "#4a4f66" }}>{subtitle}</p>}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{actions}</div>
        </header>

        {kpis.length > 0 && (
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", marginBottom: 16 }}>
            {kpis.map((kpi) => (
              <div key={kpi.label} className="card" style={{ padding: 14 }}>
                <div style={{ fontSize: 13, color: "#6b708a", marginBottom: 6 }}>{kpi.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700 }}>{kpi.value}</div>
                {kpi.helper && <div style={{ fontSize: 12, color: "#6b708a" }}>{kpi.helper}</div>}
              </div>
            ))}
          </div>
        )}

        {children}
      </main>
    </div>
  );
}

function TopBar() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        justifyContent: "flex-end",
        marginBottom: 8,
      }}
    >
      <input
        placeholder="Search"
        style={{
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid #d9dce7",
          minWidth: 200,
        }}
      />
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "#e7e9f3",
          display: "grid",
          placeItems: "center",
          fontWeight: 700,
          color: "#0b1021",
        }}
      >
        HM
      </div>
    </div>
  );
}

export function Card({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="card" style={{ padding: 16, display: "grid", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>{title}</strong>
        {action}
      </div>
      {children}
    </div>
  );
}

export function SimpleTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: (string | ReactNode)[][];
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} style={{ textAlign: "left", padding: "8px 6px", color: "#6b708a", fontWeight: 600 }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} style={{ borderTop: "1px solid #eceef5" }}>
              {row.map((cell, cidx) => (
                <td key={cidx} style={{ padding: "10px 6px" }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ChartPlaceholder({ title }: { title: string }) {
  return (
    <Card title={title}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", alignItems: "end", gap: 8, height: 160 }}>
        {[50, 80, 30, 70, 90, 40, 65].map((h, idx) => (
          <div key={idx} style={{ background: "#1f3ff5", height: `${h}%`, borderRadius: 6, opacity: 0.9 }} />
        ))}
      </div>
      <small style={{ color: "#6b708a" }}>Sample data; connect to real analytics later.</small>
    </Card>
  );
}
