import apiClient from './client';

/**
 * Authentication API endpoints
 */

export const authApi = {
  /**
   * Login user with email and password
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise} User data and token
   */
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  /**
   * Register a new user
   * @param {Object} userData - { email, password, name, ... }
   * @returns {Promise} Created user data
   */
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Logout current user
   * @returns {Promise}
   */
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  /**
   * Get current authenticated user
   * @returns {Promise} User data
   */
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  /**
   * Refresh authentication token
   * @returns {Promise} New token
   */
  refreshToken: async () => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },
};

export default authApi;
