/**
 * Application constants
 */

// Route paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  NICKNAME: '/nickname',
  DASHBOARD: '/dashboard',
  PRACTICE: '/practice',
  HISTORY: '/history',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  SESSION_DETAIL: '/session/:sessionId',
  SESSION_RESULT: '/session/:sessionId/result',
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_PREFERENCES: 'userPreferences',
  THEME: 'theme',
};

// API endpoints (relative to base URL)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
  },
  SESSIONS: {
    BASE: '/sessions',
    DETAIL: (id) => `/sessions/${id}`,
    AUDIO: (id) => `/sessions/${id}/audio`,
    RESULTS: (id) => `/sessions/${id}/results`,
  },
};

// Audio recording settings
export const AUDIO_CONFIG = {
  SAMPLE_RATE: 44100,
  CHANNELS: 1,
  MIME_TYPE: 'audio/webm;codecs=opus',
  MAX_DURATION_MS: 300000, // 5 minutes
};

// UI Constants
export const UI = {
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
  PAGE_SIZE: 10,
};
