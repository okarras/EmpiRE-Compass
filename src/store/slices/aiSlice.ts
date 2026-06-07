import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  OPENROUTER_DEFAULT_MODEL,
  type OpenRouterModel,
} from '../../constants/openrouter_models';
import {
  OPENAI_MODELS,
  GROQ_MODELS,
  MISTRAL_MODELS,
  GOOGLE_MODELS,
  type OpenAIModel,
  type GroqModel,
  type MistralModel,
  type GoogleModel,
  type AIProvider,
} from '@shared/aiModels';

export {
  OPENAI_MODELS,
  GROQ_MODELS,
  MISTRAL_MODELS,
  GOOGLE_MODELS,
  type OpenAIModel,
  type GroqModel,
  type MistralModel,
  type GoogleModel,
  type AIProvider,
};
export type { OpenRouterModel } from '../../constants/openrouter_models';

interface InitialState {
  provider: AIProvider;
  openaiModel: OpenAIModel;
  groqModel: GroqModel;
  mistralModel: MistralModel;
  googleModel: GoogleModel;
  openrouterModel: OpenRouterModel;
  openaiApiKey: string;
  groqApiKey: string;
  mistralApiKey: string;
  googleApiKey: string;
  openrouterApiKey: string;
  /** User accepted OpenRouter security terms (required to use AI) */
  openRouterTermsAccepted: boolean;
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

    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      Object.assign(config, {
        provider: parsed.provider,
        openaiModel: parsed.openaiModel,
        groqModel: parsed.groqModel,
        mistralModel: parsed.mistralModel,
        googleModel: parsed.googleModel,
        openrouterModel: parsed.openrouterModel,
        openRouterTermsAccepted: parsed.openRouterTermsAccepted,
        useEnvironmentKeys: parsed.useEnvironmentKeys,
        isConfigured: parsed.isConfigured, // We'll re-verify this below
      });
    }

    const savedKeys = sessionStorage.getItem(STORAGE_KEYS.KEYS);
    if (savedKeys) {
      const parsedKeys = JSON.parse(savedKeys);
      Object.assign(config, {
        openaiApiKey: parsedKeys.openaiApiKey || '',
        groqApiKey: parsedKeys.groqApiKey || '',
        mistralApiKey: parsedKeys.mistralApiKey || '',
        googleApiKey: parsedKeys.googleApiKey || '',
        openrouterApiKey: parsedKeys.openrouterApiKey || '',
      });
    }

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
          openrouterModel: parsedLegacy.openrouterModel,
          openRouterTermsAccepted: parsedLegacy.openRouterTermsAccepted,
          useEnvironmentKeys: parsedLegacy.useEnvironmentKeys,
        });
      }
      // WE DO NOT MIGRATE KEYS automatically to enforce security.
      // Users must re-enter keys.
      // Clean up legacy storage to ensure no keys remain on disk
      localStorage.removeItem(STORAGE_KEYS.LEGACY);
    }

    // OpenRouter-only: provider and keys are normalized below

    return config;
  } catch (error) {
    console.warn('Failed to load AI configuration:', error);
  }
  return {};
};

const isOpenRouterModel = (m: unknown): m is OpenRouterModel =>
  typeof m === 'string' && m.trim().length > 0;

// Split saving logic
const saveSettings = (state: InitialState) => {
  try {
    const settings = {
      provider: state.provider,
      openaiModel: state.openaiModel,
      groqModel: state.groqModel,
      mistralModel: state.mistralModel,
      googleModel: state.googleModel,
      openrouterModel: state.openrouterModel,
      openRouterTermsAccepted: state.openRouterTermsAccepted,
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
      openrouterApiKey: state.openrouterApiKey,
    };
    sessionStorage.setItem(STORAGE_KEYS.KEYS, JSON.stringify(keys));
  } catch (error) {
    console.warn('Failed to save AI keys to sessionStorage:', error);
  }
};

const defaultConfig: InitialState = {
  provider: 'openrouter',
  openaiModel: 'gpt-4o-mini',
  groqModel: 'llama-3.1-8b-instant',
  mistralModel: 'mistral-large-latest',
  googleModel: 'gemini-2.5-flash',
  openrouterModel: OPENROUTER_DEFAULT_MODEL,
  openaiApiKey: '',
  groqApiKey: '',
  mistralApiKey: '',
  googleApiKey: '',
  openrouterApiKey: '',
  openRouterTermsAccepted: false,
  isConfigured: false,
  useEnvironmentKeys: false,
};

/** System AI (env keys on server) vs personal OpenRouter key */
const computeIsConfigured = (state: InitialState): boolean => {
  if (state.useEnvironmentKeys) {
    return true;
  }
  if (state.provider === 'openrouter') {
    return (
      state.openrouterApiKey.trim().length > 0 && state.openRouterTermsAccepted
    );
  }
  return false;
};

const normalizeAIState = (state: InitialState): void => {
  if (!isOpenRouterModel(state.openrouterModel)) {
    state.openrouterModel = OPENROUTER_DEFAULT_MODEL;
  }
  if (typeof state.openRouterTermsAccepted !== 'boolean') {
    state.openRouterTermsAccepted = false;
  }
  if (typeof state.useEnvironmentKeys !== 'boolean') {
    state.useEnvironmentKeys = false;
  }
  if (state.useEnvironmentKeys && state.provider !== 'openrouter') {
    state.provider = 'openrouter';
  }
  state.isConfigured = computeIsConfigured(state);
};

const initialState: InitialState = {
  ...defaultConfig,
  ...loadAIConfig(),
};

normalizeAIState(initialState);

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setProvider: (state, action: PayloadAction<AIProvider>) => {
      state.provider = action.payload;
      state.isConfigured = computeIsConfigured(state);
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
    setOpenRouterModel: (state, action: PayloadAction<string>) => {
      state.openrouterModel = action.payload;
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
    setOpenRouterApiKey: (state, action: PayloadAction<string>) => {
      state.openrouterApiKey = action.payload;
      state.isConfigured = computeIsConfigured(state);
      saveKeys(state);
      saveSettings(state);
    },
    setOpenRouterTermsAccepted: (state, action: PayloadAction<boolean>) => {
      state.openRouterTermsAccepted = action.payload;
      state.isConfigured = computeIsConfigured(state);
      saveSettings(state);
    },
    setIsConfigured: (state, action: PayloadAction<boolean>) => {
      state.isConfigured = action.payload;
      saveSettings(state);
    },
    setUseEnvironmentKeys: (state, action: PayloadAction<boolean>) => {
      state.useEnvironmentKeys = action.payload;
      state.isConfigured = computeIsConfigured(state);
      saveSettings(state);
    },
    resetConfiguration: (state) => {
      state.openaiApiKey = '';
      state.groqApiKey = '';
      state.mistralApiKey = '';
      state.googleApiKey = '';
      state.openrouterApiKey = '';
      state.openRouterTermsAccepted = false;
      state.useEnvironmentKeys = false;
      state.provider = 'openrouter';
      state.openrouterModel = OPENROUTER_DEFAULT_MODEL;
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
  setOpenRouterModel,
  setOpenAIApiKey,
  setGroqApiKey,
  setMistralApiKey,
  setGoogleApiKey,
  setOpenRouterApiKey,
  setOpenRouterTermsAccepted,
  setIsConfigured,
  setUseEnvironmentKeys,
  resetConfiguration,
  clearStoredConfiguration,
} = aiSlice.actions;

export default aiSlice.reducer;
