/**
 * sessionApi.js — Supabase-based session data access.
 * Used by components that fetch session data outside of SessionContext.
 */
import { supabase } from '../lib/supabase';
import { ENV } from '../config/env';

function emptyResult() {
  return { data: [], error: null, count: 0 };
}

function isSessionsTableMissing(error) {
  if (!error) return false;
  const message = error.message?.toLowerCase() || '';
  return error.code === '42P01' || error?.status === 404 || message.includes('relation') || message.includes('does not exist');
}

export const sessionApi = {
  async getSessions(userId, { page = 1, limit = 10 } = {}) {
    if (!ENV.ENABLE_SESSION_PERSISTENCE) return emptyResult();

    const from = (page - 1) * limit;
    const result = await supabase
      .from('sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (isSessionsTableMissing(result.error)) return emptyResult();
    return result;
  },
  async getSession(sessionId) {
    if (!ENV.ENABLE_SESSION_PERSISTENCE) return { data: null, error: null };
    const result = await supabase.from('sessions').select('*').eq('id', sessionId).single();
    if (isSessionsTableMissing(result.error)) return { data: null, error: null };
    return result;
  },
  async deleteSession(sessionId) {
    if (!ENV.ENABLE_SESSION_PERSISTENCE) return { data: null, error: null };
    const result = await supabase.from('sessions').delete().eq('id', sessionId);
    if (isSessionsTableMissing(result.error)) return { data: null, error: null };
    return result;
  },
};

export default sessionApi;
