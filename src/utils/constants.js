/**
 * Application constants
 */

// Route paths
export const ROUTES = {
  HOME:               '/',
  LOGIN:              '/login',
  REGISTER:           '/register',
  NICKNAME:           '/nickname',
  // Main
  DASHBOARD:          '/dashboard',
  PRACTICE:           '/practice',
  TRAINING_SETUP:     '/training/setup',
  TRAINING:           '/training',
  SCRIPTS:            '/scripts',
  SCRIPT_EDITOR:      '/scripts/editor',
  SCRIPT_EDITOR_EDIT: '/scripts/editor/:scriptId',
  GENERATE_SCRIPT:    '/scripts/generate',
  HISTORY:            '/history',
  ALL_SESSIONS:       '/sessions',
  PROGRESS:           '/progress',
  PROFILE:            '/profile',
  EDIT_PROFILE:       '/profile/edit',
  SETTINGS:           '/settings',
  CHANGE_PASSWORD:    '/settings/change-password',
  ACCOUNT_SETTINGS:   '/settings/account',
  // Session
  SESSION_DETAIL:     '/session/:sessionId',
  SESSION_RESULT:     '/session/:sessionId/result',
  DETAILED_FEEDBACK:  '/session/:sessionId/feedback',
};

// Helper to build paths with params
export const buildRoute = {
  sessionDetail:    (id) => `/session/${id}`,
  sessionResult:    (id) => `/session/${id}/result`,
  detailedFeedback: (id) => `/session/${id}/feedback`,
  scriptEditor:     (id) => `/scripts/editor/${id}`,
};

// UI Constants
export const UI = {
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
  PAGE_SIZE: 10,
};

// Score tiers
export const SCORE_TIER = {
  excellent: { min: 85, label: 'Excellent',  color: '#34C759' },
  good:      { min: 65, label: 'Good',       color: '#FBAF00' },
  fair:      { min: 45, label: 'Fair',       color: '#FF9500' },
  poor:      { min: 0,  label: 'Needs Work', color: '#FF3B30' },
};

export function getScoreTier(score) {
  if (score >= 85) return SCORE_TIER.excellent;
  if (score >= 65) return SCORE_TIER.good;
  if (score >= 45) return SCORE_TIER.fair;
  return SCORE_TIER.poor;
}


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
