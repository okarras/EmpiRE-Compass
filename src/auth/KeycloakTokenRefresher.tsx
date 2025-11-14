import { useKeycloak } from '@react-keycloak/web';
import { useEffect } from 'react';

function KeycloakTokenRefresher() {
  const { keycloak, initialized } = useKeycloak();

  useEffect(() => {
    if (!initialized || !keycloak) return;

    // Set up token refresh interval
    const refreshInterval = setInterval(async () => {
      if (keycloak.authenticated) {
        try {
          const refreshed = await keycloak.updateToken(30);
          if (refreshed) {
            console.log('Token refreshed successfully');
          }
        } catch (error) {
          console.warn('Failed to refresh token:', error);
          // If refresh fails, the user might need to re-authenticate
          // The Keycloak provider will handle this automatically
        }
      }
    }, 30_000); // Check every 30 seconds

    // Clean up interval on unmount
    return () => {
      clearInterval(refreshInterval);
    };
  }, [initialized, keycloak, location.pathname]);

  return null;
}

export default KeycloakTokenRefresher;
