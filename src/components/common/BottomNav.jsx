import { NavLink, useLocation } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import './BottomNav.css';

/* ─── Ionicons 5 SVG icons (512×512 viewBox, matching TAB_ICONS in mobile) ─── */

/** document-text / document-text-outline */
function IconScripts({ filled }) {
  return filled ? (
    <svg width="24" height="24" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
      <path d="M400 0H112a48.05 48.05 0 00-48 48v416a48.05 48.05 0 0048 48h288a48.05 48.05 0 0048-48V48A48.05 48.05 0 00400 0zM160 80h192a16 16 0 010 32H160a16 16 0 010-32zm0 96h192a16 16 0 010 32H160a16 16 0 010-32zm224 144H128a16 16 0 010-32h256a16 16 0 010 32zm0 80H128a16 16 0 010-32h256a16 16 0 010 32z"/>
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M416 221.25V416a48 48 0 01-48 48H144a48 48 0 01-48-48V96a48 48 0 0148-48h98.75a32 32 0 0122.62 9.37l141.26 141.26A32 32 0 01416 221.25z"/>
      <path d="M256 56v120a32 32 0 0032 32h120M176 288h160M176 368h160M176 208h80"/>
    </svg>
  );
}

/** stats-chart / stats-chart-outline */
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

/** home / home-outline */
function IconHome({ filled }) {
  return filled ? (
    <svg width="28" height="28" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
      <path d="M261.56 101.28a8 8 0 00-11.06 0L66.4 277.15a8 8 0 00-2.47 5.79L63.9 448a32 32 0 0032 32H192a16 16 0 0016-16V328a8 8 0 018-8h80a8 8 0 018 8v136a16 16 0 0016 16h96.11a32 32 0 0031.89-32V282.94a8 8 0 00-2.47-5.79z"/>
      <path d="M490.91 244.15l-74.8-71.56V64a16 16 0 00-16-16h-48a16 16 0 00-16 16v32l-57.92-55.38C272.77 35.14 264.71 32 256 32c-8.68 0-16.72 3.09-22.14 8.63L21.09 244.16a16 16 0 00-1.09 22.58L25.32 273a16 16 0 0022.58 1.09L256 80.62l208.1 193.47a16 16 0 0022.58-1.09l5.32-6.26a16 16 0 00-1.09-22.65z"/>
    </svg>
  ) : (
    <svg width="28" height="28" viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M80 212v236a16 16 0 0016 16h96V328a24 24 0 0124-24h80a24 24 0 0124 24v136h96a16 16 0 0016-16V212"/>
      <path d="M480 256L266.89 52c-5-5.28-16.69-5.34-21.78 0L48 256M400 179V64h-48v69"/>
    </svg>
  );
}

/** person / person-outline */
function IconPerson({ filled }) {
  return filled ? (
    <svg width="24" height="24" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
      <path d="M256 256a112 112 0 10-112-112 112 112 0 00112 112zm0 32c-69.42 0-208 42.88-208 128v64h416v-64c0-85.12-138.58-128-208-128z"/>
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M344 144c-3.92 52.87-44 96-88 96s-84.15-43.12-88-96c-4-55 35-96 88-96s92 42 88 96z"/>
      <path d="M256 304c-87 0-176 48-176 128v16h352v-16c0-80-89-128-176-128z"/>
    </svg>
  );
}

/** settings / settings-outline */
function IconSettings({ filled }) {
  return filled ? (
    <svg width="24" height="24" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
      <path d="M470.39 300l-.47-.38-31.56-18.22a188.78 188.78 0 000-51.83l31.56-18.22c6-3.51 9.19-10.51 7.68-17.19-10.13-42.86-29.47-80.87-56.84-110.43a14.87 14.87 0 00-17.37-2.93l-31.56 18.22a188.08 188.08 0 00-44.86-25.89V38.42a14.88 14.88 0 00-11.86-14.56c-44.16-9.59-89.86-9.16-132.29 0a14.88 14.88 0 00-11.86 14.56v36.13a188.08 188.08 0 00-44.86 25.89L95 82.22a14.87 14.87 0 00-17.37 2.93c-27.37 29.56-46.71 67.57-56.84 110.43-1.51 6.68 1.68 13.68 7.68 17.19l31.56 18.22a188.78 188.78 0 000 51.83L28.47 300.62c-6 3.51-9.19 10.51-7.68 17.19 10.12 42.86 29.46 80.87 56.84 110.43a14.87 14.87 0 0017.37 2.93l31.56-18.22a188.08 188.08 0 0044.86 25.89v36.13a14.88 14.88 0 0011.86 14.56c44.16 9.59 89.86 9.16 132.29 0a14.88 14.88 0 0011.86-14.56v-36.13a188.08 188.08 0 0044.86-25.89l31.56 18.22a14.87 14.87 0 0017.37-2.93c27.37-29.56 46.71-67.57 56.84-110.43 1.51-6.68-1.68-13.68-7.68-17.22zM256 336a80 80 0 110-160 80 80 0 010 160z"/>
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M262.29 192.31a64 64 0 1057.4 57.4 64.13 64.13 0 00-57.4-57.4zM416.39 256a154.34 154.34 0 01-1.53 20.79l45.21 35.46a10.81 10.81 0 012.45 13.75l-42.77 74a10.81 10.81 0 01-13.14 4.59l-44.9-18.08a16.11 16.11 0 00-15.17 1.75A164.48 164.48 0 01325 400.8a15.94 15.94 0 00-8.82 12.14l-6.73 47.89a11.08 11.08 0 01-10.68 9.17h-85.54a11.11 11.11 0 01-10.69-8.87l-6.72-47.82a16.07 16.07 0 00-9-12.22 155.3 155.3 0 01-21.46-12.57 16 16 0 00-15.11-1.71l-44.89 18.07a10.81 10.81 0 01-13.14-4.58l-42.77-74a10.8 10.8 0 012.45-13.75l38.21-30a16.05 16.05 0 006-12.61v-4.43a16.05 16.05 0 00-6.05-12.61l-38.21-30a10.8 10.8 0 01-2.45-13.75l42.77-74a10.81 10.81 0 0113.14-4.59l44.9 18.08a16.11 16.11 0 0015.17-1.75A164.48 164.48 0 01187 111.2a15.94 15.94 0 008.82-12.14l6.73-47.89A11.08 11.08 0 01213.23 42h85.54a11.11 11.11 0 0110.69 8.87l6.72 47.82a16.07 16.07 0 009 12.22 155.3 155.3 0 0121.46 12.57 16 16 0 0015.11 1.71l44.89-18.07a10.81 10.81 0 0113.14 4.58l42.77 74a10.8 10.8 0 01-2.45 13.75l-38.21 30a16.05 16.05 0 00-6.05 12.61z"/>
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
