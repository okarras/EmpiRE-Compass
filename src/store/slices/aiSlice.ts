import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface InitialState {
  model: string;
  apiProvider: 'openai' | 'groq';
  apiKey: string;
}

const initialState: InitialState = {
  model: 'gpt-4o-mini',
  apiProvider: 'openai',
  apiKey: '',
};

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setModel: (state, action: PayloadAction<string>) => {
      state.model = action.payload;
    },
    setApiProvider: (state, action: PayloadAction<'openai' | 'groq'>) => {
      state.apiProvider = action.payload;
    },
    setApiKey: (state, action: PayloadAction<string>) => {
      state.apiKey = action.payload;
    },
  },
});

export const { setModel, setApiProvider, setApiKey } = aiSlice.actions;

export default aiSlice.reducer;
