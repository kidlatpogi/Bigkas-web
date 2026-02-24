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
