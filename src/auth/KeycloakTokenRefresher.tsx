import { useKeycloak } from '@react-keycloak/web';
import React from 'react';

function KeycloakTokenRefresher() {
  const { keycloak, initialized } = useKeycloak();

  React.useEffect(() => {
    if (!initialized || !keycloak) return;
    const id = window.setInterval(() => {
      if (keycloak.authenticated) {
        keycloak.updateToken(30).catch(() => {
          console.warn('Failed to refresh token — user may need to re-login');
        });
      }
    }, 30_000); // every 30s
    return () => clearInterval(id);
  }, [initialized, keycloak]);

  return null;
}

export default KeycloakTokenRefresher;
