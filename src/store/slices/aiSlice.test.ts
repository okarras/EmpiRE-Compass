import { beforeEach, describe, expect, it, vi } from 'vitest';

const SETTINGS_KEY = 'ai-configuration-settings';

function installStorage() {
  const memory = new Map<string, string>();
  const storage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
    removeItem: (key: string) => {
      memory.delete(key);
    },
    clear: () => {
      memory.clear();
    },
  };
  vi.stubGlobal('localStorage', storage);
  vi.stubGlobal('sessionStorage', {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
  });
  return storage;
}

describe('ai configuration hydration', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('keeps the system provider after reload while system default stays selected', async () => {
    const storage = installStorage();
    storage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        provider: 'google',
        googleModel: 'gemini-2.5-flash',
        openaiModel: 'gpt-4o-mini',
        groqModel: 'llama-3.1-8b-instant',
        mistralModel: 'mistral-large-latest',
        openrouterModel: 'openai/gpt-oss-120b',
        openRouterTermsAccepted: false,
        useEnvironmentKeys: true,
        isConfigured: true,
      })
    );

    const { default: reducer } = await import('./aiSlice');
    const state = reducer(undefined, { type: '@@INIT' });

    expect(state.useEnvironmentKeys).toBe(true);
    expect(state.provider).toBe('google');
    expect(state.googleModel).toBe('gemini-2.5-flash');
  });

  it('does not rewrite the provider to OpenRouter when system default is enabled', async () => {
    installStorage();
    const { default: reducer, setUseEnvironmentKeys } = await import(
      './aiSlice'
    );
    const initial = reducer(undefined, { type: '@@INIT' });
    const next = reducer(
      { ...initial, provider: 'mistral' },
      setUseEnvironmentKeys(true)
    );

    expect(next.useEnvironmentKeys).toBe(true);
    expect(next.provider).toBe('mistral');
  });
});
