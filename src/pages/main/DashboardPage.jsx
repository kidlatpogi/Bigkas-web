import { Link } from 'react-router-dom';
import { useAuthContext } from '../../context/useAuthContext';
import { ROUTES } from '../../utils/constants';
import Card from '../../components/common/Card';
import './MainPages.css';

/**
 * Dashboard Page Component
 * Main landing page after login
 */
function DashboardPage() {
  const { user } = useAuthContext();

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name || 'User'}!</h1>
        <p className="page-subtitle">Ready to practice your pronunciation today?</p>
      </div>

      <div className="dashboard-grid">
        <Card className="dashboard-card dashboard-card-primary">
          <div className="card-icon">🎤</div>
          <h2 className="card-title">Start Practice</h2>
          <p className="card-description">
            Begin a new pronunciation practice session
          </p>
          <Link to={ROUTES.PRACTICE} className="card-action-btn">
            Start Now
          </Link>
        </Card>

        <Card className="dashboard-card">
          <div className="card-icon">📊</div>
          <h2 className="card-title">View History</h2>
          <p className="card-description">
            Review your past practice sessions
          </p>
          <Link to={ROUTES.HISTORY} className="card-action-btn card-action-btn-secondary">
            View All
          </Link>
        </Card>

        <Card className="dashboard-card">
          <div className="card-icon">👤</div>
          <h2 className="card-title">Profile</h2>
          <p className="card-description">
            Manage your account settings
          </p>
          <Link to={ROUTES.PROFILE} className="card-action-btn card-action-btn-secondary">
            Edit Profile
          </Link>
        </Card>
      </div>

      <section className="recent-activity">
        <h2 className="section-title">Recent Activity</h2>
        <div className="activity-placeholder">
          <p>No recent activity. Start a practice session to see your progress!</p>
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
