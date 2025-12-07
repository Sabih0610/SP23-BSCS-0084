// web\src\App.tsx
import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import { LoginPage, SignupPage } from "./pages/Auth";
import { JobsPage, JobDetailPage } from "./pages/Jobs";
import {
  AdminCompanies,
  AdminDashboard,
  AdminJobs,
  AdminPosts,
  AdminUsers,
} from "./pages/admin/AdminPages";
import {
  RecruiterAddCandidates,
  RecruiterCandidateDetail,
  RecruiterDashboard,
  RecruiterJobDetail,
  RecruiterJobNew,
  RecruiterJobApplications,
  RecruiterJobs,
  RecruiterCandidates,
  RecruiterProfile,
  RecruiterSettings,
} from "./pages/recruiter/RecruiterPages";
import {
  CandidateApplications,
  CandidateDashboard,
  CandidateFeed,
  CandidateMatchCheck,
  CandidateMatches,
  CandidatePostNew,
  CandidatePosts,
  CandidateProfile,
} from "./pages/candidate/CandidatePages";
import { MessagingPage, NotificationsPage } from "./pages/Misc";
import Placeholder from "./pages/Placeholder";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/jobs" element={<JobsPage />} />
      <Route path="/jobs/:slug" element={<JobDetailPage />} />
      <Route path="/messaging" element={<MessagingPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />

      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/admin/companies" element={<AdminCompanies />} />
      <Route path="/admin/jobs" element={<AdminJobs />} />
      <Route path="/admin/posts" element={<AdminPosts />} />

      <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
      <Route path="/recruiter/profile" element={<RecruiterProfile />} />
      <Route path="/recruiter/jobs" element={<RecruiterJobs />} />
      <Route path="/recruiter/jobs/new" element={<RecruiterJobNew />} />
      <Route path="/recruiter/jobs/:id" element={<RecruiterJobDetail />} />
      <Route path="/recruiter/jobs/:id/applications" element={<RecruiterJobApplications />} />
      <Route path="/recruiter/jobs/:id/candidates/add" element={<RecruiterAddCandidates />} />
      <Route path="/recruiter/candidates" element={<RecruiterCandidates />} />
      <Route path="/recruiter/candidates/:id" element={<RecruiterCandidateDetail />} />
      <Route path="/recruiter/settings" element={<RecruiterSettings />} />

      <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
      <Route path="/candidate/profile" element={<CandidateProfile />} />
      <Route path="/candidate/match-check" element={<CandidateMatchCheck />} />
      <Route path="/candidate/applications" element={<CandidateApplications />} />
      <Route path="/candidate/matches" element={<CandidateMatches />} />
      <Route path="/candidate/posts" element={<CandidatePosts />} />
      <Route path="/candidate/posts/new" element={<CandidatePostNew />} />
      <Route path="/candidate/feed" element={<CandidateFeed />} />

      <Route path="*" element={<Placeholder title="Not found" subtitle="This route isn't wired yet." />} />
    </Routes>
  );
}
