import { ReactKeycloakProvider } from '@react-keycloak/web';
import { keycloak } from './keycloak';
import KeycloakTokenRefresher from './KeycloakTokenRefresher';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('[AuthProvider] mounted');

  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={{
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri:
          window.location.origin + '/silent-check-sso.html',
        pkceMethod: 'S256',
        checkLoginIframe: false,
      }}
      autoRefreshToken={false}
      onEvent={(event, error) => console.log('[KC event]', event, error || '')}
      onTokens={(tokens) => console.log('[KC tokens]', !!tokens?.token)}
    >
      <KeycloakTokenRefresher />
      {children}
    </ReactKeycloakProvider>
  );
}
