import { NavLink, useLocation } from 'react-router-dom';
import {
  IoDocumentText,
  IoDocumentTextOutline,
  IoHome,
  IoHomeOutline,
  IoBook,
  IoBookOutline,
  IoSettings,
  IoSettingsOutline,
  IoTime,
  IoTimeOutline,
} from 'react-icons/io5';
import { ROUTES } from '../../utils/constants';
import './BottomNav.css';

const ICON_COMPONENTS = {
  'document-text':         IoDocumentText,
  'document-text-outline': IoDocumentTextOutline,
  home:                    IoHome,
  'home-outline':          IoHomeOutline,
  book:                    IoBook,
  'book-outline':          IoBookOutline,
  settings:                IoSettings,
  'settings-outline':      IoSettingsOutline,
  time:                    IoTime,
  'time-outline':          IoTimeOutline,
};

const TAB_ICONS = {
  History:   { focused: 'time',          outline: 'time-outline' },
  Scripts:   { focused: 'document-text', outline: 'document-text-outline' },
  Dashboard: { focused: 'home',          outline: 'home-outline' },
  Training:  { focused: 'book',          outline: 'book-outline' },
  Settings:  { focused: 'settings',      outline: 'settings-outline' },
};

/**
 * 5-tab Bottom Nav with a Floating Action Button (FAB) center Dashboard.
 * Layout: History · Scripts · [Home FAB] · Training · Settings
 */
const TABS = [
  { to: ROUTES.HISTORY,    label: 'History' },
  { to: ROUTES.SCRIPTS,    label: 'Scripts' },
  { to: ROUTES.DASHBOARD,  label: 'Dashboard', center: true },
  { to: ROUTES.FRAMEWORKS, label: 'Training' },
  { to: ROUTES.SETTINGS,   label: 'Settings' },
];

/**
 * BottomNav — floating pill tab bar.
 * The center Dashboard tab uses a raised FAB circle.
 * Active: icon filled; inactive: outline variant.
 */
export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      {TABS.map((tab) => {
        const active = tab.to === ROUTES.DASHBOARD
          ? location.pathname === tab.to
          : location.pathname.startsWith(tab.to);
        const icons   = TAB_ICONS[tab.label];
        const TabIcon = ICON_COMPONENTS[active ? icons.focused : icons.outline];

        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={[
              'bottom-nav-item',
              tab.center  ? 'bottom-nav-center' : '',
              active      ? 'active'            : '',
            ].filter(Boolean).join(' ')}
            aria-label={tab.label}
            aria-current={active ? 'page' : undefined}
          >
            {tab.center ? (
              <span className="bottom-nav-fab">
                <TabIcon size={28} aria-hidden="true" />
              </span>
            ) : (
              <TabIcon size={24} aria-hidden="true" />
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
