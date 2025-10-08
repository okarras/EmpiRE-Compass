// Keycloak configuration for different environments
export const getKeycloakConfig = () => {
  const isProduction = import.meta.env.PROD;
  const isDevelopment = import.meta.env.DEV;

  // Base configuration
  const config = {
    url: import.meta.env.VITE_KEYCLOAK_URL,
    realm: import.meta.env.VITE_KEYCLOAK_REALM,
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
  };

  // Add redirect URI based on environment
  if (isProduction) {
    // Production redirect URI
    return {
      ...config,
      redirectUri: 'https://empire-compass.vercel.app/',
    };
  } else if (isDevelopment) {
    // Development redirect URI
    return {
      ...config,
      redirectUri: 'http://localhost:5173/',
    };
  }

  return config;
};
