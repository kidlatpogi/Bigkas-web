import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/useAuthContext';
import { ROUTES } from '../../utils/constants';
import bigkasLogo from '../../assets/Temporary Logo.png';
import './Navbar.css';

const NAV_LINKS = [
  { label: 'Home',     to: ROUTES.DASHBOARD },
  { label: 'Scripts',  to: ROUTES.SCRIPTS },
  { label: 'Progress', to: ROUTES.PROGRESS },
  { label: 'Profile',  to: ROUTES.PROFILE },
  { label: 'Settings', to: ROUTES.SETTINGS },
];

/**
 * Responsive Navbar
 * Desktop: horizontal links right-aligned
 * Mobile (≤768 px): hamburger button → slide-down drawer
 */
function Navbar() {
  const location     = useLocation();
  const { user, logout } = useAuthContext();
  const [open, setOpen] = useState(false);
  const drawerRef    = useRef(null);

  const isActive = (path) =>
    path === ROUTES.DASHBOARD
      ? location.pathname === path
      : location.pathname.startsWith(path);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Close drawer on outside click
  useEffect(() => {
    function handleClick(e) {
      if (open && drawerRef.current && !drawerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <nav className="navbar" ref={drawerRef}>
      <div className="navbar-container">
        {/* Brand */}
        <Link to={ROUTES.DASHBOARD} className="navbar-brand">
          <img src={bigkasLogo} alt="Bigkas logo" className="navbar-logo-img" />
          <span className="brand-text">Bigkas</span>
        </Link>

        {/* Desktop links */}
        <div className="navbar-links">
          {NAV_LINKS.map(({ label, to }) => (
            <Link key={to} to={to} className={`nav-link${isActive(to) ? ' nav-link-active' : ''}`}>
              {label}
            </Link>
          ))}
        </div>

        {/* Hamburger button — mobile only */}
        <button
          className={`navbar-hamburger${open ? ' is-open' : ''}`}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile drawer */}
      <div className={`navbar-drawer${open ? ' drawer-open' : ''}`} aria-hidden={!open}>
        {NAV_LINKS.map(({ label, to }) => (
          <Link
            key={to}
            to={to}
            className={`drawer-link${isActive(to) ? ' drawer-link-active' : ''}`}
            tabIndex={open ? 0 : -1}
          >
            {label}
          </Link>
        ))}
        <button className="drawer-logout" onClick={logout} tabIndex={open ? 0 : -1}>
          Log Out
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
