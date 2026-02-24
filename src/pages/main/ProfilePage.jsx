import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/useAuthContext';
import { ROUTES } from '../../utils/constants';
import './InnerPages.css';

function ProfilePage() {
  const navigate  = useNavigate();
  const { user, logout, uploadAvatar } = useAuthContext();
  const fileRef   = useRef(null);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (user?.nickname?.[0] || 'U').toUpperCase();

  const handleAvatarClick = () => fileRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (typeof uploadAvatar === 'function') {
      await uploadAvatar(file);
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
        <h1 className="inner-page-title">Profile</h1>
      </div>

      {/* Avatar */}
      <div className="avatar-wrap">
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt="Avatar" className="avatar-img" />
        ) : (
          <div className="avatar-placeholder">{initials}</div>
        )}
        <button className="avatar-edit-btn" onClick={handleAvatarClick}>📷</button>
        <input
          type="file"
          ref={fileRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleAvatarChange}
        />
      </div>

      {/* Name & email */}
      <div className="page-card" style={{ textAlign: 'center', marginBottom: 16 }}>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#010101', margin: '0 0 4px' }}>
          {user?.name || user?.nickname || 'User'}
        </p>
        <p style={{ fontSize: 14, color: '#888', margin: 0 }}>{user?.email}</p>
        {user?.nickname && (
          <p style={{ fontSize: 13, color: '#FBAF00', fontWeight: 600, margin: '4px 0 0' }}>
            @{user.nickname}
          </p>
        )}
      </div>

      {/* Navigation rows */}
      <div className="page-card">
        <div
          className="chevron-row"
          onClick={() => navigate(ROUTES.EDIT_PROFILE)}
          style={{ cursor: 'pointer' }}
        >
          <span className="chevron-row-label">Edit Profile</span>
          <span className="chevron-row-arrow">›</span>
        </div>
        <div
          className="chevron-row"
          onClick={() => navigate(ROUTES.CHANGE_PASSWORD)}
          style={{ cursor: 'pointer' }}
        >
          <span className="chevron-row-label">Change Password</span>
          <span className="chevron-row-arrow">›</span>
        </div>
        <div
          className="chevron-row"
          onClick={() => navigate(ROUTES.ACCOUNT_SETTINGS)}
          style={{ cursor: 'pointer' }}
        >
          <span className="chevron-row-label">Account Settings</span>
          <span className="chevron-row-arrow">›</span>
        </div>
      </div>

      {/* Logout */}
      <button
        className="btn-danger"
        style={{ width: '100%', marginTop: 24 }}
        onClick={handleLogout}
      >
        Log Out
      </button>
    </div>
  );
}

export default ProfilePage;


