import { jwtVerify, createRemoteJWKSet } from 'jose';

/**
 * Keycloak configuration
 * Defaults to ORKG Keycloak instance
 */
export const getKeycloakConfig = () => {
  return {
    url: process.env.KEYCLOAK_URL || 'https://accounts.orkg.org',
    realm: process.env.KEYCLOAK_REALM || 'orkg',
    clientId: process.env.KEYCLOAK_CLIENT_ID || 'empire-compass-devel',
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

    // Check if token is for our client
    // Keycloak tokens can have:
    // - aud: "account" (for account API) with azp: clientId - VALID if azp matches
    // - aud: clientId (direct client token) - VALID
    // - aud: [clientId, "account"] (array with both) - VALID if contains clientId
    const hasClientIdInAudience =
      aud === config.clientId ||
      (Array.isArray(aud) && aud.includes(config.clientId));

    const isAccountAudienceWithMatchingAzp =
      aud === 'account' && azp === config.clientId;

    if (!hasClientIdInAudience && !isAccountAudienceWithMatchingAzp) {
      throw new Error(
        `Token not issued for this client. Expected client: ${config.clientId}, got azp: ${azp}, aud: ${JSON.stringify(aud)}`
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
