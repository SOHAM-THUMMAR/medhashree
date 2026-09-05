import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";

// Layouts (loaded eagerly — small, needed on every navigation)
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// ──────────────────────────────────────────
// Lazy-loaded pages (code splitting)
// ──────────────────────────────────────────
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const SelfStudy = lazy(() => import("./pages/SelfStudy"));
const Explore = lazy(() => import("./pages/Explore"));
const Tournaments = lazy(() => import("./pages/Tournaments"));
const QuizPlayView = lazy(() => import("./pages/QuizPlayView"));
const Profile = lazy(() => import("./pages/Profile"));
const ReportBug = lazy(() => import("./pages/ReportBug"));
const News = lazy(() => import("./pages/News"));
const CreateQuiz = lazy(() => import("./pages/CreateQuiz"));
const MyQuizzes = lazy(() => import("./pages/MyQuizzes"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Landing = lazy(() => import("./pages/Landing"));
const SolvedPapers = lazy(() => import("./pages/SolvedPapers"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ManageUsers = lazy(() => import("./pages/admin/ManageUsers"));
const ManageContent = lazy(() => import("./pages/admin/ManageContent"));
const ManageSelfStudy = lazy(() => import("./pages/admin/ManageSelfStudy"));
const BugReports = lazy(() => import("./pages/admin/BugReports"));
const ManageTournaments = lazy(() => import("./pages/admin/ManageTournaments"));
const CreateTournament = lazy(() => import("./pages/admin/CreateTournament"));
const ManageSettings = lazy(() => import("./pages/admin/ManageSettings"));
const UploadSolvedPaper = lazy(() => import("./pages/admin/UploadSolvedPaper"));
const ActivityLogs = lazy(() => import("./pages/admin/ActivityLogs"));


// Loading fallback (minimal, matches dark theme)
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" role="status" aria-label="Loading page">
        <span className="sr-only">Loading…</span>
      </div>
    </div>
  );
}

// Conditionally render Landing Page (guest) or redirect to Dashboard (authenticated)
function RootRoute() {
  const token = localStorage.getItem("token");
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Landing />;
}

function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Root / Landing Route */}
            <Route path="/" element={<RootRoute />} />

            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
            
            {/* Forgot Password Route - Without AuthLayout since it has its own UI structure */}
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Public Solved Papers Route */}
            <Route path="/public/solved-papers" element={<SolvedPapers isPublic={true} />} />

            {/* Protected App Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/self-study" element={<SelfStudy />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/solved-papers" element={<SolvedPapers isPublic={false} />} />
                {/* <Route path="/leaderboard" element={<Leaderboard />} /> */}
                {/* <Route path="/battle" element={<QuizBattle />} /> */}
                <Route path="/tournaments" element={<Tournaments />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/report-bug" element={<ReportBug />} />
                <Route path="/news" element={<News />} />

                {/* Admin Routes (strictly secured for admin role) */}
                <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                  <Route path="/create" element={<CreateQuiz />} />
                  <Route path="/my-quizzes" element={<MyQuizzes />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<ManageUsers />} />
                  <Route path="/admin/content" element={<ManageContent />} />
                  <Route path="/admin/self-study" element={<ManageSelfStudy />} />
                  <Route path="/admin/reports" element={<BugReports />} />
                  <Route path="/admin/tournaments" element={<ManageTournaments />} />
                  <Route path="/admin/create-tournament" element={<CreateTournament />} />
                  <Route path="/admin/settings" element={<ManageSettings />} />
                  <Route path="/admin/upload-solved" element={<UploadSolvedPaper />} />
                  <Route path="/admin/activity-logs" element={<ActivityLogs />} />
                </Route>
              </Route>

              {/* Play Quiz Route (also protected) */}
              <Route path="/play/:sessionId" element={<QuizPlayView />} />
            </Route>

            {/* 404 — Branded Not Found page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </ErrorBoundary>
  );
}

export default App;