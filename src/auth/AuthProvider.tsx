import { ReactKeycloakProvider } from '@react-keycloak/web';
import { createKeycloak } from './keycloak';
import { getKeycloakConfig } from './keycloakConfig';
import KeycloakTokenRefresher from './KeycloakTokenRefresher';
import { AuthContextProvider } from './AuthContext';
import { AuthContext, type AuthContextType } from './AuthContextTypes';

/**
 * Check if Keycloak configuration is available
 */
const isKeycloakConfigured = (): boolean => {
  return !!(
    import.meta.env.VITE_KEYCLOAK_URL &&
    import.meta.env.VITE_KEYCLOAK_REALM &&
    import.meta.env.VITE_KEYCLOAK_CLIENT_ID
  );
};

/**
 * Fallback AuthContextProvider that works without Keycloak
 * Provides default values for unauthenticated state
 */
const FallbackAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const value: AuthContextType = {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    login: async () => {
      console.warn('Keycloak is not configured. Login is not available.');
    },
    logout: async () => {
      console.warn('Keycloak is not configured. Logout is not available.');
    },
    error: null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if Keycloak is configured
  if (!isKeycloakConfigured()) {
    console.warn(
      'Keycloak configuration is missing. Running in unauthenticated mode. ' +
        'To enable authentication, set VITE_KEYCLOAK_URL, VITE_KEYCLOAK_REALM, and VITE_KEYCLOAK_CLIENT_ID in your .env file.'
    );
    return <FallbackAuthProvider>{children}</FallbackAuthProvider>;
  }

  // Keycloak is configured, use it
  const keycloak = createKeycloak();
  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={{
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false,
        // @ts-ignore - redirectUri is conditionally added in config
        redirectUri: getKeycloakConfig().redirectUri,
      }}
      autoRefreshToken={true}
    >
      <KeycloakTokenRefresher />
      <AuthContextProvider>{children}</AuthContextProvider>
    </ReactKeycloakProvider>
  );
}
