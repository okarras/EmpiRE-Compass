/**
 * Service to check if backend API is available (live mode)
 */

let backendAvailableCache: boolean | null = null;
let lastCheckTime: number = 0;
const CACHE_DURATION = 30000; // Cache for 30 seconds

/**
 * Check if backend API is available
 */
export const checkBackendAvailability = async (): Promise<boolean> => {
  const now = Date.now();

  // Return cached result if still valid
  if (backendAvailableCache !== null && now - lastCheckTime < CACHE_DURATION) {
    return backendAvailableCache;
  }

  try {
    const backendUrl =
      import.meta.env.VITE_BACKEND_URL ||
      'https://empirecompassbackend.vercel.app';
    const response = await fetch(`${backendUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      backendAvailableCache = true;
      lastCheckTime = now;
      return true;
    }
  } catch (error) {
    // Backend is not available
    console.debug('Backend not available:', error);
  }

  backendAvailableCache = false;
  lastCheckTime = now;
  return false;
};

/**
 * Check if we're in live mode (backend available)
 */
export const isLiveMode = async (): Promise<boolean> => {
  return await checkBackendAvailability();
};

/**
 * Clear the cache (useful for testing or when backend status changes)
 */
export const clearBackendAvailabilityCache = () => {
  backendAvailableCache = null;
  lastCheckTime = 0;
};
