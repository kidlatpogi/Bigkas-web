import { createContext, useState, useCallback } from 'react';
import sessionApi from '../api/sessionApi';

/**
 * Session Context
 * Manages practice session state throughout the app
 */

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all sessions for current user
   */
  const fetchSessions = useCallback(async (params = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await sessionApi.getSessions(params);
      setSessions(data.sessions || data);
      return { success: true, data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch sessions';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch a specific session by ID
   */
  const fetchSession = useCallback(async (sessionId) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await sessionApi.getSession(sessionId);
      setCurrentSession(data);
      return { success: true, data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch session';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new session
   */
  const createSession = useCallback(async (sessionData) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await sessionApi.createSession(sessionData);
      setCurrentSession(data);
      setSessions(prev => [data, ...prev]);
      return { success: true, data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create session';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Submit audio for current session
   */
  const submitAudio = useCallback(async (sessionId, audioBlob) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await sessionApi.submitAudio(sessionId, audioBlob);
      return { success: true, data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to submit audio';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear current session
   */
  const clearCurrentSession = useCallback(() => {
    setCurrentSession(null);
  }, []);

  const value = {
    sessions,
    currentSession,
    isLoading,
    error,
    fetchSessions,
    fetchSession,
    createSession,
    submitAudio,
    clearCurrentSession,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export default SessionContext;
