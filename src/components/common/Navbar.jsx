import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/useAuthContext';
import { ROUTES } from '../../utils/constants';
import './Navbar.css';

/**
 * Navbar Component
 * Top navigation bar
 */
function Navbar() {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuthContext();

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={ROUTES.DASHBOARD} className="navbar-brand">
          <span className="brand-icon">🎤</span>
          <span className="brand-text">Bigkas</span>
        </Link>

        {isAuthenticated && (
          <>
            <div className="navbar-links">
              <Link 
                to={ROUTES.DASHBOARD} 
                className={`nav-link ${isActive(ROUTES.DASHBOARD) ? 'nav-link-active' : ''}`}
              >
                Dashboard
              </Link>
              <Link 
                to={ROUTES.PRACTICE} 
                className={`nav-link ${isActive(ROUTES.PRACTICE) ? 'nav-link-active' : ''}`}
              >
                Practice
              </Link>
              <Link 
                to={ROUTES.HISTORY} 
                className={`nav-link ${isActive(ROUTES.HISTORY) ? 'nav-link-active' : ''}`}
              >
                History
              </Link>
            </div>

            <div className="navbar-user">
              <Link 
                to={ROUTES.PROFILE} 
                className={`user-profile ${isActive(ROUTES.PROFILE) ? 'user-profile-active' : ''}`}
              >
                <span className="user-avatar">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
                <span className="user-name">{user?.name || 'User'}</span>
              </Link>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
