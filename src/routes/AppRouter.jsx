import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../context/useAuthContext';
import { ROUTES } from '../utils/constants';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Main Pages
import DashboardPage from '../pages/main/DashboardPage';
import PracticePage from '../pages/main/PracticePage';
import HistoryPage from '../pages/main/HistoryPage';
import ProfilePage from '../pages/main/ProfilePage';

// Session Pages
import SessionDetailPage from '../pages/session/SessionDetailPage';
import SessionResultPage from '../pages/session/SessionResultPage';

// Components
import Navbar from '../components/common/Navbar';

/**
 * Protected Route Wrapper
 * Redirects to login if user is not authenticated
 */
function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthContext();

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
    <Routes>
      {/* Public Routes - accessible only when not logged in */}
      <Route element={<PublicRoute />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
      </Route>

      {/* Protected Routes - require authentication */}
      <Route element={<ProtectedRoute />}>
        <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
        <Route path={ROUTES.PRACTICE} element={<PracticePage />} />
        <Route path={ROUTES.HISTORY} element={<HistoryPage />} />
        <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
        <Route path={ROUTES.SESSION_DETAIL} element={<SessionDetailPage />} />
        <Route path={ROUTES.SESSION_RESULT} element={<SessionResultPage />} />
      </Route>

      {/* Redirect root to dashboard or login */}
      <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />

      {/* 404 - Redirect to dashboard */}
      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}

export default AppRouter;
