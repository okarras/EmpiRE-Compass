import { ReactKeycloakProvider } from '@react-keycloak/web';
import { keycloak } from './keycloak';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('[AuthProvider] mounted'); // <-- must appear on reload

  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={{
        onLoad: 'login-required',
        silentCheckSsoRedirectUri:
          window.location.origin + '/silent-check-sso.html',
        pkceMethod: 'S256',
        checkLoginIframe: false,
      }}
      autoRefreshToken
      onEvent={(event, error) => console.log('[KC event]', event, error || '')}
      onTokens={(tokens) => console.log('[KC tokens]', !!tokens?.token)}
    >
      {children}
    </ReactKeycloakProvider>
  );
}
