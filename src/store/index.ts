import { configureStore } from '@reduxjs/toolkit';
import questionReducer from './slices/questionSlice';
import aiReducer from './slices/aiSlice';

export const store = configureStore({
  reducer: {
    questions: questionReducer,
    ai: aiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['questions/fetchQuestions/fulfilled'],
        // Ignore these field paths in all actions
        ignoredActionPaths: [
          'payload.dataProcessingFunction',
          'payload.dataProcessingFunction2',
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          'questions.questions.dataProcessingFunction',
          'questions.questions.dataProcessingFunction2',
        ],
      },
    }),
});

// Export types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
