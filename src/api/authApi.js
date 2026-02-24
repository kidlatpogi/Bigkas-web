/**
 * authApi.js — thin wrappers around supabase.auth for components that prefer a named API.
 * Most auth logic now lives in AuthContext.jsx.
 */
import { supabase } from '../lib/supabase';

export const authApi = {
  login:  (email, password) => supabase.auth.signInWithPassword({ email, password }),
  register: (email, password, name) =>
    supabase.auth.signUp({ email, password, options: { data: { full_name: name } } }),
  logout: () => supabase.auth.signOut(),
  getSession: () => supabase.auth.getSession(),
  getUser: () => supabase.auth.getUser(),
  updateUser: (updates) => supabase.auth.updateUser(updates),
};

export default authApi;
