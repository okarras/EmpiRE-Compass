import { useContext } from 'react';
import { AuthContext, type AuthContextType } from './AuthContextTypes';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context) {
    return context;
  }
  // Safe defaults when AuthProvider is not mounted (e.g., home page without Keycloak)
  return {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    login: async () => {
      // No-op when auth is disabled on this route
      return;
    },
    logout: async () => {
      return;
    },
    error: null,
  };
};
