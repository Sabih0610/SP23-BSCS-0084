// web\src\pages\Misc.tsx
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { Card, SimpleTable } from "../components/DashboardLayout";

type Notification = {
  id: string;
  type: string;
  data: any;
  created_at?: string;
  read?: boolean;
};

export function MessagingPage() {
  return (
    <div className="app-shell">
      <Card title="Messaging">
        <p>This area will host recruiter/candidate/admin messages and notifications.</p>
      </Card>
    </div>
  );
}

export function NotificationsPage() {
  const { data, isLoading, error } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => apiFetch("/notifications"),
  });

  const notifications = data || [];

  return (
    <div className="app-shell">
      <Card title="Notifications">
        {isLoading ? (
          <p>Loading...</p>
        ) : error ? (
          <p style={{ color: "#c00" }}>{(error as Error).message}</p>
        ) : notifications.length === 0 ? (
          <p>No notifications yet.</p>
        ) : (
          <SimpleTable
            columns={["When", "Message", "Status"]}
            rows={notifications.map((n) => [
              n.created_at ? new Date(n.created_at).toLocaleString() : "-",
              n.type === "new_application"
                ? `New application for ${n.data?.job_title || "job"}`
                : n.type,
              n.read ? "Read" : "New",
            ])}
          />
        )}
      </Card>
    </div>
  );
}
