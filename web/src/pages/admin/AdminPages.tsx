//web\src\pages\admin\AdminPages.tsx
import { Card, ChartPlaceholder, DashboardLayout, SimpleTable } from "../../components/DashboardLayout";

const adminNav = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Users", href: "/admin/users" },
  { label: "Companies", href: "/admin/companies" },
  { label: "Jobs", href: "/admin/jobs" },
  { label: "Posts", href: "/admin/posts" },
];

export function AdminDashboard() {
  return (
    <DashboardLayout
      role="admin"
      title="Admin Dashboard"
      subtitle="Monitor usage, active users, jobs, matches, and moderation."
      nav={adminNav}
      kpis={[
        { label: "Companies", value: "27" },
        { label: "Recruiters", value: "63" },
        { label: "Candidates", value: "420" },
        { label: "Active Jobs", value: "88" },
        { label: "Matches This Month", value: "1.8k" },
        { label: "New Signups (7d)", value: "142" },
      ]}
    >
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
        <ChartPlaceholder title="Signups Over Time" />
        <ChartPlaceholder title="Matches Run Over Time" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(420px,1fr))", marginTop: 16 }}>
        <Card title="Recent Users">
          <SimpleTable
            columns={["Name", "Email", "Role", "Company", "Joined", "Status", "Actions"]}
            rows={[
              ["Ali Khan", "ali@xyz.com", "Recruiter", "XYZ Tech", "03 Dec", "Active", <a href="/admin/users/1">View</a>],
              ["Maria Smith", "maria@abc.com", "Candidate", "-", "03 Dec", "Active", <a href="/admin/users/2">View</a>],
            ]}
          />
        </Card>

        <Card title="Active Companies">
          <SimpleTable
            columns={["Company", "Recruiters", "Active Jobs", "Matches (Mo)", "Plan", "Actions"]}
            rows={[
              ["XYZ Tech", "3", "5", "120", "Free", <a href="/admin/companies/xyz">View</a>],
              ["Alpha Labs", "2", "2", "40", "Pro", <a href="/admin/companies/alpha">View</a>],
            ]}
          />
        </Card>

        <Card title="Flagged Posts">
          <SimpleTable
            columns={["Post ID", "Author", "Type", "Reason", "Created", "Actions"]}
            rows={[
              ["123", "John Doe", "Candidate", "Reported spam", "02 Dec", <a href="/admin/posts/123">Review</a>],
            ]}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}

export function AdminUsers() {
  return (
    <DashboardLayout
      role="admin"
      title="Users"
      subtitle="List and filter users by role/status. Approve or deactivate accounts."
      nav={adminNav}
    >
      <Card title="Users">
        <SimpleTable
          columns={["Name", "Email", "Role", "Status", "Actions"]}
          rows={[
            ["Ali Khan", "ali@xyz.com", "Recruiter", "Active", <a href="/admin/users/1">View</a>],
            ["Maria Smith", "maria@abc.com", "Candidate", "Active", <a href="/admin/users/2">View</a>],
          ]}
        />
      </Card>
    </DashboardLayout>
  );
}

export function AdminCompanies() {
  return (
    <DashboardLayout role="admin" title="Companies" subtitle="Company profiles, members, plan management." nav={adminNav}>
      <Card title="Companies">
        <SimpleTable
          columns={["Company", "Recruiters", "Jobs", "Plan", "Actions"]}
          rows={[
            ["XYZ Tech", "3", "5", "Free", <a href="/admin/companies/xyz">View</a>],
            ["Alpha Labs", "2", "2", "Pro", <a href="/admin/companies/alpha">View</a>],
          ]}
        />
      </Card>
    </DashboardLayout>
  );
}

export function AdminJobs() {
  return (
    <DashboardLayout role="admin" title="Jobs" subtitle="Search jobs, view match stats, and open detail pages." nav={adminNav}>
      <Card title="Jobs">
        <SimpleTable
          columns={["Job", "Company", "Status", "Matches (Mo)", "Actions"]}
          rows={[
            ["Frontend Developer", "XYZ Tech", "Open", "120", <a href="/admin/jobs/1">View</a>],
            ["Data Analyst", "Alpha Labs", "Open", "40", <a href="/admin/jobs/2">View</a>],
          ]}
        />
      </Card>
    </DashboardLayout>
  );
}

export function AdminPosts() {
  return (
    <DashboardLayout role="admin" title="Posts / Content" subtitle="Flag, hide, or remove posts that break guidelines." nav={adminNav}>
      <Card title="Posts">
        <SimpleTable
          columns={["Post ID", "Author", "Role", "Reason", "Status", "Actions"]}
          rows={[
            ["123", "John Doe", "Candidate", "Reported spam", "Pending", <a href="/admin/posts/123">Review</a>],
          ]}
        />
      </Card>
    </DashboardLayout>
  );
}
