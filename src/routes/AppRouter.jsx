import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/useAuthContext';
import { ROUTES } from '../utils/constants';

// Landing Page
import LandingPage from '../pages/landing/LandingPage';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import NicknamePage from '../pages/auth/NicknamePage';
import VerifyEmailPage from '../pages/auth/VerifyEmailPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';

// Main Pages
import DashboardPage from '../pages/main/DashboardPage';
import ScriptsPage from '../pages/main/ScriptsPage';
import ProgressPage from '../pages/main/ProgressPage';
import HistoryPage from '../pages/main/HistoryPage';
import AllSessionsPage from '../pages/main/AllSessionsPage';
import ProfilePage from '../pages/main/ProfilePage';
import EditProfilePage from '../pages/main/EditProfilePage';
import SettingsPage from '../pages/main/SettingsPage';
import ChangePasswordPage from '../pages/main/ChangePasswordPage';
import AccountSettingsPage from '../pages/main/AccountSettingsPage';
import TrainingSetupPage from '../pages/main/TrainingSetupPage';
import TrainingPage from '../pages/main/TrainingPage';
import FrameworksPage from '../pages/main/FrameworksPage';
import ScriptEditorPage from '../pages/main/ScriptEditorPage';
import GenerateScriptPage from '../pages/main/GenerateScriptPage';
import TestAudioVideoPage from '../pages/main/TestAudioVideoPage';

// Session Pages
import SessionDetailPage from '../pages/session/SessionDetailPage';
import SessionResultPage from '../pages/session/SessionResultPage';
import DetailedFeedbackPage from '../pages/session/DetailedFeedbackPage';

// Main Pages (continued)
import PracticePage from '../pages/main/PracticePage';

// Components
import BottomNav from '../components/common/BottomNav';
import ThemeToggleBtn from '../components/common/ThemeToggleBtn';

/**
 * Protected Route Wrapper
 * - If not authenticated → redirect to login
 * - If authenticated but no nickname → redirect to nickname screen
 * - Otherwise render the protected page with Navbar
 */
function ProtectedRoute() {
  const { isAuthenticated, isInitializing, user } = useAuthContext();
  const { pathname } = useLocation();

  const hideThemeToggle = [ROUTES.PRACTICE, ROUTES.TRAINING_SETUP, ROUTES.TRAINING].includes(pathname);

  if (isInitializing) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">Bigkas</div>
        <div className="loading-spinner" aria-label="Loading" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Require nickname before accessing main app
  if (!user?.nickname) {
    return <Navigate to={ROUTES.NICKNAME} replace />;
  }

  return (
    <>
      {!hideThemeToggle && <ThemeToggleBtn />}
      <main className="main-content">
        <Outlet />
      </main>
      <BottomNav />
    </>
  );
}

/**
 * Nickname Route Wrapper
 * Only accessible when authenticated but nickname not yet set.
 */
function NicknameRoute() {
  const { isAuthenticated, isInitializing, user } = useAuthContext();

  if (isInitializing) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">Bigkas</div>
        <div className="loading-spinner" aria-label="Loading" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;
  if (user?.nickname) return <Navigate to={ROUTES.DASHBOARD} replace />;

  return <Outlet />;
}

/**
 * Public Route Wrapper
 * Redirects to dashboard if user is already authenticated
 */
function PublicRoute() {
  const { isAuthenticated, isInitializing } = useAuthContext();

  if (isInitializing) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">Bigkas</div>
        <div className="loading-spinner" aria-label="Loading" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}

/**
 * Root Route Wrapper
 * Redirects authenticated users to dashboard when hitting landing page.
 */
function HomeRoute() {
  const { isAuthenticated, isInitializing } = useAuthContext();

  if (isInitializing) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">Bigkas</div>
        <div className="loading-spinner" aria-label="Loading" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <LandingPage />;
}

/**
 * App Router Component
 * Defines all application routes
 */
function AppRouter() {
  return (
    <Routes>
      {/* Public Routes - accessible only when not logged in */}
      <Route element={<PublicRoute />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
      </Route>

      {/* Email Verification - accessible anytime */}
      <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />

      {/* Forgot Password - accessible anytime */}
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />

      {/* Nickname Route — authenticated users without a nickname */}
      <Route element={<NicknameRoute />}>
        <Route path={ROUTES.NICKNAME} element={<NicknamePage />} />
      </Route>

      {/* Protected Routes - require authentication + nickname */}
      <Route element={<ProtectedRoute />}>
        {/* Dashboard */}
        <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />

        {/* Scripts */}
        <Route path={ROUTES.SCRIPTS} element={<ScriptsPage />} />
        <Route path={ROUTES.SCRIPT_EDITOR} element={<ScriptEditorPage />} />
        <Route path={ROUTES.SCRIPT_EDITOR_EDIT} element={<ScriptEditorPage />} />
        <Route path={ROUTES.GENERATE_SCRIPT} element={<GenerateScriptPage />} />

        {/* Practice */}
        <Route path={ROUTES.PRACTICE} element={<PracticePage />} />

        {/* Training */}
        <Route path={ROUTES.TRAINING_SETUP} element={<TrainingSetupPage />} />
        <Route path={ROUTES.TRAINING} element={<TrainingPage />} />

        {/* Frameworks / Training Hub */}
        <Route path={ROUTES.FRAMEWORKS} element={<FrameworksPage />} />

        {/* History / Progress */}
        <Route path={ROUTES.HISTORY} element={<HistoryPage />} />
        <Route path={ROUTES.ALL_SESSIONS} element={<AllSessionsPage />} />
        <Route path={ROUTES.PROGRESS} element={<ProgressPage />} />

        {/* Profile */}
        <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
        <Route path={ROUTES.EDIT_PROFILE} element={<EditProfilePage />} />

        {/* Settings */}
        <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
        <Route path={ROUTES.CHANGE_PASSWORD} element={<ChangePasswordPage />} />
        <Route path={ROUTES.ACCOUNT_SETTINGS} element={<AccountSettingsPage />} />
        <Route path={ROUTES.AUDIO_TEST} element={<TestAudioVideoPage />} />

        {/* Session */}
        <Route path={ROUTES.SESSION_DETAIL} element={<SessionDetailPage />} />
        <Route path={ROUTES.SESSION_RESULT} element={<SessionResultPage />} />
        <Route path={ROUTES.DETAILED_FEEDBACK} element={<DetailedFeedbackPage />} />
      </Route>

      {/* Landing Page — redirects authenticated users to dashboard */}
      <Route path={ROUTES.HOME} element={<HomeRoute />} />

      {/* 404 - Redirect to landing */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}

export default AppRouter;

