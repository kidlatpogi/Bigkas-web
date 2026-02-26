import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { isValidEmail } from '../../utils/validators';
import { ROUTES } from '../../utils/constants';
import BackButton from '../../components/common/BackButton';
import ThemeToggleBtn from '../../components/common/ThemeToggleBtn';
import './AuthPages.css';

/**
 * Forgot Password Page
 * Allows users to request a password reset link sent to their email.
 * Uses Supabase Auth's built-in resetPasswordForEmail which sends via Brevo SMTP.
 */
function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email is required');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email');
      return;
    }

    setIsLoading(true);

    const redirectTo = `${window.location.origin}/settings/change-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo,
    });

    setIsLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSuccess(true);
  };

  return (
    <div className="auth-page">
      <ThemeToggleBtn />
      {/* ── Left branding panel ── */}
      <div className="auth-brand-panel">
        <BackButton onClick={() => navigate(ROUTES.LOGIN)} />

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
          <h2 className="auth-form-title">FORGOT PASSWORD</h2>

          {success ? (
            <div className="forgot-success">
              <div className="forgot-success-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="23" stroke="#FBAF00" strokeWidth="2" />
                  <path d="M14 24l7 7 13-13" stroke="#FBAF00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="forgot-success-title">CHECK YOUR EMAIL</h3>
              <p className="forgot-success-text">
                We&apos;ve sent a password reset link to{' '}
                <strong>{email.trim()}</strong>. Please check your inbox
                and follow the instructions to reset your password.
              </p>
              <p className="forgot-success-note">
                Didn&apos;t receive the email? Check your spam folder or try again.
              </p>

              <button
                type="button"
                className="auth-submit-btn"
                onClick={() => { setSuccess(false); setError(null); }}
              >
                TRY AGAIN
              </button>

              <div className="auth-footer" style={{ marginTop: 24 }}>
                <p className="auth-footer-label">REMEMBER YOUR PASSWORD?</p>
                <Link to={ROUTES.LOGIN} className="auth-link">BACK TO LOG IN</Link>
              </div>
            </div>
          ) : (
            <>
              <p className="forgot-description">
                Enter the email address associated with your account and
                we&apos;ll send you a link to reset your password.
              </p>

              <form className="auth-form" onSubmit={handleSubmit}>
                {error && (
                  <div className="auth-error-banner">{error}</div>
                )}

                <div className="form-group">
                  <label htmlFor="reset-email" className="form-label">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    id="reset-email"
                    name="email"
                    className={`form-input ${error ? 'form-input-error' : ''}`}
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    placeholder="name@gmail.com"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? 'SENDING...' : 'SEND RESET LINK'}
                </button>
              </form>

              <div className="auth-footer" style={{ marginTop: 24 }}>
                <p className="auth-footer-label">REMEMBER YOUR PASSWORD?</p>
                <Link to={ROUTES.LOGIN} className="auth-link">BACK TO LOG IN</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
