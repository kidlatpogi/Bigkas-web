import { createContext, useCallback, useReducer } from 'react';
import { supabase } from '../lib/supabase';

const PAGE_SIZE = 10;

const initialState = {
  sessions:       [],
  currentSession: null,
  isLoading:      false,
  isAnalysing:    false,
  error:          null,
  pagination:     { page: 1, total: 0, hasMore: true },
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':      return { ...state, isLoading: action.payload };
    case 'SET_ANALYSING':   return { ...state, isAnalysing: action.payload };
    case 'SET_SESSIONS':    return { ...state, sessions: action.payload.sessions, pagination: { page: action.payload.page, total: action.payload.total, hasMore: action.payload.sessions.length === PAGE_SIZE } };
    case 'APPEND_SESSIONS': return { ...state, sessions: [...state.sessions, ...action.payload.sessions], pagination: { page: action.payload.page, total: action.payload.total, hasMore: action.payload.sessions.length === PAGE_SIZE } };
    case 'SET_CURRENT':     return { ...state, currentSession: action.payload };
    case 'ADD_SESSION':     return { ...state, sessions: [action.payload, ...state.sessions] };
    case 'REMOVE_SESSION':  return { ...state, sessions: state.sessions.filter((s) => s.id !== action.payload) };
    case 'SET_ERROR':       return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':     return { ...state, error: null };
    case 'RESET':           return initialState;
    default:                return state;
  }
}

/**
 * Session Context
 * Manages practice session state throughout the app
 */

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  /* ── Helpers ── */
  const getUserId = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  }, []);

  /* ── Fetch paginated sessions ── */
  const fetchSessions = useCallback(async (page = 1, refresh = false) => {
    const uid = await getUserId();
    if (!uid) return { success: false, error: 'Not authenticated' };
    dispatch({ type: 'SET_LOADING', payload: true });
    const from = (page - 1) * PAGE_SIZE;
    const { data, error, count } = await supabase
      .from('sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    dispatch({ type: 'SET_LOADING', payload: false });
    if (error) {
      // Table doesn't exist yet — treat as empty; stop console spam
      const tableGone = error.code === '42P01' ||
        error.message?.toLowerCase().includes('does not exist') ||
        error.message?.toLowerCase().includes('relation') ||
        error?.status === 404;
      if (tableGone) {
        dispatch({ type: 'SET_SESSIONS', payload: { sessions: [], page: 1, total: 0 } });
        return { success: true };
      }
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
    const next = { sessions: data ?? [], page, total: count ?? 0 };
    dispatch({ type: refresh || page === 1 ? 'SET_SESSIONS' : 'APPEND_SESSIONS', payload: next });
    return { success: true };
  }, [getUserId]);

  const loadMoreSessions = useCallback(async () => {
    if (!state.pagination.hasMore || state.isLoading) return;
    await fetchSessions(state.pagination.page + 1);
  }, [fetchSessions, state.pagination, state.isLoading]);

  /* ── Fetch single session ── */
  const fetchSessionById = useCallback(async (sessionId) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const { data, error } = await supabase.from('sessions').select('*').eq('id', sessionId).single();
    dispatch({ type: 'SET_LOADING', payload: false });
    if (error) { dispatch({ type: 'SET_ERROR', payload: error.message }); return { success: false, error: error.message }; }
    dispatch({ type: 'SET_CURRENT', payload: data });
    return { success: true, session: data };
  }, []);

  /* ── Analyse & save session (calls Python backend) ── */
  const analyseAndSave = useCallback(async ({ audioBlob, targetText, scriptType = 'free-speech', difficulty = 'medium' }) => {
    const uid = await getUserId();
    if (!uid) return { success: false, error: 'Not authenticated' };
    dispatch({ type: 'SET_ANALYSING', payload: true });
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('target_text', targetText);
      formData.append('script_type', scriptType);
      formData.append('difficulty', difficulty);
      const res = await fetch(`${apiUrl}/api/v1/analysis/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authSession?.access_token}` },
        body: formData,
      });
      if (!res.ok) throw new Error(`Analysis failed: ${res.status}`);
      const analysisResult = await res.json();
      // Persist to Supabase
      const sessionRow = {
        user_id:       uid,
        target_text:   targetText,
        script_type:   scriptType,
        difficulty,
        score:         analysisResult.confidence_score ?? 0,
        acoustic_score: analysisResult.acoustic_score ?? 0,
        fluency_score:  analysisResult.fluency_score  ?? 0,
        visual_score:   analysisResult.visual_score   ?? null,
        feedback:       analysisResult.summary         ?? '',
        duration:       analysisResult.duration_sec    ?? 0,
      };
      const { data: saved, error: saveErr } = await supabase.from('sessions').insert(sessionRow).select().single();
      if (saveErr) throw new Error(saveErr.message);
      dispatch({ type: 'ADD_SESSION', payload: saved });
      return { success: true, session: saved, analysisResult };
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      return { success: false, error: err.message };
    } finally {
      dispatch({ type: 'SET_ANALYSING', payload: false });
    }
  }, [getUserId]);

  /* ── Delete session ── */
  const deleteSession = useCallback(async (sessionId) => {
    const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
    if (error) return { success: false, error: error.message };
    dispatch({ type: 'REMOVE_SESSION', payload: sessionId });
    return { success: true };
  }, []);

  const clearCurrentSession = useCallback(() => dispatch({ type: 'SET_CURRENT', payload: null }), []);
  const clearError          = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);
  const reset               = useCallback(() => dispatch({ type: 'RESET' }), []);

  const value = {
    ...state,
    fetchSessions,
    loadMoreSessions,
    fetchSessionById,
    analyseAndSave,
    deleteSession,
    clearCurrentSession,
    clearError,
    reset,
    // legacy alias (some older pages use fetchSession)
    fetchSession: fetchSessionById,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export default SessionContext;
