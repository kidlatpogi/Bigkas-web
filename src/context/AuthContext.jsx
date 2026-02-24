import { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Authentication Context — backed by Supabase Auth
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]     = useState(null);

  /* ── Build user object from Supabase session ── */
  const buildUser = (supaSession) => {
    if (!supaSession) return null;
    const u    = supaSession.user || supaSession;
    const meta = u?.user_metadata || {};
    return {
      id:         u.id,
      email:      u.email,
      name:       meta.full_name || meta.name || u.email?.split('@')[0] || 'User',
      nickname:   meta.nickname || null,
      avatar_url: meta.avatar_url || null,
      createdAt:  u.created_at,
    };
  };

  /* ── Restore session on mount ── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(buildUser(session));
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(buildUser(session));
    });

    return () => subscription.unsubscribe();
  }, []);

  /* ── Login ── */
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    if (err) { setError(err.message); return { success: false, error: err.message }; }
    return { success: true, user: buildUser(data.session) };
  }, []);

  /* ── Register ── */
  const register = useCallback(async ({ name, email, password }) => {
    setIsLoading(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setIsLoading(false);
    if (err) { setError(err.message); return { success: false, error: err.message }; }
    if (!data.session) return { success: true, requiresEmailConfirmation: true };
    return { success: true, user: buildUser(data.session) };
  }, []);

  /* ── Logout ── */
  const logout = useCallback(async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsLoading(false);
  }, []);

  /* ── Update nickname ── */
  const updateNickname = useCallback(async (nickname) => {
    const trimmed = nickname.trim();
    if (!trimmed) return { success: false, error: 'Nickname is required' };
    const { data, error: err } = await supabase.auth.updateUser({ data: { nickname: trimmed } });
    if (err) return { success: false, error: err.message };
    setUser((prev) => ({ ...prev, nickname: trimmed, ...buildUser({ user: data.user }) }));
    return { success: true };
  }, []);

  /* ── Update profile ── */
  const updateProfile = useCallback(async ({ name, avatarUrl }) => {
    const updates = {};
    if (name)       updates.full_name  = name;
    if (avatarUrl)  updates.avatar_url = avatarUrl;
    const { data, error: err } = await supabase.auth.updateUser({ data: updates });
    if (err) return { success: false, error: err.message };
    setUser(buildUser({ user: data.user }));
    return { success: true };
  }, []);

  /* ── Change password ── */
  const changePassword = useCallback(async (newPassword) => {
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    if (err) return { success: false, error: err.message };
    return { success: true };
  }, []);

  /* ── Upload avatar ── */
  const uploadAvatar = useCallback(async (file) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { success: false, error: 'Not authenticated' };
    const ext  = file.name.split('.').pop();
    const path = `${session.user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('avatars').upload(path, file, { upsert: true });
    if (upErr) return { success: false, error: upErr.message };
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    return { success: true, url: publicUrl };
  }, []);

  /* ── Delete account ── */
  const deleteAccount = useCallback(async (password) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { success: false, error: 'Not authenticated' };
    const { error: reAuthErr } = await supabase.auth.signInWithPassword({
      email: session.user.email, password,
    });
    if (reAuthErr) return { success: false, error: 'Incorrect password' };
    await supabase.from('sessions').delete().eq('user_id', session.user.id);
    await supabase.from('scripts').delete().eq('user_id', session.user.id);
    await supabase.auth.signOut();
    return { success: true };
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = {
    user, isLoading, isAuthenticated: !!user, error,
    login, logout, register, updateNickname, updateProfile,
    changePassword, uploadAvatar, deleteAccount, clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
