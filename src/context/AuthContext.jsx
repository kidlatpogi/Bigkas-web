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

function normalizeLoginError(err, email) {
  const rawMessage = (err?.message || '').trim();
  const msg = rawMessage.toLowerCase();
  const code = (err?.code || '').toLowerCase();

  if (err?.status === 423 || code.includes('locked')) {
    const remainingSeconds = Number(err?.remainingSeconds || 0);
    const unlockTimeMs = err?.unlockTime ? Date.parse(err.unlockTime) : NaN;
    const fallbackSeconds = Number.isFinite(unlockTimeMs)
      ? Math.max(1, Math.ceil((unlockTimeMs - Date.now()) / 1000))
      : 60;
    const waitSeconds = Number.isFinite(remainingSeconds) && remainingSeconds > 0
      ? Math.max(1, Math.ceil(remainingSeconds))
      : fallbackSeconds;
    return {
      code: 'account_locked',
      message: `Too many failed attempts. Try again in ${waitSeconds}s.`,
      requiresEmailConfirmation: false,
      lockoutSeconds: waitSeconds,
    };
  }

  if (
    msg.includes('email not confirmed') ||
    msg.includes('not confirmed') ||
    code.includes('email_not_confirmed')
  ) {
    return {
      code: 'email_not_confirmed',
      message: 'Verify your email address first. Then click resend email below if you need a new link.',
      requiresEmailConfirmation: true,
      pendingEmail: email,
    };
  }

  if (
    msg.includes('user not found') ||
    msg.includes('no user') ||
    msg.includes('email not found')
  ) {
    return {
      code: 'account_not_found',
      message: 'No account found for this email address.',
      requiresEmailConfirmation: false,
    };
  }

  if (
    msg.includes('invalid login') ||
    msg.includes('invalid credentials') ||
    msg.includes('invalid email or password') ||
    code.includes('invalid_credentials')
  ) {
    return {
      code: 'invalid_credentials',
      message: 'Wrong email or password.',
      requiresEmailConfirmation: false,
    };
  }

  if (msg.includes('too many') || msg.includes('rate limit') || err?.status === 429) {
    return {
      code: 'rate_limited',
      message: 'Too many login attempts. Please wait a moment and try again.',
      requiresEmailConfirmation: false,
    };
  }

  return {
    code: 'unknown_auth_error',
    message: rawMessage || 'Unable to log in right now. Please try again.',
    requiresEmailConfirmation: false,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingEmailVerification, setPendingEmailVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(null);
  const signupCooldownUntilRef = useRef(0);
  const signupInProgressRef = useRef(false);

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
      setIsInitializing(false);
    }).catch(() => {
      setIsLoading(false);
      setIsInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Skip auth state changes while signup is in progress to prevent race conditions
      // that would reset pendingEmailVerification or cause unwanted navigation
      if (signupInProgressRef.current) return;

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

    const fallbackToDirectSupabaseLogin = async () => {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });

      setIsLoading(false);

      if (err) {
        const normalizedError = normalizeLoginError(err, email);
        setError(normalizedError.message);
        return {
          success: false,
          code: normalizedError.code,
          error: normalizedError.message,
          requiresEmailConfirmation: false,
        };
      }

      const emailConfirmed = !!data.user?.email_confirmed_at;
      if (!emailConfirmed) {
        setPendingEmailVerification(true);
        setPendingEmail(email);
        const message = 'Verify your email address first. Then click resend email below if you need a new link.';
        setError(message);
        await supabase.auth.signOut();
        return {
          success: false,
          code: 'email_not_confirmed',
          error: message,
          requiresEmailConfirmation: true,
        };
      }

      setPendingEmailVerification(false);
      setPendingEmail(null);
      return { success: true, user: buildUser(data.session) };
    };

    try {
      const response = await fetch(`${ENV.API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        if (response.status >= 500) {
          return await fallbackToDirectSupabaseLogin();
        }

        let payload = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        const remainingSeconds = payload?.detail?.remaining_seconds;
        const unlockTime = payload?.detail?.unlock_time;
        const backendError = payload?.detail?.error || payload?.error || 'Unable to log in right now. Please try again.';
        const normalizedError = normalizeLoginError(
          {
            status: response.status,
            code: response.status === 423 ? 'account_locked' : 'invalid_credentials',
            message: backendError,
            remainingSeconds,
            unlockTime,
          },
          email
        );

        setIsLoading(false);
        setError(normalizedError.message);
        return {
          success: false,
          code: normalizedError.code,
          error: normalizedError.message,
          requiresEmailConfirmation: false,
          lockoutSeconds: normalizedError.lockoutSeconds,
          unlockTime,
        };
      }

      const payload = await response.json();
      const { data: sessionData, error: setSessionError } = await supabase.auth.setSession({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
      });

      setIsLoading(false);

      if (setSessionError) {
        const normalizedError = normalizeLoginError(setSessionError, email);
        setError(normalizedError.message);
        return {
          success: false,
          code: normalizedError.code,
          error: normalizedError.message,
          requiresEmailConfirmation: false,
        };
      }

      const emailConfirmed = !!sessionData?.session?.user?.email_confirmed_at;
      if (!emailConfirmed) {
        setPendingEmailVerification(true);
        setPendingEmail(email);
        const message = 'Verify your email address first. Then click resend email below if you need a new link.';
        setError(message);
        await supabase.auth.signOut();
        return {
          success: false,
          code: 'email_not_confirmed',
          error: message,
          requiresEmailConfirmation: true,
        };
      }

      setPendingEmailVerification(false);
      setPendingEmail(null);
      return { success: true, user: buildUser(sessionData.session) };
    } catch {
      return await fallbackToDirectSupabaseLogin();
    }
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
    signupInProgressRef.current = true;
    const normalizedEmail = (email || '').trim();
    const resolvedFirstName = (firstName || '').trim();
    const resolvedLastName = (lastName || '').trim();
    const resolvedFullName =
      (name || '').trim() ||
      `${resolvedFirstName} ${resolvedLastName}`.trim();

    const emailRedirectTo = getWebRedirectPath('/verify-email');

    try {
      // Race the signup against a 15-second timeout.
      // When Supabase's SMTP hangs (trying to send confirmation email),
      // the signUp() promise never resolves — this prevents infinite loading.
      const signupPromise = supabase.auth.signUp({
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

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SIGNUP_TIMEOUT')), 15000)
      );

      const { data, error: err } = await Promise.race([signupPromise, timeoutPromise]);
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
      const message = networkError?.message || '';

      // Signup request timed out — SMTP is likely hanging
      if (message === 'SIGNUP_TIMEOUT') {
        const errorMsg = 'Account creation is taking too long (email service may be slow). Your account may have been created — try logging in. If not, please try again.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      if (message.toLowerCase().includes('fetch') || message.toLowerCase().includes('network') || message.toLowerCase().includes('failed')) {
        const errorMsg = 'Network error. Please check your internet connection and try again.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      const errorMsg = 'An unexpected error occurred during sign-up. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      // Reset flag after a short delay to let any pending auth events settle
      setTimeout(() => { signupInProgressRef.current = false; }, 3000);
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
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('rate limit') || msg.includes('too many') || err.status === 429) {
        return { success: false, error: 'Please wait before requesting another verification email.' };
      }
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
    user, isInitializing, isLoading, isAuthenticated: !!user, error,
    pendingEmailVerification, pendingEmail,
    login, logout, register, updateNickname, updateProfile,
    changePassword, uploadAvatar, deleteAccount, clearError,
    loginWithGoogle, resendVerificationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
