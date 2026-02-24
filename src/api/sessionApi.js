/**
 * sessionApi.js — Supabase-based session data access.
 * Used by components that fetch session data outside of SessionContext.
 */
import { supabase } from '../lib/supabase';

export const sessionApi = {
  async getSessions(userId, { page = 1, limit = 10 } = {}) {
    const from = (page - 1) * limit;
    return supabase
      .from('sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);
  },
  async getSession(sessionId) {
    return supabase.from('sessions').select('*').eq('id', sessionId).single();
  },
  async deleteSession(sessionId) {
    return supabase.from('sessions').delete().eq('id', sessionId);
  },
};

export default sessionApi;

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
