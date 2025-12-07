// web\src\pages\Placeholder.tsx
type Action = { label: string; href: string };

export default function Placeholder({
  title,
  subtitle,
  actions = [],
}: {
  title: string;
  subtitle?: string;
  actions?: Action[];
}) {
  return (
    <div className="app-shell">
      <div className="card">
        <h1>{title}</h1>
        {subtitle && <p style={{ maxWidth: 640 }}>{subtitle}</p>}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {actions.map((action) => (
            <a key={action.href} className="button secondary" href={action.href}>
              {action.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
