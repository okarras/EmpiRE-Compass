import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Available models for each provider
export const OPENAI_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
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
  'whisper-large-v3',
  'mixtral-8x7b-32768',
  'deepseek-r1-distill-llama-70b',
] as const;

export const MISTRAL_MODELS = [
  'mistral-large-latest',
  'mistral-medium-latest',
  'mistral-small-latest',
  'pixtral-large-latest',
  'open-mistral-nemo',
] as const;

export type OpenAIModel = (typeof OPENAI_MODELS)[number];
export type GroqModel = (typeof GROQ_MODELS)[number];
export type MistralModel = (typeof MISTRAL_MODELS)[number];
export type AIProvider = 'openai' | 'groq' | 'mistral';

interface InitialState {
  provider: AIProvider;
  openaiModel: OpenAIModel;
  groqModel: GroqModel;
  mistralModel: MistralModel;
  openaiApiKey: string;
  groqApiKey: string;
  mistralApiKey: string;
  isConfigured: boolean;
  useEnvironmentKeys: boolean;
}

// Load configuration from localStorage
const loadAIConfig = (): Partial<InitialState> => {
  try {
    const savedConfig = localStorage.getItem('ai-configuration');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      return {
        provider: parsed.provider || 'mistral',
        openaiModel: parsed.openaiModel || 'gpt-4o-mini',
        groqModel: parsed.groqModel || 'llama-3.1-8b-instant',
        mistralModel: parsed.mistralModel || 'mistral-large-latest',
        openaiApiKey: parsed.openaiApiKey || '',
        groqApiKey: parsed.groqApiKey || '',
        mistralApiKey: parsed.mistralApiKey || '',
        isConfigured: parsed.isConfigured || false,
        useEnvironmentKeys:
          parsed.useEnvironmentKeys !== undefined
            ? parsed.useEnvironmentKeys
            : false,
      };
    }
  } catch (error) {
    console.warn('Failed to load AI configuration from localStorage:', error);
  }
  return {};
};

// Save configuration to localStorage
const saveAIConfig = (config: InitialState) => {
  try {
    localStorage.setItem('ai-configuration', JSON.stringify(config));
  } catch (error) {
    console.warn('Failed to save AI configuration to localStorage:', error);
  }
};

const defaultConfig: InitialState = {
  provider: 'mistral',
  openaiModel: 'gpt-4o-mini',
  groqModel: 'llama-3.1-8b-instant',
  mistralModel: 'mistral-large-latest',
  openaiApiKey: '',
  groqApiKey: '',
  mistralApiKey: '',
  isConfigured: false,
  useEnvironmentKeys: false,
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
      saveAIConfig(state);
    },
    setOpenAIModel: (state, action: PayloadAction<OpenAIModel>) => {
      state.openaiModel = action.payload;
      saveAIConfig(state);
    },
    setGroqModel: (state, action: PayloadAction<GroqModel>) => {
      state.groqModel = action.payload;
      saveAIConfig(state);
    },
    setMistralModel: (state, action: PayloadAction<MistralModel>) => {
      state.mistralModel = action.payload;
      saveAIConfig(state);
    },
    setOpenAIApiKey: (state, action: PayloadAction<string>) => {
      state.openaiApiKey = action.payload;
      saveAIConfig(state);
    },
    setGroqApiKey: (state, action: PayloadAction<string>) => {
      state.groqApiKey = action.payload;
      saveAIConfig(state);
    },
    setMistralApiKey: (state, action: PayloadAction<string>) => {
      state.mistralApiKey = action.payload;
      saveAIConfig(state);
    },
    setIsConfigured: (state, action: PayloadAction<boolean>) => {
      state.isConfigured = action.payload;
      saveAIConfig(state);
    },
    setUseEnvironmentKeys: (state, action: PayloadAction<boolean>) => {
      state.useEnvironmentKeys = action.payload;
      saveAIConfig(state);
    },
    resetConfiguration: (state) => {
      state.openaiApiKey = '';
      state.groqApiKey = '';
      state.mistralApiKey = '';
      state.isConfigured = false;
      saveAIConfig(state);
    },
    clearStoredConfiguration: () => {
      try {
        localStorage.removeItem('ai-configuration');
      } catch (error) {
        console.warn(
          'Failed to clear AI configuration from localStorage:',
          error
        );
      }
    },
  },
});

export const {
  setProvider,
  setOpenAIModel,
  setGroqModel,
  setMistralModel,
  setOpenAIApiKey,
  setGroqApiKey,
  setMistralApiKey,
  setIsConfigured,
  setUseEnvironmentKeys,
  resetConfiguration,
  clearStoredConfiguration,
} = aiSlice.actions;

export default aiSlice.reducer;
