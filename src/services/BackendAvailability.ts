let backendAvailableCache: boolean | null = null;
let lastCheckTime: number = 0;
const CACHE_DURATION = 30000; // Cache for 30 seconds

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

export const isLiveMode = async (): Promise<boolean> => {
  return await checkBackendAvailability();
};

export const clearBackendAvailabilityCache = () => {
  backendAvailableCache = null;
  lastCheckTime = 0;
};
