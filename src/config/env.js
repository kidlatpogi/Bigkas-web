/**
 * Environment configuration
 * Reads from Vite environment variables
 */

export const ENV = {
  toBoolean(value, defaultValue = false) {
    if (value === undefined) return defaultValue;
    return value === 'true' || value === true;
  },
  SUPABASE_URL:      import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  API_BASE_URL:      import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  EMAILJS_SERVICE_ID:  import.meta.env.VITE_EMAILJS_SERVICE_ID,
  EMAILJS_TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  EMAILJS_PUBLIC_KEY:  import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  ENABLE_SESSION_PERSISTENCE:
    (import.meta.env.PROD && import.meta.env.VITE_ENABLE_SESSION_PERSISTENCE !== 'false') ||
    import.meta.env.VITE_ENABLE_SESSION_PERSISTENCE === 'true',
  ENABLE_DAILY_QUOTE_FETCH:
    (import.meta.env.PROD && import.meta.env.VITE_ENABLE_DAILY_QUOTE_FETCH !== 'false') ||
    import.meta.env.VITE_ENABLE_DAILY_QUOTE_FETCH === 'true',
  APP_NAME:          'Bigkas',
  IS_DEVELOPMENT:    import.meta.env.DEV,
  IS_PRODUCTION:     import.meta.env.PROD,
};

export default ENV;
