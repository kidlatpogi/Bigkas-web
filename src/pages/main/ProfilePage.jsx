import { useState } from 'react';
import { useAuthContext } from '../../context/useAuthContext';
import Card from '../../components/common/Card';
import PrimaryButton from '../../components/common/PrimaryButton';
import './MainPages.css';

/**
 * Profile Page Component
 * User account settings and information
 */
function ProfilePage() {
  const { user, logout, isLoading } = useAuthContext();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    // TODO: Implement profile update API call
    console.log('Saving profile:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
    });
    setIsEditing(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account settings</p>
      </div>

      <div className="profile-content">
        <Card className="profile-card">
          <div className="profile-avatar">
            <div className="avatar-placeholder">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>

          <div className="profile-form">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div className="profile-actions">
              {isEditing ? (
                <>
                  <PrimaryButton variant="secondary" onClick={handleCancel}>
                    Cancel
                  </PrimaryButton>
                  <PrimaryButton onClick={handleSave}>
                    Save Changes
                  </PrimaryButton>
                </>
              ) : (
                <PrimaryButton onClick={() => setIsEditing(true)}>
                  Edit Profile
                </PrimaryButton>
              )}
            </div>
          </div>
        </Card>

        <Card className="profile-card danger-zone">
          <h2 className="card-title">Account Actions</h2>
          <div className="account-actions">
            <PrimaryButton 
              variant="danger" 
              onClick={handleLogout}
              disabled={isLoading}
            >
              {isLoading ? 'Logging out...' : 'Log Out'}
            </PrimaryButton>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ProfilePage;
