import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/useAuthContext';
import { ROUTES } from '../../utils/constants';
import './InnerPages.css';
import './SettingsPage.css';

const MIC_OPTIONS = ['Default', 'External Microphone', 'Bluetooth Headset'];
const CAM_OPTIONS = ['Front Camera', 'Back Camera'];

function SettingsPage() {
  const navigate = useNavigate();
  const { logout } = useAuthContext();

  const [mic, setMic] = useState(() => localStorage.getItem('pref_mic') || 'Default');
  const [cam, setCam] = useState(() => localStorage.getItem('pref_cam') || 'Front Camera');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('pref_mic', mic);
    localStorage.setItem('pref_cam', cam);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearCache = () => {
    if (window.confirm('Clear local cache? This will reset preferences.')) {
      localStorage.clear();
      setMic('Default');
      setCam('Front Camera');
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
    }
  };

  return (
    <div className="inner-page">
      <div className="inner-page-header">
        <h1 className="inner-page-title">Settings</h1>
      </div>

      {saved && <div className="page-success">Preferences saved!</div>}

      {/* Hardware section */}
      <p className="section-label">Hardware</p>
      <div className="page-card" style={{ marginBottom: 16 }}>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label">Microphone Source</label>
          <select
            className="form-select"
            value={mic}
            onChange={(e) => setMic(e.target.value)}
          >
            {MIC_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Camera</label>
          <select
            className="form-select"
            value={cam}
            onChange={(e) => setCam(e.target.value)}
          >
            {CAM_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <button className="btn-primary" style={{ width: '100%', marginBottom: 24 }} onClick={handleSave}>
        Save Preferences
      </button>

      {/* Storage section */}
      <p className="section-label">Storage</p>
      <div className="page-card settings-storage-card">
        <button className="settings-text-btn" onClick={handleClearCache}>
          Clear Local Cache
        </button>
        <button className="settings-text-btn danger" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </div>
  );
}

export default SettingsPage;
