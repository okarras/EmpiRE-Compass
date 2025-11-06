import Keycloak from 'keycloak-js';

// Factory: create a fresh Keycloak instance each time
export const createKeycloak = (): Keycloak =>
  new Keycloak({
    url: import.meta.env.VITE_KEYCLOAK_URL,
    realm: import.meta.env.VITE_KEYCLOAK_REALM,
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
  });
