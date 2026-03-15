import { createContext, useCallback, useEffect, useReducer } from 'react';
import { supabase } from '../lib/supabase';
import { ENV } from '../config/env';

const PAGE_SIZE = 10;
const LEGACY_LOCAL_SESSIONS_KEY = 'bigkas_local_sessions_v1';
const SESSION_MEDIA_BUCKET = 'session-recordings';

const initialState = {
  sessions:       [],
  currentSession: null,
  isLoading:      false,
  isAnalysing:    false,
  error:          null,
  pagination:     { page: 1, total: 0, hasMore: true, pageSize: PAGE_SIZE },
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':      return { ...state, isLoading: action.payload };
    case 'SET_ANALYSING':   return { ...state, isAnalysing: action.payload };
    case 'SET_SESSIONS':    return { ...state, sessions: action.payload.sessions, pagination: { page: action.payload.page, total: action.payload.total, hasMore: action.payload.sessions.length === action.payload.pageSize, pageSize: action.payload.pageSize } };
    case 'APPEND_SESSIONS': return { ...state, sessions: [...state.sessions, ...action.payload.sessions], pagination: { page: action.payload.page, total: action.payload.total, hasMore: action.payload.sessions.length === action.payload.pageSize, pageSize: action.payload.pageSize } };
    case 'SET_CURRENT':     return { ...state, currentSession: action.payload };
    case 'ADD_SESSION':     return { ...state, sessions: [action.payload, ...state.sessions] };
    case 'REMOVE_SESSION':  return { ...state, sessions: state.sessions.filter((s) => s.id !== action.payload) };
    case 'CLEAR_MEDIA_URLS':
      return {
        ...state,
        sessions: state.sessions.map((s) => ({
          ...s,
          audio_url: null,
          video_storage_url: null,
        })),
        currentSession: state.currentSession
          ? { ...state.currentSession, audio_url: null, video_storage_url: null }
          : state.currentSession,
      };
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

function normalizeSessionRow(session) {
  if (!session) return session;
  return {
    ...session,
    confidence_score: session.confidence_score ?? session.score ?? 0,
    duration_sec: session.duration_sec ?? session.duration ?? 0,
    video_url: session.video_url ?? session.video_storage_url ?? null,
    video_storage_url: session.video_storage_url ?? session.video_url ?? null,
    recommendations: Array.isArray(session.recommendations) ? session.recommendations : [],
  };
}

function isSessionsTableMissing(error) {
  if (!error) return false;
  const message = error.message?.toLowerCase() || '';
  return (
    error.code === '42P01' ||
    error?.status === 404 ||
    message.includes('does not exist') ||
    message.includes('relation') ||
    message.includes('not found')
  );
}

function isMissingVideoUrlColumn(error) {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  return error.code === '42703' || msg.includes('video_url') || msg.includes('column') && msg.includes('does not exist');
}

function getFileExtension(blobType, fallback = 'webm') {
  if (!blobType) return fallback;
  const [, subtype = fallback] = String(blobType).split('/');
  const cleaned = subtype.split(';')[0].trim();
  return cleaned || fallback;
}

function toInt(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.round(num);
}

function toNumeric(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return num;
}

function chunkArray(items, size) {
  if (!Array.isArray(items) || size <= 0) return [];
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function toSessionRecordingStoragePath(publicUrl) {
  if (!publicUrl || typeof publicUrl !== 'string') return null;
  const marker = `/storage/v1/object/public/${SESSION_MEDIA_BUCKET}/`;
  const markerIdx = publicUrl.indexOf(marker);
  if (markerIdx < 0) return null;
  const encodedPath = publicUrl.slice(markerIdx + marker.length);
  if (!encodedPath) return null;
  return decodeURIComponent(encodedPath);
}

async function uploadSessionMediaBlob({ userId, blob, kind }) {
  if (!blob || !userId) return null;

  const extension = getFileExtension(blob.type, kind === 'video' ? 'webm' : 'webm');
  const random = Math.random().toString(36).slice(2, 8);
  const filePath = `${userId}/${kind}/${Date.now()}-${random}.${extension}`;

  const { error } = await supabase.storage
    .from(SESSION_MEDIA_BUCKET)
    .upload(filePath, blob, {
      contentType: blob.type || (kind === 'video' ? 'video/webm' : 'audio/webm'),
      upsert: false,
    });

  if (error) {
    throw new Error(error.message || `Failed to upload ${kind} blob.`);
  }

  const { data } = supabase.storage.from(SESSION_MEDIA_BUCKET).getPublicUrl(filePath);
  return data?.publicUrl ?? null;
}

async function listUserStoragePaths(userId, kind) {
  const prefix = `${userId}/${kind}`;
  const allPaths = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data, error } = await supabase.storage
      .from(SESSION_MEDIA_BUCKET)
      .list(prefix, { limit, offset, sortBy: { column: 'name', order: 'asc' } });

    if (error) {
      throw new Error(error.message || `Failed to list ${kind} recordings.`);
    }

    const files = Array.isArray(data) ? data.filter((item) => item?.name) : [];
    for (const file of files) {
      allPaths.push(`${prefix}/${file.name}`);
    }

    if (files.length < limit) break;
    offset += limit;
  }

  return allPaths;
}

