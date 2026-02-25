import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/useAuthContext';
import { ROUTES } from '../../utils/constants';
import './InnerPages.css';
import './SettingsPage.css';

/* ── Dropdown arrow icon ── */
const DropdownIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

function SettingsPage() {
  const navigate = useNavigate();
  const { logout } = useAuthContext();

  /* ── Enumerate real devices when available ── */
  const [microphones, setMicrophones] = useState([]);
  const [cameras, setCameras]         = useState([]);
  const [mic, setMic] = useState(() => localStorage.getItem('pref_mic') || '');
  const [cam, setCam] = useState(() => localStorage.getItem('pref_cam') || '');

  useEffect(() => {
    const enumerate = async () => {
      try {
        /* Request permission so labels are populated */
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        stream.getTracks().forEach(t => t.stop());

        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter(d => d.kind === 'audioinput');
        const cams = devices.filter(d => d.kind === 'videoinput');

        setMicrophones(mics);
        setCameras(cams);

        if (!mic && mics.length) {
          setMic(mics[0].deviceId);
          localStorage.setItem('pref_mic', mics[0].deviceId);
        }
        if (!cam && cams.length) {
          setCam(cams[0].deviceId);
          localStorage.setItem('pref_cam', cams[0].deviceId);
        }
      } catch {
        /* Fallback when permission denied */
        setMicrophones([{ deviceId: 'default', label: 'Default Microphone' }]);
        setCameras([{ deviceId: 'default', label: 'Default Camera' }]);
      }
    };
    enumerate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMicChange = (e) => {
    setMic(e.target.value);
    localStorage.setItem('pref_mic', e.target.value);
  };

  const handleCamChange = (e) => {
    setCam(e.target.value);
    localStorage.setItem('pref_cam', e.target.value);
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
    }
  };

  return (
    <div className="inner-page settings-page">
      <div className="inner-page-header">
        <h1 className="inner-page-title">Settings</h1>
      </div>

      {/* ── Hardware section ── */}
      <h2 className="settings-section-title">HARDWARE</h2>

      <div className="settings-card">
        <div className="settings-field">
          <label className="settings-field-label">MICROPHONE SOURCE</label>
          <div className="settings-select-wrap">
            <select className="settings-select" value={mic} onChange={handleMicChange}>
              {microphones.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone ${d.deviceId.slice(0, 6)}`}
                </option>
              ))}
            </select>
            <DropdownIcon />
          </div>
        </div>

        <div className="settings-divider" />

        <div className="settings-field">
          <label className="settings-field-label">CAMERA SOURCE</label>
          <div className="settings-select-wrap">
            <select className="settings-select" value={cam} onChange={handleCamChange}>
              {cameras.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
                </option>
              ))}
            </select>
            <DropdownIcon />
          </div>
        </div>
      </div>

      {/* ── Test A/V ── */}
      <button className="settings-btn-test" onClick={() => navigate(ROUTES.AUDIO_TEST)}>
        TEST AUDIO / VIDEO
      </button>

      {/* ── Log out ── */}
      <button className="settings-btn-logout" onClick={handleLogout}>
        Log out
      </button>
    </div>
  );
}

export default SettingsPage;
