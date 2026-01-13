import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import './Sidebar.css';

/**
 * Sidebar Component
 * Side navigation for main pages
 */
function Sidebar({ isOpen = true, onClose }) {
  const navItems = [
    { path: ROUTES.DASHBOARD, label: 'Dashboard', icon: '🏠' },
    { path: ROUTES.PRACTICE, label: 'Practice', icon: '🎤' },
    { path: ROUTES.HISTORY, label: 'History', icon: '📊' },
    { path: ROUTES.PROFILE, label: 'Profile', icon: '👤' },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}
      
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-brand">🎤 Bigkas</span>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
              }
              onClick={onClose}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
