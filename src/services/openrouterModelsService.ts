import { getKeycloakToken } from '../auth/keycloakStore';

/**
 * Fetches the public OpenRouter model catalog (proxied via our backend to avoid CORS).
 * @see https://openrouter.ai/docs/api-reference/models/get-models
 */

export interface OpenRouterApiModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  created?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
    request?: string;
    image?: string;
    web_search?: string;
  };
  architecture?: {
    modality?: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };
  top_provider?: {
    context_length?: number;
    max_completion_tokens?: number;
    is_moderated?: boolean;
  };
}

export interface OpenRouterModelsResponse {
  data: OpenRouterApiModel[];
}

export function getBackendBaseUrl(): string {
  if (typeof window === 'undefined') {
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
  }
  const isVercel =
    window.location.hostname.includes('.vercel.app') ||
    window.location.hostname.includes('.vercel');

  if (isVercel) {
    return (
      import.meta.env.VITE_BACKEND_FEATURE_URL ||
      import.meta.env.VITE_BACKEND_URL ||
      'http://localhost:5001'
    );
  }
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
}

let cache: { models: OpenRouterApiModel[]; fetchedAt: number } | null = null;
const TTL_MS = 10 * 60 * 1000;

/** OpenRouter returns USD per token; convert to USD per 1M tokens for display */
export function openRouterUsdPerMillion(
  tokenPriceStr: string | undefined
): number | null {
  const n = Number(tokenPriceStr);
  if (!Number.isFinite(n)) return null;
  return n * 1_000_000;
}

export function formatUsdPerM(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n < 0.01) return `$${n.toFixed(6)}`;
  return `$${n.toFixed(4)}`;
}

/**
 * @param force - bypass cache
 */
export async function fetchOpenRouterModels(options?: {
  signal?: AbortSignal;
  force?: boolean;
}): Promise<OpenRouterApiModel[]> {
  if (!options?.force && cache && Date.now() - cache.fetchedAt < TTL_MS) {
    return cache.models;
  }

  const base = getBackendBaseUrl().replace(/\/$/, '');
  const url = `${base}/api/ai/openrouter-models`;
  const res = await fetch(url, {
    signal: options?.signal,
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg =
      typeof errBody.error === 'string'
        ? errBody.error
        : `Failed to load models (${res.status})`;
    throw new Error(msg);
  }

  const json = (await res.json()) as OpenRouterModelsResponse;
  const raw = Array.isArray(json.data) ? json.data : [];
  const models = raw
    .filter((m) => m && typeof m.id === 'string' && m.id.length > 0)
    .map((m) => ({
      ...m,
      name: typeof m.name === 'string' && m.name.trim() ? m.name : m.id,
    }))
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );

  cache = { models, fetchedAt: Date.now() };
  return models;
}

export function clearOpenRouterModelsCache(): void {
  cache = null;
}

/** Same auth pattern as BackendAIService.makeRequest (Keycloak + dev headers). */
function buildBackendAuthHeaders(): Record<string, string> {
  const token = getKeycloakToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  const isDev = import.meta.env.DEV;

  const decodeJWT = (t: string): { userId?: string; userEmail?: string } => {
    try {
      const parts = t.split('.');
      if (parts.length !== 3) return {};
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const parsed = JSON.parse(atob(padded));
      return {
        userId: parsed.sub || parsed.userId,
        userEmail: parsed.email || parsed.preferred_username,
      };
    } catch {
      return {};
    }
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    if (isDev) {
      const u = decodeJWT(token);
      if (u.userId) headers['x-user-id'] = u.userId;
      if (u.userEmail) headers['x-user-email'] = u.userEmail;
    }
  } else if (isDev && typeof window !== 'undefined') {
    try {
      const authData = localStorage.getItem('auth-data');
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.userId) headers['x-user-id'] = parsed.userId;
        if (parsed.userEmail) headers['x-user-email'] = parsed.userEmail;
      }
    } catch {
      /* ignore */
    }
  }

  return headers;
}

export interface BackendAiConfigResponse {
  provider: string;
  model: string;
  apiKeyConfigured: boolean;
}

/** GET /api/ai/config — server default provider and model (requires same auth as other AI routes). */
export async function fetchBackendAiConfig(): Promise<BackendAiConfigResponse | null> {
  const base = getBackendBaseUrl().replace(/\/$/, '');
  const res = await fetch(`${base}/api/ai/config`, {
    headers: buildBackendAuthHeaders(),
  });
  if (!res.ok) return null;
  return res.json() as Promise<BackendAiConfigResponse>;
}