export function SessionProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Prevent stale local-only records from being shown after switching to DB-only persistence.
    window.localStorage.removeItem(LEGACY_LOCAL_SESSIONS_KEY);
  }, []);

  /* ── Helpers ── */
  const getUserId = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  }, []);

  /* ── Fetch paginated sessions ── */
  const fetchSessions = useCallback(async (page = 1, refresh = false, pageSize = PAGE_SIZE) => {
    if (!ENV.ENABLE_SESSION_PERSISTENCE) {
      return {
        success: false,
        error: 'Session persistence is disabled. Enable database persistence to load sessions.',
      };
    }

    const uid = await getUserId();
    if (!uid) return { success: false, error: 'Not authenticated' };
    dispatch({ type: 'SET_LOADING', payload: true });
    const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : PAGE_SIZE;
    const from = (page - 1) * safePageSize;
    const { data, error, count } = await supabase
      .from('sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .range(from, from + safePageSize - 1);
    dispatch({ type: 'SET_LOADING', payload: false });
    if (error) {
      if (isSessionsTableMissing(error)) {
        dispatch({ type: 'SET_SESSIONS', payload: { sessions: [], page: 1, total: 0 } });
        return { success: true };
      }
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
    const normalized = (data ?? []).map(normalizeSessionRow);
    const next = { sessions: normalized, page, total: count ?? 0, pageSize: safePageSize };
    dispatch({ type: refresh || page === 1 ? 'SET_SESSIONS' : 'APPEND_SESSIONS', payload: next });
    return { success: true };
  }, [getUserId]);

  const fetchAllSessions = useCallback(async () => {
    if (!ENV.ENABLE_SESSION_PERSISTENCE) {
      return {
        success: false,
        error: 'Session persistence is disabled. Enable database persistence to load sessions.',
      };
    }

    const uid = await getUserId();
    if (!uid) return { success: false, error: 'Not authenticated' };

    dispatch({ type: 'SET_LOADING', payload: true });
    const allSessions = [];
    let page = 1;
    const batchSize = 200;

    try {
      while (true) {
        const from = (page - 1) * batchSize;
        const { data, error, count } = await supabase
          .from('sessions')
          .select('*', { count: page === 1 ? 'exact' : undefined })
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .range(from, from + batchSize - 1);

        if (error) {
          if (isSessionsTableMissing(error)) {
            dispatch({ type: 'SET_SESSIONS', payload: { sessions: [], page: 1, total: 0, pageSize: batchSize } });
            dispatch({ type: 'SET_LOADING', payload: false });
            return { success: true, sessions: [] };
          }
          dispatch({ type: 'SET_ERROR', payload: error.message });
          dispatch({ type: 'SET_LOADING', payload: false });
          return { success: false, error: error.message };
        }

        const normalizedBatch = (data ?? []).map(normalizeSessionRow);
        allSessions.push(...normalizedBatch);

        if (normalizedBatch.length < batchSize) {
          dispatch({
            type: 'SET_SESSIONS',
            payload: {
              sessions: allSessions,
              page,
              total: count ?? allSessions.length,
              pageSize: batchSize,
            },
          });
          dispatch({ type: 'SET_LOADING', payload: false });
          return { success: true, sessions: allSessions };
        }

        page += 1;
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to load sessions.' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: err.message || 'Failed to load sessions.' };
    }
  }, [getUserId]);

  const loadMoreSessions = useCallback(async () => {
    if (!state.pagination.hasMore || state.isLoading) return;
    await fetchSessions(state.pagination.page + 1, false, state.pagination.pageSize || PAGE_SIZE);
  }, [fetchSessions, state.pagination, state.isLoading]);

  /* ── Fetch single session ── */
  const fetchSessionById = useCallback(async (sessionId) => {
    const normalizedId = String(sessionId || '');
    const inMemoryMatch = state.sessions.find((s) => String(s.id) === normalizedId);
    if (inMemoryMatch) {
      dispatch({ type: 'SET_CURRENT', payload: inMemoryMatch });
      return { success: true, session: inMemoryMatch };
    }

    if (!ENV.ENABLE_SESSION_PERSISTENCE) {
      dispatch({ type: 'SET_CURRENT', payload: null });
      return {
        success: false,
        error: 'Session persistence is disabled. Enable database persistence to load sessions.',
      };
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    const { data, error } = await supabase.from('sessions').select('*').eq('id', sessionId).single();
    dispatch({ type: 'SET_LOADING', payload: false });
    if (isSessionsTableMissing(error)) {
      dispatch({ type: 'SET_CURRENT', payload: null });
      return { success: false, error: 'Session not found' };
    }
    if (error) { dispatch({ type: 'SET_ERROR', payload: error.message }); return { success: false, error: error.message }; }
    const normalized = normalizeSessionRow(data);
    dispatch({ type: 'SET_CURRENT', payload: normalized });
    return { success: true, session: normalized };
  }, [state.sessions]);

  /* ── Analyse & save session (calls Python backend) ── */
  const analyseAndSave = useCallback(async ({ audioBlob, videoBlob = null, targetText, scriptType = 'free-speech', difficulty = 'medium' }) => {
    const uid = await getUserId();
    if (!uid) return { success: false, error: 'Not authenticated' };
    dispatch({ type: 'SET_ANALYSING', payload: true });
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      if (videoBlob) {
        formData.append('video', videoBlob, 'recording-video.webm');
      }
      formData.append('target_text', targetText);
      formData.append('script_type', scriptType);
      formData.append('difficulty', difficulty);
      const res = await fetch(`${apiUrl}/api/analysis/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authSession?.access_token}` },
        body: formData,
      });
      if (!res.ok) throw new Error(`Analysis failed: ${res.status}`);
      const analysisResult = await res.json();

      let audioStorageUrl = null;
      let videoStorageUrl = null;
      if (ENV.ENABLE_SESSION_PERSISTENCE) {
        audioStorageUrl = await uploadSessionMediaBlob({ userId: uid, blob: audioBlob, kind: 'audio' });
        if (!audioStorageUrl) {
          throw new Error('Failed to upload session audio to storage bucket.');
        }

        if (videoBlob) {
          videoStorageUrl = await uploadSessionMediaBlob({ userId: uid, blob: videoBlob, kind: 'video' });
        }
      }

      // Persist to Supabase (optional in local/dev)
      const sessionRow = {
        user_id:       uid,
        target_text:   targetText,
        script_type:   scriptType,
        difficulty,
        score:         toNumeric(analysisResult.confidence_score, 0),
        acoustic_score: toNumeric(analysisResult.acoustic_score, 0),
        fluency_score:  toNumeric(analysisResult.fluency_score, 0),
        visual_score:   analysisResult.visual_score == null ? null : toNumeric(analysisResult.visual_score, 0),
        feedback:       analysisResult.summary         ?? '',
        duration:       toInt(analysisResult.duration_sec, 0),
        confidence_score: toInt(analysisResult.confidence_score, 0),
        facial_expression_score: analysisResult.facial_expression_score == null ? null : toInt(analysisResult.facial_expression_score, 0),
        gesture_score: analysisResult.gesture_score == null ? null : toInt(analysisResult.gesture_score, 0),
        jitter_score: analysisResult.jitter_score == null ? null : toInt(analysisResult.jitter_score, 0),
        shimmer_score: analysisResult.shimmer_score == null ? null : toInt(analysisResult.shimmer_score, 0),
        pronunciation_score: analysisResult.pronunciation_score == null ? null : toInt(analysisResult.pronunciation_score, 0),
        recommendations: analysisResult.recommendations ?? [],
        transcript: analysisResult.transcript ?? '',
        audio_url: audioStorageUrl,
      };

      if (!ENV.ENABLE_SESSION_PERSISTENCE) {
        throw new Error('Session persistence is disabled. Enable database persistence to save sessions.');
      }

      const { data: saved, error: saveErr } = await supabase.from('sessions').insert(sessionRow).select().single();
      if (saveErr) {
        if (isSessionsTableMissing(saveErr)) {
          throw new Error('Supabase table "sessions" is missing. Create it in your Supabase project to persist data.');
        }
        throw new Error(saveErr.message);
      }

      let persistedSession = saved;

      if (videoStorageUrl) {
        const { data: updatedSessionWithVideo, error: videoUpdateErr } = await supabase
          .from('sessions')
          .update({ video_url: videoStorageUrl })
          .eq('id', saved.id)
          .select()
          .single();

        if (videoUpdateErr) {
          if (!isMissingVideoUrlColumn(videoUpdateErr)) {
            throw new Error(videoUpdateErr.message);
          }
        } else if (updatedSessionWithVideo) {
          persistedSession = updatedSessionWithVideo;
        }
      }

      const normalizedSaved = normalizeSessionRow(persistedSession);
      dispatch({ type: 'ADD_SESSION', payload: normalizedSaved });
      return {
        success: true,
        session: normalizedSaved,
        analysisResult,
        data: {
          ...normalizedSaved,
          confidence_score: analysisResult.confidence_score ?? normalizedSaved.score ?? 0,
          acoustic_score: analysisResult.acoustic_score ?? normalizedSaved.acoustic_score ?? 0,
          fluency_score: analysisResult.fluency_score ?? normalizedSaved.fluency_score ?? 0,
          visual_score: analysisResult.visual_score ?? normalizedSaved.visual_score ?? null,
          facial_expression_score: analysisResult.facial_expression_score ?? null,
          gesture_score: analysisResult.gesture_score ?? null,
          jitter_score: analysisResult.jitter_score ?? null,
          shimmer_score: analysisResult.shimmer_score ?? null,
          pronunciation_score: analysisResult.pronunciation_score ?? null,
          recommendations: analysisResult.recommendations ?? [],
          transcript: analysisResult.transcript ?? '',
          duration_sec: analysisResult.duration_sec ?? normalizedSaved.duration ?? 0,
          summary: analysisResult.summary ?? normalizedSaved.feedback ?? '',
          audio_url: normalizedSaved.audio_url ?? audioStorageUrl,
          video_url: normalizedSaved.video_url ?? videoStorageUrl,
          video_storage_url: normalizedSaved.video_storage_url ?? videoStorageUrl,
        },
      };
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      return { success: false, error: err.message };
    } finally {
      dispatch({ type: 'SET_ANALYSING', payload: false });
    }
  }, [getUserId]);

  /* ── Delete session ── */
  const deleteSession = useCallback(async (sessionId) => {
    if (!ENV.ENABLE_SESSION_PERSISTENCE) {
      return {
        success: false,
        error: 'Session persistence is disabled. Enable database persistence to delete sessions.',
      };
    }

    const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
    if (isSessionsTableMissing(error)) {
      dispatch({ type: 'REMOVE_SESSION', payload: sessionId });
      return { success: true };
    }
    if (error) return { success: false, error: error.message };
    dispatch({ type: 'REMOVE_SESSION', payload: sessionId });
    return { success: true };
  }, []);

  const clearSessionMedia = useCallback(async () => {
    if (!ENV.ENABLE_SESSION_PERSISTENCE) {
      return {
        success: false,
        error: 'Session persistence is disabled. Enable database persistence to clear session media.',
      };
    }

    const uid = await getUserId();
    if (!uid) return { success: false, error: 'Not authenticated' };

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const { data: sessionRows, error: sessionReadErr } = await supabase
        .from('sessions')
        .select('audio_url,video_url')
        .eq('user_id', uid)
        .or('audio_url.not.is.null,video_url.not.is.null');

      let safeSessionRows = sessionRows;
      if (sessionReadErr) {
        if (isMissingVideoUrlColumn(sessionReadErr)) {
          const { data: fallbackRows, error: fallbackErr } = await supabase
            .from('sessions')
            .select('audio_url')
            .eq('user_id', uid)
            .not('audio_url', 'is', null);

          if (fallbackErr && !isSessionsTableMissing(fallbackErr)) {
            throw new Error(fallbackErr.message);
          }
          safeSessionRows = fallbackRows;
        } else if (!isSessionsTableMissing(sessionReadErr)) {
          throw new Error(sessionReadErr.message);
        }
      }

      const dbAudioPaths = (safeSessionRows ?? [])
        .map((row) => toSessionRecordingStoragePath(row.audio_url))
        .filter(Boolean);
      const dbVideoPaths = (safeSessionRows ?? [])
        .map((row) => toSessionRecordingStoragePath(row.video_url))
        .filter(Boolean);

      const [audioPaths, videoPaths] = await Promise.all([
        listUserStoragePaths(uid, 'audio').catch(() => []),
        listUserStoragePaths(uid, 'video').catch(() => []),
      ]);

      const allPaths = Array.from(new Set([...dbAudioPaths, ...dbVideoPaths, ...audioPaths, ...videoPaths]));

      for (const batch of chunkArray(allPaths, 100)) {
        const { error: removeErr } = await supabase.storage
          .from(SESSION_MEDIA_BUCKET)
          .remove(batch);

        if (removeErr) {
          throw new Error(removeErr.message || 'Failed to remove one or more recording files.');
        }
      }

      const { error: clearDbErr } = await supabase
        .from('sessions')
        .update({ audio_url: null, video_url: null })
        .eq('user_id', uid)
        .or('audio_url.not.is.null,video_url.not.is.null');

      if (clearDbErr) {
        if (isMissingVideoUrlColumn(clearDbErr)) {
          const { error: fallbackClearErr } = await supabase
            .from('sessions')
            .update({ audio_url: null })
            .eq('user_id', uid)
            .not('audio_url', 'is', null);

          if (fallbackClearErr && !isSessionsTableMissing(fallbackClearErr)) {
            throw new Error(fallbackClearErr.message);
          }
        } else if (!isSessionsTableMissing(clearDbErr)) {
          throw new Error(clearDbErr.message);
        }
      }

      dispatch({ type: 'CLEAR_MEDIA_URLS' });
      return { success: true, clearedFiles: allPaths.length };
    } catch (err) {
      const message = err.message || 'Failed to clear session media.';
      dispatch({ type: 'SET_ERROR', payload: message });
      return { success: false, error: message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [getUserId]);

  const clearCurrentSession = useCallback(() => dispatch({ type: 'SET_CURRENT', payload: null }), []);
  const clearError          = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);
  const reset               = useCallback(() => dispatch({ type: 'RESET' }), []);

  const value = {
    ...state,
    fetchSessions,
    fetchAllSessions,
    loadMoreSessions,
    fetchSessionById,
    analyseAndSave,
    deleteSession,
    clearSessionMedia,
    clearCurrentSession,
    clearError,
    reset,
    // legacy alias (some older pages use fetchSession)
    fetchSession: fetchSessionById,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export default SessionContext;
