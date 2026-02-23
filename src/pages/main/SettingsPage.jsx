import { useAuthContext } from '../../context/useAuthContext';
import './MainPages.css';

/**
 * Settings Page — placeholder matching the Bigkas-mobile SettingsScreen.
 * Includes logout option so users can sign out from here.
 */
function SettingsPage() {
  const { logout } = useAuthContext();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your preferences and account</p>
      </div>

      <div className="settings-section">
        <h2 className="section-title">Account</h2>
        <div className="settings-list">
          <div className="settings-row">
            <span className="settings-label">Microphone Source</span>
            <span className="settings-value">Default</span>
          </div>
          <div className="settings-row">
            <span className="settings-label">Camera Source</span>
            <span className="settings-value">Front</span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <button className="settings-logout-btn" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </div>
  );
}

export default SettingsPage;
