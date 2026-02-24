/**
 * Environment configuration
 * Reads from Vite environment variables
 */

export const ENV = {
  SUPABASE_URL:      import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  API_BASE_URL:      import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  APP_NAME:          'Bigkas',
  IS_DEVELOPMENT:    import.meta.env.DEV,
  IS_PRODUCTION:     import.meta.env.PROD,
};

export default ENV;
