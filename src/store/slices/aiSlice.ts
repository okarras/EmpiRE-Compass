import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Available models for each provider
export const OPENAI_MODELS = [
  // Frontier models - OpenAI's most advanced models
  'gpt-5.1',
  'gpt-5-mini',
  'gpt-5-nano',
  'gpt-5-pro',
  'gpt-5',
  'gpt-4.1',
  // Previous generation models
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-4o-2024-08-06',
  'gpt-4-turbo-2024-04-09',
  'o1-preview',
  'o1-mini',
  'gpt-4',
  'gpt-3.5-turbo',
] as const;

export const GROQ_MODELS = [
  'llama-3.1-8b-instant',
  'llama-3.1-70b-versatile',
  'llama-3.1-405b-reasoning',
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
] as const;

export const MISTRAL_MODELS = [
  'mistral-large-latest',
  'mistral-medium-latest',
  'mistral-small-latest',
  'pixtral-large-latest',
  'open-mistral-nemo',
] as const;

export const GOOGLE_MODELS = [
  // Gemini 3 series
  'gemini-3-pro-preview',
  // Gemini 2.5 series
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  // Gemini 2.0 series
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash-lite',
  // Gemini 1.5 series
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  // Other models
  'gemma-3-27b-it',
] as const;

export type OpenAIModel = (typeof OPENAI_MODELS)[number];
export type GroqModel = (typeof GROQ_MODELS)[number];
export type MistralModel = (typeof MISTRAL_MODELS)[number];
export type GoogleModel = (typeof GOOGLE_MODELS)[number];
export type AIProvider = 'openai' | 'groq' | 'mistral' | 'google';

interface InitialState {
  provider: AIProvider;
  openaiModel: OpenAIModel;
  groqModel: GroqModel;
  mistralModel: MistralModel;
  googleModel: GoogleModel;
  openaiApiKey: string;
  groqApiKey: string;
  mistralApiKey: string;
  googleApiKey: string;
  isConfigured: boolean;
  useEnvironmentKeys: boolean;
}

// Security: Keys are stored in sessionStorage only (cleared on tab close)
// Settings: Stored in localStorage (persist across sessions)

const STORAGE_KEYS = {
  SETTINGS: 'ai-configuration-settings', // non-sensitive settings
  KEYS: 'ai-configuration-keys', // sensitive api keys
  LEGACY: 'ai-configuration', // old insecure storage
};

const loadAIConfig = (): Partial<InitialState> => {
  try {
    const config: Partial<InitialState> = {};

    // 1. Load non-sensitive settings from localStorage
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      Object.assign(config, {
        provider: parsed.provider,
        openaiModel: parsed.openaiModel,
        groqModel: parsed.groqModel,
        mistralModel: parsed.mistralModel,
        googleModel: parsed.googleModel,
        useEnvironmentKeys: parsed.useEnvironmentKeys,
        isConfigured: parsed.isConfigured, // We'll re-verify this below
      });
    }

    // 2. Load sensitive keys from sessionStorage
    const savedKeys = sessionStorage.getItem(STORAGE_KEYS.KEYS);
    if (savedKeys) {
      const parsedKeys = JSON.parse(savedKeys);
      Object.assign(config, {
        openaiApiKey: parsedKeys.openaiApiKey || '',
        groqApiKey: parsedKeys.groqApiKey || '',
        mistralApiKey: parsedKeys.mistralApiKey || '',
        googleApiKey: parsedKeys.googleApiKey || '',
      });
    }

    // 3. Migration: Check for legacy localStorage and clean it up if it holds keys
    const legacyConfig = localStorage.getItem(STORAGE_KEYS.LEGACY);
    if (legacyConfig) {
      const parsedLegacy = JSON.parse(legacyConfig);
      // Migrate settings if not already present
      if (!savedSettings) {
        Object.assign(config, {
          provider: parsedLegacy.provider,
          openaiModel: parsedLegacy.openaiModel,
          groqModel: parsedLegacy.groqModel,
          mistralModel: parsedLegacy.mistralModel,
          googleModel: parsedLegacy.googleModel,
          useEnvironmentKeys: parsedLegacy.useEnvironmentKeys,
        });
      }
      // WE DO NOT MIGRATE KEYS automatically to enforce security.
      // Users must re-enter keys.
      // Clean up legacy storage to ensure no keys remain on disk
      localStorage.removeItem(STORAGE_KEYS.LEGACY);
    }

    // Re-verify isConfigured based on the potentially empty keys
    // If not using env keys, and no keys loaded from session, it's not configured
    if (config.useEnvironmentKeys === false) {
      const hasKey =
        config.openaiApiKey ||
        config.groqApiKey ||
        config.mistralApiKey ||
        config.googleApiKey;
      if (!hasKey) {
        config.isConfigured = false;
      }
    }

    return config;
  } catch (error) {
    console.warn('Failed to load AI configuration:', error);
  }
  return {};
};

