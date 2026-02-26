import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ROUTES } from '../../utils/constants';
import bigkasLogo from '../../assets/Temporary Logo.png';
import './AuthPages.css';

/**
 * Email Verification Callback Page
 * Handles the email verification link from Supabase
 */
function VerifyEmailPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('Checking your verification link...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Supabase automatically verifies the user when they visit
        // the link in the email. We just need to check the session.
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user?.email_confirmed_at) {
          setStatus('success');
          setMessage('Email Verified. You can safely close this page now.');
        } else {
          setStatus('error');
          setMessage('Email verification failed. Please try the link again or request a new verification email.');
        }
      } catch (error) {
        setStatus('error');
        setMessage(error.message || 'An error occurred during verification.');
      }
    };

    verifyEmail();
  }, [navigate]);

  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          <img src={bigkasLogo} alt="Bigkas Logo" className="verify-logo" />
          <h1 className="auth-brand-name">BIGKAS</h1>
          <p className="auth-brand-tagline">PUBLIC SPEAKING COACH</p>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container verify-status-card">
          {status === 'verifying' && (
            <>
              <h2 className="auth-form-title">VERIFYING EMAIL</h2>
              <p className="verify-status-text">Please wait...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <h2 className="auth-form-title verify-status-success">EMAIL VERIFIED</h2>
              <p className="verify-status-text">{message}</p>
              <button
                type="button"
                className="auth-submit-btn"
                onClick={() => navigate(ROUTES.LOGIN)}
              >
                Go to Login
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <h2 className="auth-form-title verify-status-error">VERIFICATION ERROR</h2>
              <p className="verify-status-text">{message}</p>
              <button
                type="button"
                className="auth-submit-btn"
                onClick={() => navigate(ROUTES.LOGIN)}
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailPage;
