import { useState, useEffect } from 'react';
import { User, AuthState } from '../types/auth';
import { authService } from '../services/auth';

export const useAuth = (): AuthState & {
  login: () => void;
  logout: () => void;
} => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const isAuthenticated = authService.isAuthenticated();
        
        if (isAuthenticated) {
          // Try to get user from localStorage first
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const user = JSON.parse(storedUser);
            setAuthState({
              isAuthenticated: true,
              user,
              loading: false,
              error: null,
            });
            return;
          }

          // If no stored user, fetch from API
          const accessToken = authService.getAccessToken();
          if (accessToken) {
            try {
              const user = await authService.getUserProfile(accessToken);
              localStorage.setItem('user', JSON.stringify(user));
              setAuthState({
                isAuthenticated: true,
                user,
                loading: false,
                error: null,
              });
            } catch (error) {
              // Token might be expired, try to refresh
              try {
                const tokens = await authService.refreshToken();
                const user = await authService.getUserProfile(tokens.access_token);
                localStorage.setItem('user', JSON.stringify(user));
                setAuthState({
                  isAuthenticated: true,
                  user,
                  loading: false,
                  error: null,
                });
              } catch (refreshError) {
                // Refresh failed, clear tokens and show as unauthenticated
                authService.clearTokens();
                localStorage.removeItem('user');
                setAuthState({
                  isAuthenticated: false,
                  user: null,
                  loading: false,
                  error: null,
                });
              }
            }
          }
        } else {
          setAuthState({
            isAuthenticated: false,
            user: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Authentication error',
        });
      }
    };

    initializeAuth();
  }, []);

  const login = () => {
    const authUrl = authService.getAuthUrl();
    window.location.href = authUrl;
  };

  const logout = () => {
    authService.clearTokens();
    localStorage.removeItem('user');
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
    });
  };

  return {
    ...authState,
    login,
    logout,
  };
};