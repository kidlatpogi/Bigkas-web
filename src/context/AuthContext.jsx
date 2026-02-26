import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ENV } from '../config/env';

/**
 * Authentication Context — backed by Supabase Auth
 */
const AuthContext = createContext(null);
const SIGNUP_COOLDOWN_KEY = 'bigkas_signup_cooldown_until';

function getWebRedirectPath(path = '/') {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}${path}`;
}

function getSignupCooldownUntil() {
  if (typeof window === 'undefined') return 0;
  const stored = Number(window.localStorage.getItem(SIGNUP_COOLDOWN_KEY) || 0);
  return Number.isFinite(stored) ? stored : 0;
}

function setSignupCooldownUntil(untilTs) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SIGNUP_COOLDOWN_KEY, String(untilTs));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingEmailVerification, setPendingEmailVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(null);
  const signupCooldownUntilRef = useRef(0);

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
    const u = supaSession.user || supaSession;
    const meta = u?.user_metadata || {};
    const fullName = meta.full_name || meta.name || u.email?.split('@')[0] || 'User';
    const fallbackFirst = fullName.split(' ')[0] || '';
    const fallbackLast = fullName.split(' ').slice(1).join(' ');

    return {
      id: u.id,
      email: u.email,
      name: fullName,
      firstName: meta.first_name || fallbackFirst,
      lastName: meta.last_name || fallbackLast,
      nickname: meta.nickname || null,
      avatar_url: resolveAvatarUrl(meta.avatar_url),
      createdAt: u.created_at,
    };
  }, [resolveAvatarUrl]);

  /* ── Restore session on mount ── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(buildUser(session));
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = buildUser(session);
      const emailConfirmed = !!session?.user?.email_confirmed_at;

      if (session?.user && !emailConfirmed) {
        setPendingEmailVerification(true);
        setPendingEmail(session.user.email || null);
        setUser(null);
        await supabase.auth.signOut();
        return;
      }

      setPendingEmailVerification(false);
      setPendingEmail(null);
      setUser(nextUser);
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

    const emailConfirmed = !!data.user?.email_confirmed_at;
    if (!emailConfirmed) {
      setPendingEmailVerification(true);
      setPendingEmail(email);
      setError('Please verify your email address before logging in.');
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'Please verify your email address before logging in.',
        requiresEmailConfirmation: true,
      };
    }

    setPendingEmailVerification(false);
    setPendingEmail(null);
    return { success: true, user: buildUser(data.session) };
  }, [buildUser]);

  /* ── Register ── */
  const register = useCallback(async ({ name, firstName, lastName, email, password }) => {
    const cooldownUntil = Math.max(signupCooldownUntilRef.current, getSignupCooldownUntil());
    const remainingMs = cooldownUntil - Date.now();
    if (remainingMs > 0) {
      const waitSeconds = Math.ceil(remainingMs / 1000);
      const message = `Too many signup attempts. Please wait ${waitSeconds}s and try again.`;
      setError(message);
      return { success: false, error: message };
    }

    setIsLoading(true);
    setError(null);
    const normalizedEmail = (email || '').trim();
    const resolvedFirstName = (firstName || '').trim();
    const resolvedLastName = (lastName || '').trim();
    const resolvedFullName =
      (name || '').trim() ||
      `${resolvedFirstName} ${resolvedLastName}`.trim();

    const emailRedirectTo = getWebRedirectPath('/verify-email');

    try {
      const { data, error: err } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo,
          data: {
            full_name: resolvedFullName,
            first_name: resolvedFirstName || undefined,
            last_name: resolvedLastName || undefined,
          },
        },
      });
      setIsLoading(false);

      if (err) {
        const errMsg = err.message || '';
        const errStatus = err.status || err?.code || 0;

        // Rate-limited
        if (errStatus === 429 || `${errMsg}`.includes('429') || errMsg.toLowerCase().includes('rate limit') || errMsg.toLowerCase().includes('too many')) {
          const cooldownUntilTs = Date.now() + 60_000;
          signupCooldownUntilRef.current = cooldownUntilTs;
          setSignupCooldownUntil(cooldownUntilTs);
          const message = 'Too many signup attempts. Please wait 60 seconds and try again.';
          setError(message);
          return { success: false, error: message };
        }

        // Already registered
        if (errMsg.toLowerCase().includes('already registered') || errMsg.toLowerCase().includes('already exists') || errMsg.toLowerCase().includes('already been registered')) {
          const message = 'This email is already registered. Try logging in instead.';
          setError(message);
          return { success: false, error: message };
        }

        // SMTP / email sending failure (500 from Supabase)
        // The user may have been created but the confirmation email failed.
        // Try to recover by resending the confirmation email separately.
        if (errStatus === 500 || errMsg.toLowerCase().includes('internal server') || errMsg.toLowerCase().includes('sending confirmation')) {
          try {
            const { error: resendErr } = await supabase.auth.resend({
              type: 'signup',
              email: normalizedEmail,
              options: { emailRedirectTo },
            });

            if (!resendErr) {
              // Recovery succeeded — the confirmation email was sent
              setPendingEmailVerification(true);
              setPendingEmail(normalizedEmail);
              return { success: true, requiresEmailConfirmation: true };
            }
          } catch {
            // Resend also failed, fall through to error
          }

          const message = 'Account may have been created but the verification email could not be sent. Please try logging in, or try again in a few minutes.';
          setError(message);
          return { success: false, error: message };
        }

        // Password too weak
        if (errMsg.toLowerCase().includes('password')) {
          const message = 'Password does not meet the requirements. Please choose a stronger password (at least 8 characters).';
          setError(message);
          return { success: false, error: message };
        }

        // Generic fallback
        setError(errMsg);
        return { success: false, error: errMsg };
      }

      // Supabase returns data.user but with a fake session for already-existing unconfirmed users
      // Check if user already existed (identities array is empty)
      if (data?.user?.identities?.length === 0) {
        const message = 'An account with this email already exists. Please log in or check your email for a verification link.';
        setError(message);
        return { success: false, error: message };
      }

      if (!data.session) {
        // Email confirmation required — Supabase sends via Brevo SMTP
        setPendingEmailVerification(true);
        setPendingEmail(normalizedEmail);
        return { success: true, requiresEmailConfirmation: true };
      }
      return { success: true, user: buildUser(data.session) };
    } catch (networkError) {
      setIsLoading(false);
      const message = networkError?.message?.toLowerCase?.() || '';

      if (message.includes('fetch') || message.includes('network') || message.includes('failed')) {
        const errorMsg = 'Network error. Please check your internet connection and try again.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      const errorMsg = 'An unexpected error occurred during sign-up. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [buildUser]);

  /* ── Google OAuth Login ── */
  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const redirectTo = getWebRedirectPath('/dashboard');

    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (err) {
      setIsLoading(false);
      setError(err.message);
      return { success: false, error: err.message };
    }

    return { success: true };
  }, []);

  /* ── Resend verification email ── */
  const resendVerificationEmail = useCallback(async (email) => {
    const normalizedEmail = (email || '').trim();
    if (!normalizedEmail) {
      return { success: false, error: 'Enter your email to resend verification.' };
    }

    const emailRedirectTo = getWebRedirectPath('/verify-email');

    // Resend via Supabase (sends through Brevo SMTP)
    const { error: err } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
      options: { emailRedirectTo },
    });

    if (err) {
      return { success: false, error: err.message };
    }

    return { success: true };
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
  }, [buildUser]);

  /* ── Update profile ── */
  const updateProfile = useCallback(async ({ name, full_name, first_name, last_name, nickname, avatarUrl, avatar_url }) => {
    const updates = {};
    const resolvedName = (name ?? full_name)?.trim();
    const resolvedFirstName = first_name?.trim();
    const resolvedLastName = last_name?.trim();

    if (resolvedFirstName !== undefined) updates.first_name = resolvedFirstName;
    if (resolvedLastName !== undefined) updates.last_name = resolvedLastName;

    if (!resolvedName && (resolvedFirstName !== undefined || resolvedLastName !== undefined)) {
      const fallbackFullName = `${resolvedFirstName || ''} ${resolvedLastName || ''}`.trim();
      updates.full_name = fallbackFullName;
    }

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
  const changePassword = useCallback(async (payload) => {
    const nextPassword = typeof payload === 'string' ? payload : payload?.newPassword;
    const currentPassword = typeof payload === 'string' ? null : payload?.currentPassword;

    if (!nextPassword || nextPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters.' };
    }

    if (currentPassword) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) return { success: false, error: 'Not authenticated' };

      const { error: reAuthErr } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: currentPassword,
      });
      if (reAuthErr) return { success: false, error: 'Current password is incorrect.' };
    }

    const { error: err } = await supabase.auth.updateUser({ password: nextPassword });
    if (err) return { success: false, error: err.message };
    return { success: true };
  }, []);

  /* ── Upload avatar ── */
  const uploadAvatar = useCallback(async (file) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { success: false, error: 'Not authenticated' };
    const ext = file.name.split('.').pop();
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
    pendingEmailVerification, pendingEmail,
    login, logout, register, updateNickname, updateProfile,
    changePassword, uploadAvatar, deleteAccount, clearError,
    loginWithGoogle, resendVerificationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