// Split saving logic
const saveSettings = (state: InitialState) => {
  try {
    const settings = {
      provider: state.provider,
      openaiModel: state.openaiModel,
      groqModel: state.groqModel,
      mistralModel: state.mistralModel,
      googleModel: state.googleModel,
      useEnvironmentKeys: state.useEnvironmentKeys,
      isConfigured: state.isConfigured,
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save AI settings to localStorage:', error);
  }
};

const saveKeys = (state: InitialState) => {
  try {
    const keys = {
      openaiApiKey: state.openaiApiKey,
      groqApiKey: state.groqApiKey,
      mistralApiKey: state.mistralApiKey,
      googleApiKey: state.googleApiKey,
    };
    sessionStorage.setItem(STORAGE_KEYS.KEYS, JSON.stringify(keys));
  } catch (error) {
    console.warn('Failed to save AI keys to sessionStorage:', error);
  }
};

const defaultConfig: InitialState = {
  provider: 'openai',
  openaiModel: 'gpt-4o-mini',
  groqModel: 'llama-3.1-8b-instant',
  mistralModel: 'mistral-large-latest',
  googleModel: 'gemini-2.5-flash',
  openaiApiKey: '',
  groqApiKey: '',
  mistralApiKey: '',
  googleApiKey: '',
  isConfigured: true,
  useEnvironmentKeys: true,
};

const initialState: InitialState = {
  ...defaultConfig,
  ...loadAIConfig(),
};

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setProvider: (state, action: PayloadAction<AIProvider>) => {
      state.provider = action.payload;
      saveSettings(state);
    },
    setOpenAIModel: (state, action: PayloadAction<OpenAIModel>) => {
      state.openaiModel = action.payload;
      saveSettings(state);
    },
    setGroqModel: (state, action: PayloadAction<GroqModel>) => {
      state.groqModel = action.payload;
      saveSettings(state);
    },
    setMistralModel: (state, action: PayloadAction<MistralModel>) => {
      state.mistralModel = action.payload;
      saveSettings(state);
    },
    setGoogleModel: (state, action: PayloadAction<GoogleModel>) => {
      state.googleModel = action.payload;
      saveSettings(state);
    },
    setOpenAIApiKey: (state, action: PayloadAction<string>) => {
      state.openaiApiKey = action.payload;
      saveKeys(state);
    },
    setGroqApiKey: (state, action: PayloadAction<string>) => {
      state.groqApiKey = action.payload;
      saveKeys(state);
    },
    setMistralApiKey: (state, action: PayloadAction<string>) => {
      state.mistralApiKey = action.payload;
      saveKeys(state);
    },
    setGoogleApiKey: (state, action: PayloadAction<string>) => {
      state.googleApiKey = action.payload;
      saveKeys(state);
    },
    setIsConfigured: (state, action: PayloadAction<boolean>) => {
      state.isConfigured = action.payload;
      saveSettings(state);
    },
    setUseEnvironmentKeys: (state, action: PayloadAction<boolean>) => {
      state.useEnvironmentKeys = action.payload;
      saveSettings(state);
    },
    resetConfiguration: (state) => {
      state.openaiApiKey = '';
      state.groqApiKey = '';
      state.mistralApiKey = '';
      state.googleApiKey = '';
      state.isConfigured = false;
      saveKeys(state);
      saveSettings(state);
    },
    clearStoredConfiguration: () => {
      try {
        localStorage.removeItem(STORAGE_KEYS.SETTINGS);
        localStorage.removeItem(STORAGE_KEYS.LEGACY);
        sessionStorage.removeItem(STORAGE_KEYS.KEYS);
      } catch (error) {
        console.warn('Failed to clear AI configuration from storage:', error);
      }
    },
  },
});

export const {
  setProvider,
  setOpenAIModel,
  setGroqModel,
  setMistralModel,
  setGoogleModel,
  setOpenAIApiKey,
  setGroqApiKey,
  setMistralApiKey,
  setGoogleApiKey,
  setIsConfigured,
  setUseEnvironmentKeys,
  resetConfiguration,
  clearStoredConfiguration,
} = aiSlice.actions;

export default aiSlice.reducer;
