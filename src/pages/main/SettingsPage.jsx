import { useState } from 'react';
import { useAuthContext } from '../../context/useAuthContext';
import './InnerPages.css';
import './SettingsPage.css';

const MIC_OPTIONS = [
  'Default — Built-in Microphone',
  'Bluetooth Microphone',
  'External Microphone',
];
const CAM_OPTIONS = [
  'Front Camera',
  'Back Camera',
];

/* ── Chevron icon ── */
const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

function SettingsPage() {
  const { logout } = useAuthContext();

  const [mic, setMic] = useState(() => localStorage.getItem('pref_mic') || MIC_OPTIONS[0]);
  const [cam, setCam] = useState(() => localStorage.getItem('pref_cam') || CAM_OPTIONS[0]);

  const handleMicChange = (e) => {
    setMic(e.target.value);
    localStorage.setItem('pref_mic', e.target.value);
  };

  const handleCamChange = (e) => {
    setCam(e.target.value);
    localStorage.setItem('pref_cam', e.target.value);
  };

  const handleTestAV = () => {
    alert('Audio / Video test feature coming soon!');
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
    }
  };

  return (
    <div className="inner-page settings-page">
      <div className="inner-page-header" style={{ marginBottom: 28 }}>
        <h1 className="inner-page-title">Settings</h1>
      </div>

      {/* Hardware section */}
      <p className="settings-section-label">HARDWARE</p>

      <div className="settings-card">
        {/* Microphone */}
        <div className="settings-field">
          <label className="settings-field-label">MICROPHONE SOURCE</label>
          <div className="settings-select-wrap">
            <select
              className="settings-select"
              value={mic}
              onChange={handleMicChange}
            >
              {MIC_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronIcon />
          </div>
        </div>

        <div className="settings-divider" />

        {/* Camera */}
        <div className="settings-field">
          <label className="settings-field-label">CAMERA SOURCE</label>
          <div className="settings-select-wrap">
            <select
              className="settings-select"
              value={cam}
              onChange={handleCamChange}
            >
              {CAM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronIcon />
          </div>
        </div>
      </div>

      {/* Test A/V button */}
      <button className="settings-btn-test" onClick={handleTestAV}>
        TEST AUDIO / VIDEO
      </button>

      {/* Log out */}
      <button className="settings-btn-logout" onClick={handleLogout}>
        Log Out
      </button>
    </div>
  );
}

export default SettingsPage;
