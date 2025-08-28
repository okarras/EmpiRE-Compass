import { configureStore } from '@reduxjs/toolkit';
import questionReducer from './slices/questionSlice';
import aiReducer from './slices/aiSlice';

export const store = configureStore({
  reducer: {
    questions: questionReducer,
    ai: aiReducer,
  },
});

// Export types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
