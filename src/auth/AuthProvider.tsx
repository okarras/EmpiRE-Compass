import { ReactKeycloakProvider } from '@react-keycloak/web';
import { createKeycloak } from './keycloak';
import KeycloakTokenRefresher from './KeycloakTokenRefresher';
import { AuthContextProvider } from './AuthContext';
import { useEffect, useState } from 'react';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [useKeycloak, setUseKeycloak] = useState(false);
  // Get Keycloak instance (singleton)

  useEffect(() => {
    setUseKeycloak(true);
  }, []);

  if (!useKeycloak) {
    return <>{children}</>;
  }

  const keycloak = createKeycloak();
  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={{
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false,
      }}
      autoRefreshToken={true}
    >
      <KeycloakTokenRefresher />
      <AuthContextProvider>{children}</AuthContextProvider>
    </ReactKeycloakProvider>
  );
}
