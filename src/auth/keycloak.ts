import Keycloak from 'keycloak-js';

// Singleton pattern to prevent multiple Keycloak instances
let keycloakInstance: Keycloak | null = null;

export const getKeycloakInstance = (): Keycloak => {
  if (!keycloakInstance) {
    keycloakInstance = new Keycloak({
      url: import.meta.env.VITE_KEYCLOAK_URL,
      realm: import.meta.env.VITE_KEYCLOAK_REALM,
      clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
    });
  }
  return keycloakInstance;
};

// Export a getter function instead of the instance directly
export const getKeycloak = () => getKeycloakInstance();

// Development helper to reset instance (for hot reloading)
if (import.meta.env.DEV) {
  // Reset instance on hot reload
  if (import.meta.hot) {
    import.meta.hot.accept(() => {
      keycloakInstance = null;
    });
  }
}
