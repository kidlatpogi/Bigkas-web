import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/useAuthContext';
import { useTheme } from '../../context/useTheme';
import { ROUTES } from '../../utils/constants';
import bigkasLogo from '../../assets/Temporary Logo.png';
import './Navbar.css';

/* Navigation order matches mobile BottomTabNavigator */
const NAV_LINKS = [
  { label: 'Scripts',  to: ROUTES.SCRIPTS },
  { label: 'Progress', to: ROUTES.PROGRESS },
  { label: 'Home',     to: ROUTES.DASHBOARD },
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
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const drawerRef    = useRef(null);

  const isDark = theme === 'dark';

  const isActive = (path) =>
    path === ROUTES.DASHBOARD
      ? location.pathname === path
      : location.pathname.startsWith(path);

  /* Circular reveal animation (from Portfolio repo) */
  const handleThemeToggle = (e) => {
    if (document.body.dataset.themeAnimating === '1') return;
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const radius = Math.hypot(Math.max(cx, vw - cx), Math.max(cy, vh - cy));

    const overlay = document.createElement('div');
    overlay.className = 'theme-anim';
    overlay.style.setProperty('--x', `${cx}px`);
    overlay.style.setProperty('--y', `${cy}px`);
    overlay.style.setProperty('--r', `${radius}px`);
    overlay.style.setProperty('--anim-bg', theme === 'light' ? '#121212' : '#F5F5F5');
    document.body.dataset.themeAnimating = '1';
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });

    const cleanup = () => {
      toggleTheme();
      overlay.remove();
      delete document.body.dataset.themeAnimating;
    };

    overlay.addEventListener('transitionend', cleanup, { once: true });
    setTimeout(() => {
      if (document.body.contains(overlay)) cleanup();
    }, 700);
  };

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

        {/* Theme toggle + Hamburger */}
        <div className="navbar-right">
          <button
            className="navbar-theme-btn"
            onClick={handleThemeToggle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? (
              /* Sun icon */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              /* Moon icon */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

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
      </div>

      {/* Mobile drawer */}
      {open && <div className="navbar-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}
      <div className={`navbar-drawer${open ? ' drawer-open' : ''}`} inert={!open ? '' : undefined}>
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
