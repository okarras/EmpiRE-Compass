import { jwtVerify, createRemoteJWKSet } from 'jose';

/**
 * Keycloak configuration
 * Defaults to ORKG Keycloak instance
 */
const parseClientIds = (value?: string | null): string[] => {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
};

export const getKeycloakConfig = () => {
  const url = process.env.KEYCLOAK_URL || 'https://accounts.orkg.org';
  const realm = process.env.KEYCLOAK_REALM || 'orkg';

  const configuredClientIds = parseClientIds(
    process.env.KEYCLOAK_CLIENT_IDS || process.env.KEYCLOAK_CLIENT_ID
  );

  const defaultClientIds = ['empire-compass-devel', 'empire-compass'];

  const clientIds = configuredClientIds.length
    ? configuredClientIds
    : defaultClientIds;

  return {
    url,
    realm,
    clientId: clientIds[0],
    clientIds,
  };
};

/**
 * Get Keycloak JWKS URL
 */
export const getKeycloakJWKSUrl = (): string => {
  const config = getKeycloakConfig();
  return `${config.url}/realms/${config.realm}/protocol/openid-connect/certs`;
};

/**
 * Create a remote JWKS set for Keycloak
 * This will fetch and cache the public keys from Keycloak
 */
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

export const getKeycloakJWKS = () => {
  if (!jwks) {
    const jwksUrl = getKeycloakJWKSUrl();
    jwks = createRemoteJWKSet(new URL(jwksUrl));
  }
  return jwks;
};

/**
 * Verify a Keycloak JWT token
 * @param token - The JWT token to verify
 * @returns Decoded token payload with user info
 */
export const verifyKeycloakToken = async (token: string) => {
  try {
    const config = getKeycloakConfig();
    const jwks = getKeycloakJWKS();

    // Verify the token signature and decode it
    // Note: We don't validate audience in jwtVerify because Keycloak tokens can have
    // different audience values ("account" for account API, or client ID)
    // We'll verify the authorized party (azp) manually after verification
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `${config.url}/realms/${config.realm}`,
      // Don't validate audience here - we'll check it manually below
    });

    // Verify the authorized party (azp) matches our client ID
    // This ensures the token was issued for our application
    const azp = payload.azp as string | undefined;
    const aud = payload.aud;

    const audienceValues: string[] = Array.isArray(aud)
      ? aud.map(String)
      : aud
        ? [String(aud)]
        : [];

    const hasClientIdInAudience = audienceValues.some((value) =>
      config.clientIds.includes(value)
    );

    const isAccountAudienceWithMatchingAzp =
      audienceValues.includes('account') &&
      azp !== undefined &&
      config.clientIds.includes(azp);

    if (!hasClientIdInAudience && !isAccountAudienceWithMatchingAzp) {
      throw new Error(
        `Token not issued for this client. Expected client IDs: ${config.clientIds.join(
          ', '
        )}, got azp: ${azp}, aud: ${JSON.stringify(aud)}`
      );
    }

    // Extract user info from token
    // Keycloak tokens typically have:
    // - sub: user ID
    // - email: user email
    // - preferred_username: username
    // - name: display name
    const userId = payload.sub;
    const userEmail =
      (payload.email as string) || (payload.preferred_username as string) || '';

    if (!userId) {
      throw new Error('Token missing user ID (sub claim)');
    }

    return {
      userId,
      userEmail,
      payload,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
    throw new Error('Token verification failed: Unknown error');
  }
};
