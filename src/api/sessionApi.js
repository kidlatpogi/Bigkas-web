import apiClient from './client';

/**
 * Session/Practice API endpoints
 */

export const sessionApi = {
  /**
   * Get all sessions for current user
   * @param {Object} params - Query params (page, limit, etc.)
   * @returns {Promise} List of sessions
   */
  getSessions: async (params = {}) => {
    const response = await apiClient.get('/sessions', { params });
    return response.data;
  },

  /**
   * Get a specific session by ID
   * @param {string} sessionId 
   * @returns {Promise} Session data
   */
  getSession: async (sessionId) => {
    const response = await apiClient.get(`/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Create a new practice session
   * @param {Object} sessionData 
   * @returns {Promise} Created session
   */
  createSession: async (sessionData) => {
    const response = await apiClient.post('/sessions', sessionData);
    return response.data;
  },

  /**
   * Submit audio recording for a session
   * @param {string} sessionId 
   * @param {Blob} audioBlob 
   * @returns {Promise} Analysis results
   */
  submitAudio: async (sessionId, audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    
    const response = await apiClient.post(`/sessions/${sessionId}/audio`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get session results/analysis
   * @param {string} sessionId 
   * @returns {Promise} Results data
   */
  getSessionResults: async (sessionId) => {
    const response = await apiClient.get(`/sessions/${sessionId}/results`);
    return response.data;
  },

  /**
   * Delete a session
   * @param {string} sessionId 
   * @returns {Promise}
   */
  deleteSession: async (sessionId) => {
    const response = await apiClient.delete(`/sessions/${sessionId}`);
    return response.data;
  },
};

export default sessionApi;
