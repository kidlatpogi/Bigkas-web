import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/useAuthContext';
import './InnerPages.css';
import './AccountSettingsPage.css';

function AccountSettingsPage() {
  const navigate = useNavigate();
  const { logout, deleteAccount } = useAuthContext();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText,     setConfirmText]     = useState('');
  const [password,        setPassword]        = useState('');
  const [isDeleting,      setIsDeleting]      = useState(false);
  const [error,           setError]           = useState('');

  const handleDelete = async () => {
    if (confirmText !== 'CONFIRM DELETE') {
      setError('Please type CONFIRM DELETE to proceed.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    setError('');
    setIsDeleting(true);
    try {
      const result = await deleteAccount({ password });
      if (result?.success === false) {
        setError(result.error || 'Failed to delete account.');
        setIsDeleting(false);
      }
      // On success, AuthContext will auto-redirect to login
    } catch {
      setError('An unexpected error occurred.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="inner-page">
      <div className="inner-page-header">
        <button className="inner-page-back" onClick={() => navigate(-1)}>‹</button>
        <h1 className="inner-page-title">Account Settings</h1>
      </div>

      {/* Deactivate section */}
      <div className="page-card account-section">
        <p className="account-section-title">Deactivate Profile</p>
        <p className="account-section-desc">
          Temporarily deactivate your account. Your data will be preserved and you can reactivate by logging back in.
        </p>
        <button className="btn-outline" onClick={logout}>
          Deactivate Account
        </button>
      </div>

      {/* Delete section */}
      <div className="page-card account-section danger-zone">
        <p className="account-section-title danger">Delete Account</p>
        <p className="account-section-desc">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button className="btn-danger" onClick={() => setShowDeleteModal(true)}>
          Delete Account
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => { setShowDeleteModal(false); setError(''); }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Delete Account</h2>
            <p className="modal-desc">
              This is permanent. Please enter your password and type{' '}
              <strong>CONFIRM DELETE</strong> to continue.
            </p>

            {error && <div className="page-error" style={{ marginBottom: 12 }}>{error}</div>}

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your current password"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Type: CONFIRM DELETE</label>
              <input
                className="form-input"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="CONFIRM DELETE"
              />
            </div>

            <div className="btn-row">
              <button className="btn-secondary" onClick={() => { setShowDeleteModal(false); setError(''); }}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountSettingsPage;
