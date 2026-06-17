import { describe, expect, it } from 'vitest';
import { UnifiedAIService } from './backendAIService';
import type { AIProvider } from '../store/slices/aiSlice';

type ServiceConfig = ConstructorParameters<typeof UnifiedAIService>[0];

const baseConfig: ServiceConfig = {
  provider: 'openai',
  openaiModel: 'gpt-4o-mini',
  groqModel: 'llama-3.1-8b-instant',
  mistralModel: 'mistral-large-latest',
  googleModel: 'gemini-2.5-flash',
  openrouterModel: 'openai/gpt-4o-mini',
  openaiApiKey: '',
  groqApiKey: '',
  mistralApiKey: '',
  googleApiKey: '',
  openrouterApiKey: '',
  openRouterTermsAccepted: false,
  useEnvironmentKeys: false,
};

const shouldUseFrontend = (config: ServiceConfig) => {
  const service = new UnifiedAIService(config);
  return (
    service as unknown as { shouldUseFrontend: () => boolean }
  ).shouldUseFrontend();
};

describe('UnifiedAIService routing', () => {
  it('routes to frontend when user provides OpenAI key', () => {
    expect(
      shouldUseFrontend({ ...baseConfig, openaiApiKey: 'sk-user-key' })
    ).toBe(true);
  });

  it('routes to backend for OpenRouter provider', () => {
    expect(
      shouldUseFrontend({
        ...baseConfig,
        provider: 'openrouter' as AIProvider,
        openrouterApiKey: 'or-key',
        openRouterTermsAccepted: true,
      })
    ).toBe(false);
  });

  it('routes to backend when useEnvironmentKeys is true', () => {
    expect(
      shouldUseFrontend({
        ...baseConfig,
        openaiApiKey: 'sk-user-key',
        useEnvironmentKeys: true,
      })
    ).toBe(false);
  });

  it('routes to backend when no user keys are configured', () => {
    expect(shouldUseFrontend(baseConfig)).toBe(false);
  });

  it('routes to frontend for Groq when groq key is set', () => {
    expect(
      shouldUseFrontend({
        ...baseConfig,
        provider: 'groq' as AIProvider,
        groqApiKey: 'gsk-key',
      })
    ).toBe(true);
  });
});
