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
  IoStatsChart,
  IoStatsChartOutline,
  IoPerson,
  IoPersonOutline,
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
  'stats-chart':           IoStatsChart,
  'stats-chart-outline':   IoStatsChartOutline,
  person:                  IoPerson,
  'person-outline':        IoPersonOutline,
};

const TAB_ICONS = {
  Scripts:   { focused: 'document-text',  outline: 'document-text-outline' },
  Progress:  { focused: 'stats-chart',    outline: 'stats-chart-outline'   },
  Home:      { focused: 'home',           outline: 'home-outline'           },
  Learn:     { focused: 'book',           outline: 'book-outline'           },
  Profile:   { focused: 'person',         outline: 'person-outline'         },
  Settings:  { focused: 'settings',       outline: 'settings-outline'       },
};

/**
 * 6-tab Bottom Nav with a Floating Action Button (FAB) center Dashboard.
 * Layout: Scripts · Progress · [Home FAB] · Learn · Profile · Settings
 */
const TABS = [
  { to: ROUTES.SCRIPTS,    label: 'Scripts'  },
  { to: ROUTES.PROGRESS,   label: 'Progress' },
  { to: ROUTES.DASHBOARD,  label: 'Home',    center: true },
  { to: ROUTES.FRAMEWORKS, label: 'Learn'    },
  { to: ROUTES.PROFILE,    label: 'Profile'  },
  { to: ROUTES.SETTINGS,   label: 'Settings' },
];

/**
 * BottomNav — floating pill tab bar with icon + text labels.
 * The center Dashboard tab uses a raised FAB circle.
 * Active: icon filled + label bold; inactive: outline icon + muted label.
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
              tab.center ? 'bottom-nav-center' : '',
              active     ? 'active'            : '',
            ].filter(Boolean).join(' ')}
            aria-label={tab.label}
            aria-current={active ? 'page' : undefined}
          >
            {tab.center ? (
              <>
                <span className="bottom-nav-fab">
                  <TabIcon size={26} aria-hidden="true" />
                </span>
                <span className="bottom-nav-label">{tab.label}</span>
              </>
            ) : (
              <>
                <TabIcon size={22} aria-hidden="true" />
                <span className="bottom-nav-label">{tab.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
