import { useAuthContext } from '../context/useAuthContext';

/**
 * Custom hook for authentication
 * Wraps AuthContext with additional utilities
 */
export function useAuth() {
  const auth = useAuthContext();

  return {
    ...auth,
    // Additional helper methods can be added here
    isLoggedIn: auth.isAuthenticated,
  };
}

export default useAuth;
