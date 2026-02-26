import emailjs from '@emailjs/browser';
import { ENV } from '../config/env';

/**
 * Initialize EmailJS with public key
 */
export function initEmailJS() {
  if (ENV.EMAILJS_PUBLIC_KEY) {
    emailjs.init(ENV.EMAILJS_PUBLIC_KEY);
  }
}

/**
 * Send verification email via EmailJS
 * @param {string} email - Recipient email
 * @param {string} verificationLink - Full verification link (from Supabase)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendVerificationEmail(email, verificationLink) {
  if (!ENV.EMAILJS_SERVICE_ID || !ENV.EMAILJS_TEMPLATE_ID) {
    console.error('EmailJS credentials missing. Check .env file.');
    return {
      success: false,
      error: 'Email service not configured. Contact support.',
    };
  }

  try {
    const response = await emailjs.send(
      ENV.EMAILJS_SERVICE_ID,
      ENV.EMAILJS_TEMPLATE_ID,
      {
        to_email: email,
        verification_link: verificationLink,
        user_name: email.split('@')[0],
      },
      ENV.EMAILJS_PUBLIC_KEY
    );

    if (response.status === 200) {
      return { success: true };
    }

    return {
      success: false,
      error: 'Failed to send verification email.',
    };
  } catch (error) {
    console.error('EmailJS error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send verification email.',
    };
  }
}
