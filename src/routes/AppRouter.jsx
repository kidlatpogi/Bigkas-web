import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../context/useAuthContext';
import { ROUTES } from '../utils/constants';

// Landing Page
import LandingPage from '../pages/landing/LandingPage';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import NicknamePage from '../pages/auth/NicknamePage';

// Main Pages
import DashboardPage from '../pages/main/DashboardPage';
import PracticePage from '../pages/main/PracticePage';
import HistoryPage from '../pages/main/HistoryPage';
import ProfilePage from '../pages/main/ProfilePage';
import SettingsPage from '../pages/main/SettingsPage';

// Session Pages
import SessionDetailPage from '../pages/session/SessionDetailPage';
import SessionResultPage from '../pages/session/SessionResultPage';

// Components
import Navbar from '../components/common/Navbar';
import ModeSwitcher from '../components/common/ModeSwitcher';

/**
 * Protected Route Wrapper
 * - If not authenticated → redirect to login
 * - If authenticated but no nickname → redirect to nickname screen
 * - Otherwise render the protected page with Navbar
 */
function ProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuthContext();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <p>Loading...</p>
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
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
    </>
  );
}

/**
 * Nickname Route Wrapper
 * Only accessible when authenticated but nickname not yet set.
 */
function NicknameRoute() {
  const { isAuthenticated, isLoading, user } = useAuthContext();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;
  if (user?.nickname)   return <Navigate to={ROUTES.DASHBOARD} replace />;

  return <Outlet />;
}

/**
 * Public Route Wrapper
 * Redirects to dashboard if user is already authenticated
 */
function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}

/**
 * App Router Component
 * Defines all application routes
 */
function AppRouter() {
  return (
    <>
      <ModeSwitcher />
      <Routes>
        {/* Public Routes - accessible only when not logged in */}
        <Route element={<PublicRoute />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        </Route>

        {/* Nickname Route — authenticated users without a nickname */}
        <Route element={<NicknameRoute />}>
          <Route path={ROUTES.NICKNAME} element={<NicknamePage />} />
        </Route>

        {/* Protected Routes - require authentication + nickname */}
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.PRACTICE} element={<PracticePage />} />
          <Route path={ROUTES.HISTORY} element={<HistoryPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          <Route path={ROUTES.SESSION_DETAIL} element={<SessionDetailPage />} />
          <Route path={ROUTES.SESSION_RESULT} element={<SessionResultPage />} />
        </Route>

        {/* Landing Page — public root */}
        <Route path={ROUTES.HOME} element={<LandingPage />} />

        {/* 404 - Redirect to landing */}
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </>
  );
}

export default AppRouter;

