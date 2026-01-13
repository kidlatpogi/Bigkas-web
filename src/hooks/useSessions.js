import { useEffect } from 'react';
import { useSessionContext } from '../context/useSessionContext';

/**
 * Custom hook for sessions
 * Wraps SessionContext with additional utilities
 */
export function useSessions(options = {}) {
  const session = useSessionContext();
  const { autoFetch = false } = options;

  // Auto-fetch sessions on mount if enabled
  useEffect(() => {
    if (autoFetch && session.sessions.length === 0) {
      session.fetchSessions();
    }
  }, [autoFetch, session]);

  return {
    ...session,
    hasSessionData: session.sessions.length > 0,
  };
}

export default useSessions;
