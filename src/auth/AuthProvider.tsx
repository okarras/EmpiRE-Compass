import { ReactKeycloakProvider } from '@react-keycloak/web';
import { createKeycloak } from './keycloak';
import KeycloakTokenRefresher from './KeycloakTokenRefresher';
import { AuthContextProvider } from './AuthContext';
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [useKeycloak, setUseKeycloak] = useState(false);
  const location = useLocation();
  // Get Keycloak instance (singleton)

  useEffect(() => {
    // Disable Keycloak on the main home page ('/')
    if (
      location.pathname === '/dynamic-question' ||
      location.pathname === '/'
    ) {
      setUseKeycloak(false);
    } else {
      setUseKeycloak(true);
    }
  }, [location.pathname]);
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
