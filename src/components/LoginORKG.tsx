import { useKeycloak } from '@react-keycloak/web';

export default function LoginORKG() {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) {
    return <button disabled>Checking sign-in…</button>;
  }

  return keycloak.authenticated ? (
    <div>
      Signed in as{' '}
      {keycloak.tokenParsed?.email || keycloak.tokenParsed?.preferred_username}{' '}
      <br />
      <button
        onClick={() => keycloak.logout({ redirectUri: window.location.origin })}
      >
        Sign out
      </button>
    </div>
  ) : (
    <button onClick={() => keycloak.login()}>Sign in with ORKG</button>
  );
}
