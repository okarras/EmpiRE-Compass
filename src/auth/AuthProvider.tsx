import { ReactKeycloakProvider } from '@react-keycloak/web';
import { getKeycloak } from './keycloak';
import KeycloakTokenRefresher from './KeycloakTokenRefresher';
import { AuthContextProvider } from './AuthContext';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get Keycloak instance (singleton)
  const keycloak = getKeycloak();

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
