import * as React from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { Button, Stack, Typography } from '@mui/material';

export default function LoginORKG() {
  const { keycloak, initialized } = useKeycloak();
  const [timedOut, setTimedOut] = React.useState(false);

  // If silent SSO can't finish (cookies/CSP), show manual button after 2.5s.
  React.useEffect(() => {
    const id = setTimeout(() => setTimedOut(true), 2500);
    return () => clearTimeout(id);
  }, []);

  if (!initialized && !timedOut) {
    return (
      <Typography variant="body2" color="text.secondary">
        Checking sign-in…
      </Typography>
    );
  }

  if (!initialized && timedOut) {
    return (
      <Button variant="contained" size="small" onClick={() => keycloak.login()}>
        Sign in with ORKG
      </Button>
    );
  }

  if (!keycloak.authenticated) {
    return (
      <Button variant="contained" size="small" onClick={() => keycloak.login()}>
        Sign in with ORKG
      </Button>
    );
  }

  const user =
    (keycloak.tokenParsed?.email as string) ||
    (keycloak.tokenParsed?.preferred_username as string) ||
    'User';

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography variant="body2" color="text.secondary">
        Signed in as <strong>{user}</strong>
      </Typography>
      <Button
        variant="outlined"
        size="small"
        onClick={() => keycloak.logout({ redirectUri: window.location.origin })}
      >
        Sign out
      </Button>
    </Stack>
  );
}
