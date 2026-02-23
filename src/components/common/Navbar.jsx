import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/useAuthContext';
import { ROUTES } from '../../utils/constants';
import bigkasLogo from '../../assets/Temporary Logo.png';
import './Navbar.css';

/**
 * Navbar — matches the main-app design from the Bigkas screenshot.
 * Left: waveform logo + Bigkas brand text
 * Right: Home · Script · Progress · Profile · Settings
 */
function Navbar() {
  const location = useLocation();
  const { logout } = useAuthContext();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand */}
        <Link to={ROUTES.DASHBOARD} className="navbar-brand">
          <img src={bigkasLogo} alt="Bigkas" className="navbar-logo-img" />
          <span className="brand-text">Bigkas</span>
        </Link>

        {/* Nav links — matching screenshot: Home Script Progress Profile Settings */}
        <div className="navbar-links">
          <Link
            to={ROUTES.DASHBOARD}
            className={`nav-link ${isActive(ROUTES.DASHBOARD) ? 'nav-link-active' : ''}`}
          >
            Home
          </Link>
          <Link
            to={ROUTES.PRACTICE}
            className={`nav-link ${isActive(ROUTES.PRACTICE) ? 'nav-link-active' : ''}`}
          >
            Script
          </Link>
          <Link
            to={ROUTES.HISTORY}
            className={`nav-link ${isActive(ROUTES.HISTORY) ? 'nav-link-active' : ''}`}
          >
            Progress
          </Link>
          <Link
            to={ROUTES.PROFILE}
            className={`nav-link ${isActive(ROUTES.PROFILE) ? 'nav-link-active' : ''}`}
          >
            Profile
          </Link>
          <Link
            to={ROUTES.SETTINGS}
            className={`nav-link ${isActive(ROUTES.SETTINGS) ? 'nav-link-active' : ''}`}
          >
            Settings
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
