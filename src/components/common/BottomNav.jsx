import { NavLink, useLocation } from 'react-router-dom';
import {
  IoDocumentText,
  IoDocumentTextOutline,
  IoStatsChart,
  IoStatsChartOutline,
  IoHome,
  IoHomeOutline,
  IoPerson,
  IoPersonOutline,
  IoSettings,
  IoSettingsOutline,
} from 'react-icons/io5';
import { ROUTES } from '../../utils/constants';
import './BottomNav.css';

const ICON_COMPONENTS = {
  'document-text': IoDocumentText,
  'document-text-outline': IoDocumentTextOutline,
  'stats-chart': IoStatsChart,
  'stats-chart-outline': IoStatsChartOutline,
  home: IoHome,
  'home-outline': IoHomeOutline,
  person: IoPerson,
  'person-outline': IoPersonOutline,
  settings: IoSettings,
  'settings-outline': IoSettingsOutline,
};

/* ─── Icon names spec (from TECHNICAL_DOCS / mobile TAB_ICONS) ─── */
const TAB_ICONS = {
  Scripts:   { focused: 'document-text', outline: 'document-text-outline' },
  Progress:  { focused: 'stats-chart',   outline: 'stats-chart-outline' },
  Dashboard: { focused: 'home',          outline: 'home-outline' },
  Profile:   { focused: 'person',        outline: 'person-outline' },
  Settings:  { focused: 'settings',      outline: 'settings-outline' },
};

/* ─── Tab config mirroring mobile BottomTabNavigator ─── */
const TABS = [
  { to: ROUTES.SCRIPTS, label: 'Scripts' },
  { to: ROUTES.PROGRESS, label: 'Progress' },
  { to: ROUTES.DASHBOARD, label: 'Dashboard', center: true },
  { to: ROUTES.PROFILE, label: 'Profile' },
  { to: ROUTES.SETTINGS, label: 'Settings' },
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
        const active = tab.to === ROUTES.DASHBOARD
          ? location.pathname === tab.to
          : location.pathname.startsWith(tab.to);
        const icons = TAB_ICONS[tab.label];
        const iconName = active ? icons.focused : icons.outline;
        const TabIcon = ICON_COMPONENTS[iconName];

        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={`bottom-nav-item${tab.center ? ' bottom-nav-center' : ''}${active ? ' active' : ''}`}
            aria-label={tab.label}
            aria-current={active ? 'page' : undefined}
          >
            <TabIcon size={tab.center ? 28 : 24} aria-hidden="true" />
          </NavLink>
        );
      })}
    </nav>
  );
}
