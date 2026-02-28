import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IoPersonOutline,
  IoKeyOutline,
  IoShieldCheckmarkOutline,
  IoMicOutline,
  IoCameraOutline,
  IoHardwareChipOutline,
  IoLogOutOutline,
  IoChevronForward,
} from 'react-icons/io5';
import { useAuthContext } from '../../context/useAuthContext';
import { ROUTES } from '../../utils/constants';
import './InnerPages.css';
import './SettingsPage.css';
import ConfirmationModal from '../../components/common/ConfirmationModal';

function SettingsPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuthContext();

  /* ── Enumerate real devices when available ── */
  const [microphones, setMicrophones] = useState([]);
  const [cameras, setCameras]         = useState([]);
  const [mic, setMic] = useState(() => localStorage.getItem('pref_mic') || '');
  const [cam, setCam] = useState(() => localStorage.getItem('pref_cam') || '');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const enumerate = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        stream.getTracks().forEach(t => t.stop());
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter(d => d.kind === 'audioinput');
        const cams = devices.filter(d => d.kind === 'videoinput');
        setMicrophones(mics);
        setCameras(cams);
        if (!mic && mics.length) { setMic(mics[0].deviceId); localStorage.setItem('pref_mic', mics[0].deviceId); }
        if (!cam && cams.length) { setCam(cams[0].deviceId); localStorage.setItem('pref_cam', cams[0].deviceId); }
      } catch {
        setMicrophones([{ deviceId: 'default', label: 'Default Microphone' }]);
        setCameras([{ deviceId: 'default', label: 'Default Camera' }]);
      }
    };
    enumerate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMicChange = (e) => { setMic(e.target.value); localStorage.setItem('pref_mic', e.target.value); };
  const handleCamChange = (e) => { setCam(e.target.value); localStorage.setItem('pref_cam', e.target.value); };

  const handleLogout = () => { setShowLogoutModal(true); };

  const displayName  = user?.nickname || user?.name || 'My Profile';
  const displayEmail  = user?.email || '';
  const avatarUrl     = user?.avatar_url || null;

  return (
    <div className="inner-page settings-page">
      <div className="inner-page-header">
        <h1 className="inner-page-title">Settings</h1>
      </div>

      {/* ── Account section ── */}
      <p className="stg-section-label">ACCOUNT</p>
      <div className="stg-card">

        {/* Profile row */}
        <button className="stg-row" onClick={() => navigate(ROUTES.PROFILE)}>
          <span className="stg-row-icon stg-icon-gold">
            {avatarUrl
              ? <img src={avatarUrl} alt={displayName} className="stg-avatar" />
              : <IoPersonOutline size={20} />
            }
          </span>
          <div className="stg-row-body">
            <span className="stg-row-title">{displayName}</span>
            <span className="stg-row-sub">{displayEmail}</span>
          </div>
          <IoChevronForward size={17} className="stg-chevron" />
        </button>

        <div className="stg-divider" />

        {/* Change Password */}
        <button className="stg-row" onClick={() => navigate(ROUTES.CHANGE_PASSWORD)}>
          <span className="stg-row-icon">
            <IoKeyOutline size={20} />
          </span>
          <div className="stg-row-body">
            <span className="stg-row-title">Change Password</span>
          </div>
          <IoChevronForward size={17} className="stg-chevron" />
        </button>

        <div className="stg-divider" />

        {/* Account Settings */}
        <button className="stg-row" onClick={() => navigate(ROUTES.ACCOUNT_SETTINGS)}>
          <span className="stg-row-icon">
            <IoShieldCheckmarkOutline size={20} />
          </span>
          <div className="stg-row-body">
            <span className="stg-row-title">Account Settings</span>
            <span className="stg-row-sub">Manage connected accounts &amp; data</span>
          </div>
          <IoChevronForward size={17} className="stg-chevron" />
        </button>
      </div>

      {/* ── Hardware section ── */}
      <p className="stg-section-label">HARDWARE</p>
      <div className="stg-card">

        {/* Microphone */}
        <div className="stg-row stg-row--select">
          <span className="stg-row-icon">
            <IoMicOutline size={20} />
          </span>
          <div className="stg-row-body">
            <span className="stg-row-title">Microphone</span>
            <div className="stg-select-wrap">
              <select className="stg-select" value={mic} onChange={handleMicChange}>
                {microphones.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Microphone ${d.deviceId.slice(0, 6)}`}
                  </option>
                ))}
              </select>
              <IoChevronForward size={14} className="stg-select-arrow" />
            </div>
          </div>
        </div>

        <div className="stg-divider" />

        {/* Camera */}
        <div className="stg-row stg-row--select">
          <span className="stg-row-icon">
            <IoCameraOutline size={20} />
          </span>
          <div className="stg-row-body">
            <span className="stg-row-title">Camera</span>
            <div className="stg-select-wrap">
              <select className="stg-select" value={cam} onChange={handleCamChange}>
                {cameras.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
                  </option>
                ))}
              </select>
              <IoChevronForward size={14} className="stg-select-arrow" />
            </div>
          </div>
        </div>

        <div className="stg-divider" />

        {/* Test A/V */}
        <button className="stg-row" onClick={() => navigate(ROUTES.AUDIO_TEST)}>
          <span className="stg-row-icon">
            <IoHardwareChipOutline size={20} />
          </span>
          <div className="stg-row-body">
            <span className="stg-row-title">Test Audio / Video</span>
            <span className="stg-row-sub">Check your mic and camera work correctly</span>
          </div>
          <IoChevronForward size={17} className="stg-chevron" />
        </button>
      </div>

      {/* ── Log out ── */}
      <button className="stg-btn-logout" onClick={handleLogout}>
        <IoLogOutOutline size={20} />
        Log Out
      </button>

      <ConfirmationModal
        isOpen={showLogoutModal}
        title="Log out?"
        message="Are you sure you want to log out of Bigkas?"
        confirmLabel="Log Out"
        cancelLabel="Stay"
        type="danger"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={async () => { setShowLogoutModal(false); await logout(); }}
      />
    </div>
  );
}

export default SettingsPage;
