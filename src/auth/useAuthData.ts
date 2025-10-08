import { useAuth } from './useAuth';

/**
 * Authentication hook that provides Keycloak state
 * This is the single source of truth for authentication data
 */
export const useAuthData = () => {
  const keycloakAuth = useAuth();

  // Use Keycloak as the single source of truth
  return {
    isAuthenticated: keycloakAuth.isAuthenticated,
    isLoading: keycloakAuth.isLoading,
    user: keycloakAuth.user,
    login: keycloakAuth.login,
    logout: keycloakAuth.logout,
    error: keycloakAuth.error,
  };
};
