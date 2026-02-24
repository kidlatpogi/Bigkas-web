import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/useAuthContext';
import './InnerPages.css';
import './EditProfilePage.css';

function EditProfilePage() {
  const navigate  = useNavigate();
  const { user, updateProfile, uploadAvatar } = useAuthContext();

  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] || '');
  const [lastName,  setLastName]  = useState(user?.name?.split(' ').slice(1).join(' ') || '');
  const [nickname,  setNickname]  = useState(user?.nickname || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSaving, setIsSaving]   = useState(false);
  const [error,    setError]      = useState('');
  const [success,  setSuccess]    = useState(false);
  const fileRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setError('');
    setIsSaving(true);
    try {
      let newAvatarUrl = user?.avatar_url || '';
      if (avatarFile && typeof uploadAvatar === 'function') {
        const result = await uploadAvatar(avatarFile);
        if (result?.success) newAvatarUrl = result.url;
      }

      const result = await updateProfile({
        full_name:  `${firstName.trim()} ${lastName.trim()}`.trim(),
        nickname:   nickname.trim() || user?.nickname,
        avatar_url: newAvatarUrl,
      });

      if (result?.success === false) {
        setError(result.error || 'Failed to save changes.');
      } else {
        setSuccess(true);
        setTimeout(() => navigate(-1), 800);
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';

  return (
    <div className="inner-page">
      {/* Header */}
      <div className="inner-page-header">
        <button className="inner-page-back" onClick={() => navigate(-1)}>‹</button>
        <h1 className="inner-page-title">Edit Profile</h1>
      </div>

      {error   && <div className="page-error">{error}</div>}
      {success && <div className="page-success">Profile updated!</div>}

      {/* Avatar */}
      <div className="avatar-wrap">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="avatar-img" />
        ) : (
          <div className="avatar-placeholder">{initials}</div>
        )}
        <button className="avatar-edit-btn" onClick={() => fileRef.current?.click()}>📷</button>
        <input
          type="file"
          ref={fileRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleAvatarChange}
        />
      </div>

      {/* Name row */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">First Name</label>
          <input
            className="form-input"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Last Name</label>
          <input
            className="form-input"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
          />
        </div>
      </div>

      {/* Nickname */}
      <div className="form-group">
        <label className="form-label">Nickname</label>
        <input
          className="form-input"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Your display name"
        />
      </div>

      {/* Email — read only */}
      <div className="form-group">
        <label className="form-label">Email (read-only)</label>
        <input className="form-input" value={user?.email || ''} disabled />
      </div>

      {/* Actions */}
      <div className="btn-row">
        <button className="btn-secondary" onClick={() => navigate(-1)} disabled={isSaving}>Cancel</button>
        <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

export default EditProfilePage;
