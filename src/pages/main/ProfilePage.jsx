import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/useAuthContext';
import { ROUTES } from '../../utils/constants';
import { supabase } from '../../lib/supabase';
import BackButton from '../../components/common/BackButton';
import './ProfilePage.css';

/* ── Inline SVG icons ── */
const CameraIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const ChevronIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const fileRef  = useRef(null);

  const [avatarMenuOpen,  setAvatarMenuOpen]  = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [isSaving,        setIsSaving]        = useState(false);
  const [errors,          setErrors]          = useState({});

  const meta = user?.user_metadata ?? {};

  const [formData, setFormData] = useState({
    firstName: meta.first_name  || user?.name?.split(' ')[0] || '',
    lastName:  meta.last_name   || user?.name?.split(' ').slice(1).join(' ') || '',
    nickname:  meta.nickname    || user?.nickname || '',
    email:     user?.email      || '',
    avatarUri: meta.avatar_url  || null,
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  /* ── Avatar ── */
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Immediate local preview
    setFormData(prev => ({ ...prev, avatarUri: URL.createObjectURL(file) }));
    setAvatarMenuOpen(false);
    setAvatarUploading(true);
    try {
      const ext  = file.name.split('.').pop().toLowerCase();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
        setFormData(prev => ({ ...prev, avatarUri: publicUrl }));
        await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setFormData(prev => ({ ...prev, avatarUri: null }));
    setAvatarMenuOpen(false);
    await supabase.auth.updateUser({ data: { avatar_url: null } });
  };

  /* ── Save / Cancel ── */
  const handleSaveChanges = async () => {
    if (!formData.firstName.trim()) {
      setErrors({ firstName: 'First name is required' });
      return;
    }
    setIsSaving(true);
    try {
      await supabase.auth.updateUser({
        data: {
          first_name: formData.firstName.trim(),
          last_name:  formData.lastName.trim(),
          full_name:  `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
          nickname:   formData.nickname.trim(),
          avatar_url: formData.avatarUri,
        },
      });
      navigate(-1);
    } catch {
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    const m = user?.user_metadata ?? {};
    setFormData({
      firstName: m.first_name || user?.name?.split(' ')[0] || '',
      lastName:  m.last_name  || user?.name?.split(' ').slice(1).join(' ') || '',
      nickname:  m.nickname   || user?.nickname || '',
      email:     user?.email  || '',
      avatarUri: m.avatar_url || null,
    });
    setErrors({});
  };

  const initials = formData.firstName
    ? `${formData.firstName[0]}${formData.lastName?.[0] || ''}`.toUpperCase()
    : (user?.email?.[0] || 'U').toUpperCase();

  return (
    <div className="profile-page" onClick={() => setAvatarMenuOpen(false)}>
      {/* Header */}
      <div className="profile-header">
        <BackButton />
        <h1 className="profile-title">Edit Profile</h1>
      </div>

      {/* AvatarPicker */}
      <div className="profile-avatar-section">
        <div className="profile-avatar-wrap" onClick={e => e.stopPropagation()}>
          <button
            className="profile-avatar-btn"
            onClick={() => setAvatarMenuOpen(o => !o)}
            type="button"
          >
            {formData.avatarUri ? (
              <img src={formData.avatarUri} alt="Avatar" className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-placeholder">{initials}</div>
            )}
            <div className="profile-avatar-overlay">
              <CameraIcon size={22} />
            </div>
          </button>

          {avatarUploading && (
            <p className="profile-avatar-status">Uploading…</p>
          )}

          {/* Context menu */}
          {avatarMenuOpen && (
            <div className="profile-avatar-menu">
              {formData.avatarUri ? (
                <>
                  <button
                    className="profile-avatar-menu-item"
                    onClick={() => { fileRef.current?.click(); setAvatarMenuOpen(false); }}
                  >
                    Change Profile Picture
                  </button>
                  <button
                    className="profile-avatar-menu-item danger"
                    onClick={handleRemoveAvatar}
                  >
                    Remove Profile Picture
                  </button>
                </>
              ) : (
                <button
                  className="profile-avatar-menu-item"
                  onClick={() => { fileRef.current?.click(); setAvatarMenuOpen(false); }}
                >
                  Add Profile Picture
                </button>
              )}
            </div>
          )}
        </div>

        <input
          type="file"
          ref={fileRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {/* Form */}
      <div className="profile-form">
        {/* First + Last name row */}
        <div className="profile-name-row">
          <div className="profile-field">
            <label className="profile-label">FIRST NAME</label>
            <input
              className={`profile-input${errors.firstName ? ' input-error' : ''}`}
              value={formData.firstName}
              onChange={e => updateField('firstName', e.target.value)}
              placeholder="First name"
            />
            {errors.firstName && (
              <span className="profile-error-msg">{errors.firstName}</span>
            )}
          </div>
          <div className="profile-field">
            <label className="profile-label">LAST NAME</label>
            <input
              className="profile-input"
              value={formData.lastName}
              onChange={e => updateField('lastName', e.target.value)}
              placeholder="Last name"
            />
          </div>
        </div>

        {/* Email */}
        <div className="profile-field">
          <label className="profile-label">EMAIL ADDRESS</label>
          <input
            className="profile-input profile-input-readonly"
            value={formData.email}
            readOnly
          />
        </div>

        {/* Nickname */}
        <div className="profile-field">
          <label className="profile-label">NICKNAME</label>
          <input
            className="profile-input"
            value={formData.nickname}
            onChange={e => updateField('nickname', e.target.value)}
            placeholder="@nickname"
          />
        </div>

        {/* Chevron rows */}
        <button
          className="profile-setting-row"
          type="button"
          onClick={() => navigate(ROUTES.CHANGE_PASSWORD)}
        >
          <span>Change Password</span>
          <ChevronIcon />
        </button>
        <button
          className="profile-setting-row"
          type="button"
          onClick={() => navigate(ROUTES.ACCOUNT_SETTINGS)}
        >
          <span>Account Settings</span>
          <ChevronIcon />
        </button>

        {/* Action buttons */}
        <button
          className="profile-btn-save"
          type="button"
          onClick={handleSaveChanges}
          disabled={isSaving}
        >
          {isSaving ? 'Saving…' : 'Save Changes'}
        </button>
        <button
          className="profile-btn-cancel"
          type="button"
          onClick={handleCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default ProfilePage;


