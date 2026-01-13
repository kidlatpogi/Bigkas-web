import { useContext } from 'react';
import AuthContext from './AuthContext';

/**
 * Hook to use auth context
 * @returns {Object} Auth context value
 */
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export default useAuthContext;
