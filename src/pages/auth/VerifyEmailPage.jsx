import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ROUTES } from '../../utils/constants';
import './AuthPages.css';

/**
 * Email Verification Callback Page
 * Handles the email verification link from Supabase
 */
function VerifyEmailPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Supabase automatically verifies the user when they visit
        // the link in the email. We just need to check the session.
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user?.email_confirmed_at) {
          setStatus('success');
          setMessage('Email verified successfully! Redirecting to login...');
          setTimeout(() => {
            navigate(ROUTES.LOGIN);
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Email verification failed. Please try again.');
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
          <h1 className="auth-brand-name">BIGKAS</h1>
          <p className="auth-brand-tagline">PUBLIC SPEAKING COACH</p>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container" style={{ textAlign: 'center' }}>
          {status === 'verifying' && (
            <>
              <h2 className="auth-form-title">Verifying Email</h2>
              <p style={{ marginTop: '20px', fontSize: '16px' }}>Please wait...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <h2 className="auth-form-title" style={{ color: '#4ade80' }}>✓ Success</h2>
              <p style={{ marginTop: '20px', fontSize: '16px' }}>{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <h2 className="auth-form-title" style={{ color: '#ef4444' }}>✗ Error</h2>
              <p style={{ marginTop: '20px', fontSize: '16px' }}>{message}</p>
              <button
                type="button"
                className="auth-submit-btn"
                onClick={() => navigate(ROUTES.LOGIN)}
                style={{ marginTop: '20px' }}
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
