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
} from 'react-icons/io5';
import { ROUTES } from '../../utils/constants';
import './BottomNav.css';

const ICONS = {
  Scripts:  { active: IoDocumentText,  inactive: IoDocumentTextOutline },
  Progress: { active: IoStatsChart,    inactive: IoStatsChartOutline   },
  Learn:    { active: IoBook,          inactive: IoBookOutline          },
  Settings: { active: IoSettings,      inactive: IoSettingsOutline      },
};

/** Tabs inside the right-hand pill (excluding Home) */
const PILL_TABS = [
  { to: ROUTES.SCRIPTS,    label: 'Scripts'  },
  { to: ROUTES.PROGRESS,   label: 'Progress' },
  { to: ROUTES.FRAMEWORKS, label: 'Learn'    },
  { to: ROUTES.SETTINGS,   label: 'Settings' },
];

/**
 * BottomNav — dark outer wrapper containing:
 *   • A standalone circle on the left  → Home / Dashboard
 *   • A rounded pill on the right      → Scripts · Progress · Learn · Profile · Settings
 * Each item shows a tooltip on hover via [data-tooltip].
 */
export default function BottomNav() {
  const location = useLocation();
  const homeActive = location.pathname === ROUTES.DASHBOARD;
  const HomeIcon   = homeActive ? IoHome : IoHomeOutline;

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">

      {/* ── Home circle ────────────────────────────────── */}
      <NavLink
        to={ROUTES.DASHBOARD}
        className={`bottom-nav-home${homeActive ? ' active' : ''}`}
        data-tooltip="Home"
        aria-label="Home"
        aria-current={homeActive ? 'page' : undefined}
      >
        <HomeIcon size={26} aria-hidden="true" />
      </NavLink>

      {/* ── Other tabs pill ────────────────────────────── */}
      <div className="bottom-nav-pill" role="list">
        {PILL_TABS.map((tab) => {
          const active  = location.pathname.startsWith(tab.to);
          const TabIcon = active ? ICONS[tab.label].active : ICONS[tab.label].inactive;

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              role="listitem"
              className={`bottom-nav-item${active ? ' active' : ''}`}
              data-tooltip={tab.label}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
            >
              <TabIcon size={22} aria-hidden="true" />
            </NavLink>
          );
        })}
      </div>

    </nav>
  );
}
