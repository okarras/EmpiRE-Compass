interface UserData {
  name: string;
  email: string;
  uid: string;
}

/**
 * Helper function to validate token and extract user data
 */
export const getUserFromToken = (
  tokenParsed: Record<string, unknown>
): UserData | null => {
  if (!tokenParsed || !tokenParsed.sub) {
    return null;
  }

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  const exp = tokenParsed.exp as number;
  if (exp && exp < now) {
    console.warn('Token is expired');
    return null;
  }

  return {
    name:
      (tokenParsed.name as string) ||
      (tokenParsed.preferred_username as string) ||
      'User',
    email: (tokenParsed.email as string) || '',
    uid: tokenParsed.sub as string,
  };
};
