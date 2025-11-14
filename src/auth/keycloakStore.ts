/**
 * Global store for Keycloak instance
 * This allows non-React code (like services) to access the Keycloak instance
 */

let keycloakInstance: any = null;

/**
 * Set the Keycloak instance (called from AuthProvider)
 */
export const setKeycloakInstance = (instance: any) => {
  keycloakInstance = instance;
  // Also set on window for backward compatibility
  if (typeof window !== 'undefined') {
    (window as any).keycloak = instance;
  }
};

/**
 * Get the Keycloak instance
 */
export const getKeycloakInstance = (): any => {
  // Try to get from store first
  if (keycloakInstance) {
    return keycloakInstance;
  }

  // Fallback to window.keycloak (for backward compatibility)
  if (typeof window !== 'undefined' && (window as any).keycloak) {
    return (window as any).keycloak;
  }

  return null;
};

/**
 * Get the Keycloak token if available
 */
export const getKeycloakToken = (): string | null => {
  const keycloak = getKeycloakInstance();

  if (!keycloak) {
    return null;
  }

  try {
    if (keycloak.token) {
      // Check if token is expired (basic check - backend will verify properly)
      if (keycloak.isTokenExpired && keycloak.isTokenExpired()) {
        // Try to refresh token
        if (keycloak.updateToken) {
          keycloak.updateToken(30).catch((err: Error) => {
            console.warn('Failed to refresh expired token:', err);
          });
        }
        // Return token anyway - backend will handle expiration
        return keycloak.token;
      }
      return keycloak.token;
    }
  } catch (error) {
    console.warn('Failed to get Keycloak token:', error);
  }

  return null;
};
