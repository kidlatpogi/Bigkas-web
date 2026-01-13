import { createContext, useState, useEffect, useCallback } from 'react';
import authApi from '../api/authApi';

/**
 * Authentication Context
 * Provides user state and auth actions throughout the app
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // Check for demo mode (when no backend is available)
      const demoMode = localStorage.getItem('demoMode') === 'true';
      
      if (demoMode) {
        // Load demo user data
        const demoUser = JSON.parse(localStorage.getItem('demoUser') || '{"id":"demo","name":"Demo User","email":"demo@example.com"}');
        setUser(demoUser);
        setIsLoading(false);
        return;
      }
      
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const userData = await authApi.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Failed to restore auth session:', error);
          localStorage.removeItem('authToken');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  /**
   * Login user
   * @param {string} email 
   * @param {string} password 
   */
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      // Check if backend is available - if not, use demo mode
      const demoUser = { id: 'demo', name: 'Demo User', email };
      
      try {
        const response = await authApi.login(email, password);
        const { token, user: userData } = response;
        
        localStorage.setItem('authToken', token);
        localStorage.removeItem('demoMode');
        setUser(userData);
        
        return { success: true, user: userData };
      } catch (error) {
        // If login fails due to no backend, allow demo mode
        if (error.message.includes('Network') || error.code === 'ERR_NETWORK') {
          console.warn('Backend not available, using demo mode');
          localStorage.setItem('demoMode', 'true');
          localStorage.setItem('demoUser', JSON.stringify(demoUser));
          setUser(demoUser);
          return { success: true, user: demoUser };
        }
        
        const message = error.response?.data?.message || 'Login failed';
        return { success: false, error: message };
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Register new user
   * @param {Object} userData - { email, password, name, ... }
   */
  const register = useCallback(async (userData) => {
    setIsLoading(true);
    try {
      const demoUser = { id: 'demo', name: userData.name, email: userData.email };
      
      try {
        const response = await authApi.register(userData);
        const { token, user: newUser } = response;
        
        localStorage.setItem('authToken', token);
        localStorage.removeItem('demoMode');
        setUser(newUser);
        
        return { success: true, user: newUser };
      } catch (error) {
        // If register fails due to no backend, allow demo mode
        if (error.message.includes('Network') || error.code === 'ERR_NETWORK') {
          console.warn('Backend not available, using demo mode');
          localStorage.setItem('demoMode', 'true');
          localStorage.setItem('demoUser', JSON.stringify(demoUser));
          setUser(demoUser);
          return { success: true, user: demoUser };
        }
        
        const message = error.response?.data?.message || 'Registration failed';
        return { success: false, error: message };
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout current user
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // Only call logout API if not in demo mode
      if (localStorage.getItem('demoMode') !== 'true') {
        await authApi.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('demoMode');
      localStorage.removeItem('demoUser');
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
