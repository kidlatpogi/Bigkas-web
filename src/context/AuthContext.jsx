import { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ENV } from '../config/env';

/**
 * Authentication Context — backed by Supabase Auth
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]     = useState(null);

  const resolveAvatarUrl = useCallback((avatarValue) => {
    if (!avatarValue) return null;

    if (/^https?:\/\//i.test(avatarValue)) {
      return avatarValue;
    }

    const normalizedPath = avatarValue
      .replace(/^\/+/, '')
      .replace(/^avatars\//, '');

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(normalizedPath);

    return publicUrl || null;
  }, []);

  /* ── Build user object from Supabase session ── */
  const buildUser = useCallback((supaSession) => {
    if (!supaSession) return null;
    const u    = supaSession.user || supaSession;
    const meta = u?.user_metadata || {};
    return {
      id:         u.id,
      email:      u.email,
      name:       meta.full_name || meta.name || u.email?.split('@')[0] || 'User',
      nickname:   meta.nickname || null,
      avatar_url: resolveAvatarUrl(meta.avatar_url),
      createdAt:  u.created_at,
    };
  }, [resolveAvatarUrl]);

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
  }, [buildUser]);

  /* ── Login ── */
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    if (err) { setError(err.message); return { success: false, error: err.message }; }
    return { success: true, user: buildUser(data.session) };
  }, [buildUser]);

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
  }, [buildUser]);

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
  }, [buildUser]);

  /* ── Update profile ── */
  const updateProfile = useCallback(async ({ name, full_name, nickname, avatarUrl, avatar_url }) => {
    const updates = {};
    const resolvedName = (name ?? full_name)?.trim();

    if (resolvedName) updates.full_name = resolvedName;
    if (nickname !== undefined) updates.nickname = nickname || null;
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    const { data, error: err } = await supabase.auth.updateUser({ data: updates });
    if (err) return { success: false, error: err.message };
    setUser(buildUser({ user: data.user }));
    return { success: true };
  }, [buildUser]);

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
    if (ENV.ENABLE_SESSION_PERSISTENCE) {
      const { error: sessionDeleteError } = await supabase
        .from('sessions')
        .delete()
        .eq('user_id', session.user.id);

      const missingSessionsTable = sessionDeleteError?.code === '42P01' ||
        sessionDeleteError?.status === 404 ||
        sessionDeleteError?.message?.toLowerCase().includes('relation') ||
        sessionDeleteError?.message?.toLowerCase().includes('does not exist');

      if (sessionDeleteError && !missingSessionsTable) {
        return { success: false, error: sessionDeleteError.message };
      }
    }

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
