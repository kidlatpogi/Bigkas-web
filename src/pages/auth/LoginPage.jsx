import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/useAuthContext';
import { isValidEmail } from '../../utils/validators';
import { ROUTES } from '../../utils/constants';
import googleLogo from '../../assets/Google-Logo.png';
import BackButton from '../../components/common/BackButton';
import ThemeToggleBtn from '../../components/common/ThemeToggleBtn';
import './AuthPages.css';

/**
 * Login Page — 1:1 from Figma screenshot
 * Split layout: left branding panel + right form panel
 */
function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, isLoading } = useAuthContext();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate(ROUTES.DASHBOARD);
    } else {
      setErrors({ submit: result.error });
    }
  };

  const handleGoogleSignIn = async () => {
    const result = await loginWithGoogle();
    if (!result?.success) {
      setErrors((prev) => ({
        ...prev,
        submit: result?.error || 'Google sign-in failed. Please try again.',
      }));
    }
  };

  return (
    <div className="auth-page">
      <ThemeToggleBtn />
      {/* ── Left branding panel ── */}
      <div className="auth-brand-panel">
        <BackButton onClick={() => navigate(ROUTES.HOME)} />

        <div className="auth-brand-content">
          <h1 className="auth-brand-name">BIGKAS</h1>
          <p className="auth-brand-tagline">PUBLIC SPEAKING COACH</p>
          <div className="auth-brand-line" />

          <ul className="auth-brand-features">
            <li>
              <span className="feature-num">01</span>
              <span className="feature-text">SPEECH ANALYSIS</span>
            </li>
            <li>
              <span className="feature-num">02</span>
              <span className="feature-text">CONFIDENCE SCORING</span>
            </li>
            <li>
              <span className="feature-num">03</span>
              <span className="feature-text">RHETORIC DESIGN</span>
            </li>
          </ul>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <h2 className="auth-form-title">LOG IN</h2>

          <form className="auth-form" onSubmit={handleSubmit}>
            {errors.submit && (
              <div className="auth-error-banner">{errors.submit}</div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">EMAIL ADDRESS</label>
              <input
                type="email"
                id="email"
                name="email"
                className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                value={formData.email}
                onChange={handleChange}
                placeholder="name@gmail.com"
                disabled={isLoading}
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">PASSWORD</label>
              <input
                type="password"
                id="password"
                name="password"
                className={`form-input ${errors.password ? 'form-input-error' : ''}`}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={isLoading}
              />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'LOGGING IN...' : 'LOG IN'}
            </button>
          </form>

          <Link to="#" className="auth-forgot-link">FORGOT PASSWORD?</Link>

          <div className="auth-divider">
            <span className="auth-divider-line" />
            <span className="auth-divider-text">or</span>
            <span className="auth-divider-line" />
          </div>

          <button type="button" className="auth-google-btn" onClick={handleGoogleSignIn} disabled={isLoading}>
            <img src={googleLogo} alt="Google" className="auth-google-logo" />
            Continue with Google
          </button>

          <div className="auth-footer">
            <p className="auth-footer-label">ALREADY HAVE AN ACCOUNT?</p>
            <Link to={ROUTES.REGISTER} className="auth-link">CREATE AN ACCOUNT</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
