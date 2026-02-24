import { NavLink, useLocation } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import './BottomNav.css';

/* ─── Ionicons-style SVG icons ─── */

function IconScripts({ filled }) {
  return filled ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 2H9C7.34 2 6 3.34 6 5v1H5C3.34 6 2 7.34 2 9v10c0 1.66 1.34 3 3 3h10c1.66 0 3-1.34 3-3v-1h1c1.66 0 3-1.34 3-3V6c0-2.21-1.79-4-4-4zm-5 18H5c-.55 0-1-.45-1-1V9c0-.55.45-1 1-1h1v8c0 1.66 1.34 3 3 3h5v1c0 .55-.45 1-1 1zm7-4H9c-.55 0-1-.45-1-1V6c0-1.1.9-2 2-2h9c1.1 0 2 .9 2 2v8c0 .55-.45 1-1 1z"/>
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}

function IconProgress({ filled }) {
  return filled ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 18v-6l6-3 4 2 8-5v12H3z" opacity="0.3"/>
      <path d="M3.5 18.5l5.5-8 4 2.5 5.5-8M3 18h18"/>
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}

function IconHome({ filled }) {
  return filled ? (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
  ) : (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function IconPerson({ filled }) {
  return filled ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function IconSettings({ filled }) {
  return filled ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.14 12.94A7.28 7.28 0 0019.2 12a7.28 7.28 0 00-.06-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96a7.04 7.04 0 00-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54a7.04 7.04 0 00-1.62.94l-2.39-.96a.488.488 0 00-.59.22L2.74 9.87a.48.48 0 00.12.61l2.03 1.58A7.15 7.15 0 004.8 12c0 .31.02.63.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.3.59.22l2.39-.96c.5.38 1.04.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54a7.04 7.04 0 001.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.48.48 0 00-.12-.61l-2.03-1.58zM12 15.6a3.6 3.6 0 110-7.2 3.6 3.6 0 010 7.2z"/>
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  );
}

/* ─── Tab config mirroring mobile BottomTabNavigator ─── */
const TABS = [
  { to: ROUTES.SCRIPTS,   label: 'Scripts',   Icon: IconScripts },
  { to: ROUTES.PROGRESS,  label: 'Progress',  Icon: IconProgress },
  { to: ROUTES.DASHBOARD, label: 'Home',      Icon: IconHome,    center: true },
  { to: ROUTES.PROFILE,   label: 'Profile',   Icon: IconPerson },
  { to: ROUTES.SETTINGS,  label: 'Settings',  Icon: IconSettings },
];

/**
 * BottomNav — floating tab bar (web port of BottomTabNavigator.jsx from Bigkas-mobile).
 *
 * Order (left → right): Scripts · Progress · Home · Profile · Settings
 * — Icons only (no labels)
 * — Active: #010101 (black)    Inactive: rgba(1,1,1,0.45)
 * — Floating pill: white, rounded-full, shadow
 */
export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      {TABS.map(({ to, label, Icon, center }) => {
        const active = to === ROUTES.DASHBOARD
          ? location.pathname === to
          : location.pathname.startsWith(to);

        return (
          <NavLink
            key={to}
            to={to}
            className={`bottom-nav-item${center ? ' bottom-nav-center' : ''}${active ? ' active' : ''}`}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
          >
            <Icon filled={active} />
          </NavLink>
        );
      })}
    </nav>
  );
}
