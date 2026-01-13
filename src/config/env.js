/**
 * Environment configuration
 * Reads from Vite environment variables
 */

export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  API_TIMEOUT: import.meta.env.VITE_API_TIMEOUT || 30000,
  APP_NAME: 'Bigkas Web',
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
};

export default ENV;
