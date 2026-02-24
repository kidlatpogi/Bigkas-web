/**
 * scriptsApi.js — Supabase-based scripts data access.
 */
import { supabase } from '../lib/supabase';

export const scriptsApi = {
  async getScripts(userId, type = null) {
    let query = supabase
      .from('scripts')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (type) query = query.eq('type', type);
    return query;
  },

  async getScript(scriptId) {
    return supabase.from('scripts').select('*').eq('id', scriptId).single();
  },

  async createScript({ userId, title, content, type = 'self-authored' }) {
    return supabase.from('scripts').insert({
      user_id: userId,
      title,
      content,
      type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select().single();
  },

  async updateScript(scriptId, { title, content }) {
    return supabase.from('scripts').update({
      title,
      content,
      updated_at: new Date().toISOString(),
    }).eq('id', scriptId).select().single();
  },

  async deleteScript(scriptId) {
    return supabase.from('scripts').delete().eq('id', scriptId);
  },
};

export default scriptsApi;
