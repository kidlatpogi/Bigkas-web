import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/useAuthContext';
import './InnerPages.css';

function ChangePasswordPage() {
  const navigate = useNavigate();
  const { changePassword } = useAuthContext();

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd,     setNewPwd]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [isSaving,   setIsSaving]   = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState(false);

  // Show/hide toggles
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);

  const handleSave = async () => {
    setError('');
    if (!currentPwd || !newPwd || !confirmPwd) {
      setError('All fields are required.');
      return;
    }
    if (newPwd.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPwd !== confirmPwd) {
      setError('New passwords do not match.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await changePassword({ currentPassword: currentPwd, newPassword: newPwd });
      if (result?.success === false) {
        setError(result.error || 'Failed to change password.');
      } else {
        setSuccess(true);
        setTimeout(() => navigate(-1), 1200);
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const PwdField = ({ label, value, onChange, show, onToggle }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          className="form-input"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ paddingRight: 44 }}
        />
        <button
          type="button"
          onClick={onToggle}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#888',
          }}
          tabIndex={-1}
        >
          {show ? '🙈' : '👁️'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="inner-page">
      <div className="inner-page-header">
        <button className="inner-page-back" onClick={() => navigate(-1)}>‹</button>
        <h1 className="inner-page-title">Change Password</h1>
      </div>

      {error   && <div className="page-error">{error}</div>}
      {success && <div className="page-success">Password changed! Redirecting…</div>}

      <PwdField
        label="Current Password"
        value={currentPwd}
        onChange={setCurrentPwd}
        show={showCur}
        onToggle={() => setShowCur(v => !v)}
      />
      <PwdField
        label="New Password"
        value={newPwd}
        onChange={setNewPwd}
        show={showNew}
        onToggle={() => setShowNew(v => !v)}
      />
      <PwdField
        label="Confirm New Password"
        value={confirmPwd}
        onChange={setConfirmPwd}
        show={showCon}
        onToggle={() => setShowCon(v => !v)}
      />

      <div className="btn-row">
        <button className="btn-secondary" onClick={() => navigate(-1)} disabled={isSaving}>Cancel</button>
        <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save New Password'}
        </button>
      </div>
    </div>
  );
}

export default ChangePasswordPage;
