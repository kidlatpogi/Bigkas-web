import { NavLink, useLocation } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import './BottomNav.css';

/* ─── Ionicons-style SVG icons ─── */

function IconScripts({ filled }) {
  return filled ? (
    <svg width="24" height="24" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
      <path d="M428.54 188L336 95.47A48 48 0 00302.09 80H144a64 64 0 00-64 64v224a64 64 0 0064 64h224a64 64 0 0064-64V221.91A48 48 0 00428.54 188zM288 112l96 96h-80a16 16 0 01-16-16zm144 256a48 48 0 01-48 48H144a48 48 0 01-48-48V144a48 48 0 0148-48h128v80a32 32 0 0032 32h80zM176 288a16 16 0 000 32h160a16 16 0 000-32zm0 64a16 16 0 000 32h160a16 16 0 000-32zm0-128a16 16 0 000 32h80a16 16 0 000-32z"/>
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M416 221.25V416a48 48 0 01-48 48H144a48 48 0 01-48-48V96a48 48 0 0148-48h98.75a32 32 0 0122.62 9.37l141.26 141.26A32 32 0 01416 221.25z"/>
      <path d="M256 56v120a32 32 0 0032 32h120M176 288h160M176 368h160M176 208h80"/>
    </svg>
  );
}

function IconProgress({ filled }) {
  return filled ? (
    <svg width="24" height="24" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
      <path d="M496 432H16a16 16 0 000 32h480a16 16 0 000-32zM160 240h-48a32 32 0 00-32 32v160h112V272a32 32 0 00-32-32zM304 96h-48a32 32 0 00-32 32v304h112V128a32 32 0 00-32-32zM448 288h-48a32 32 0 00-32 32v112h112V320a32 32 0 00-32-32z"/>
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M480 432H32M192 192H112a32 32 0 00-32 32v208h144V224a32 32 0 00-32-32zM336 96h-80a32 32 0 00-32 32v304h144V128a32 32 0 00-32-32zM480 288h-80a32 32 0 00-32 32v112h144V320a32 32 0 00-32-32z"/>
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
      {TABS.map((tab) => {
        const TabIcon = tab.Icon;
        const active = tab.to === ROUTES.DASHBOARD
          ? location.pathname === tab.to
          : location.pathname.startsWith(tab.to);

        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={`bottom-nav-item${tab.center ? ' bottom-nav-center' : ''}${active ? ' active' : ''}`}
            aria-label={tab.label}
            aria-current={active ? 'page' : undefined}
          >
            <TabIcon filled={active} />
          </NavLink>
        );
      })}
    </nav>
  );
}
