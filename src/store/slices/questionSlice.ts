/* eslint-disable @typescript-eslint/ban-ts-comment */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Query } from '../../constants/queries_chart_info';
import CRUDQuestions from '../../firestore/CRUDQuestions';
import fetchSPARQLData from '../../helpers/fetch_query';
import { getTemplateConfig } from '../../constants/template_config';

export interface FirebaseQuestion {
  id: number;
  title: string;
  uid: string;
  dataAnalysisInformation: {
    question: string;
    dataAnalysis: string | string[];
    requiredDataForAnalysis: string | string[];
    questionExplanation: string;
    dataInterpretation: string | string[];
  };
}

interface QuestionState {
  questions: Query[];
  firebaseQuestions: Record<string, unknown>;
  currentQuestion: Query | null;
  questionData: Record<string, Record<string, unknown>[]>;
  loading: {
    questions: boolean;
    questionData: boolean;
  };
  error: {
    questions: string | null;
    questionData: string | null;
  };
  normalized: boolean;
}

const initialState: QuestionState = {
  questions: [],
  firebaseQuestions: {},
  currentQuestion: null,
  questionData: {},
  loading: {
    questions: false,
    questionData: false,
  },
  error: {
    questions: null,
    questionData: null,
  },
  normalized: true,
};

const getTemplateResources = (templateId: string) => {
  const config = getTemplateConfig(templateId);

  return {
    queries: config.queries,
    sparql: config.sparql,
  };
};

// Helper function to strip functions from an object (for Redux serialization)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripFunctions = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(stripFunctions);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {};
  for (const key in obj) {
    if (typeof obj[key] !== 'function') {
      result[key] = stripFunctions(obj[key]);
    }
  }
  return result;
};

// Helper function to merge Firebase data with local queries
// Returns questions with functions for use in components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mergeQuestionsData = (firebaseQuestions: any[], templateId: string) => {
  const { queries } = getTemplateResources(templateId);
  const questionsMap = new Map(firebaseQuestions.map((q) => [q.uid, q]));

  return [...queries]
    .map((query) => {
      const firebaseData = questionsMap.get(query.uid);
      if (!firebaseData) {
        // Only log warning for queries that should exist (not secondary UIDs)
        // Secondary UIDs (uid_2) might not exist in Firebase if they're only in code
        if (!query.uid.includes('_2') || questionsMap.has(query.uid_2 || '')) {
          console.warn(
            `Query with uid ${query.uid} not found in Firebase data. Using local query configuration.`
          );
        }
        return query;
      }
      // Merge Firebase data with local query, but preserve functions from local query
      // Firebase stores function names as strings, not actual functions
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {
        dataProcessingFunction: firebaseFn,
        dataProcessingFunction2: firebaseFn2,
        dataProcessingFunctionName: _fnName,
        dataProcessingFunctionName2: _fnName2,
        ...firebaseDataWithoutFunctions
      } = firebaseData;

      return {
        ...query,
        ...firebaseDataWithoutFunctions, // Firebase data takes priority for non-function fields
        // Preserve functions from local query (Firebase only has function names, not functions)
        dataProcessingFunction:
          typeof firebaseFn === 'function'
            ? firebaseFn
            : query.dataProcessingFunction,
        dataProcessingFunction2:
          typeof firebaseFn2 === 'function'
            ? firebaseFn2
            : query.dataProcessingFunction2,
      } as Query;
    })
    .sort((a, b) => a.id - b.id);
};

// Async thunk for fetching questions from Firebase
// UPDATED FOR NEW NESTED STRUCTURE
export const fetchQuestionsFromFirebase = createAsyncThunk(
  'questions/fetchQuestions',
  async (templateId: string = 'R186491') => {
    const firebaseQuestions = await CRUDQuestions.getQuestions(templateId);
    return { firebaseQuestions, templateId }; // Return both questions and templateId
  }
);

// Async thunk for fetching SPARQL data for a specific question
export const fetchQuestionData = createAsyncThunk(
  'questions/fetchQuestionData',
  async ({
    questionId,
    templateId,
  }: {
    questionId: string;
    templateId: string;
  }) => {
    const { sparql } = getTemplateResources(templateId);
    //@ts-expect-error
    const data = await fetchSPARQLData(sparql[questionId]);
    // Create a new array from the data to avoid read-only issues
    return {
      questionId,
      data: Array.isArray(data) ? [...data] : data,
    };
  }
);

const questionSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    setCurrentQuestion: (state, action) => {
      const { questionId, templateId } = action.payload;
      const { queries } = getTemplateResources(templateId);
      const targetQuery = queries.find((q) => q.id === questionId);
      if (!targetQuery) return;

      // Merge with Firebase data if available
      const firebaseData = state.firebaseQuestions[targetQuery.uid];
      if (firebaseData) {
        // Merge but preserve functions from local query config
        // Remove function fields from firebaseData since we always use local functions
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const firebaseDataCopy = { ...(firebaseData as any) };
        delete firebaseDataCopy.dataProcessingFunction;
        delete firebaseDataCopy.dataProcessingFunction2;
        delete firebaseDataCopy.dataProcessingFunctionName;
        delete firebaseDataCopy.dataProcessingFunctionName2;

        state.currentQuestion = {
          ...targetQuery,
          ...firebaseDataCopy,
          // Always use functions from local query config
          dataProcessingFunction: targetQuery.dataProcessingFunction,
          dataProcessingFunction2: targetQuery.dataProcessingFunction2,
        } as Query;
      } else {
        state.currentQuestion = targetQuery;
      }
    },
    setNormalized: (state, action) => {
      state.normalized = action.payload;
    },
    clearErrors: (state) => {
      state.error.questions = null;
      state.error.questionData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchQuestions
      .addCase(fetchQuestionsFromFirebase.pending, (state) => {
        state.loading.questions = true;
        state.error.questions = null;
      })
      .addCase(fetchQuestionsFromFirebase.fulfilled, (state, action) => {
        state.loading.questions = false;
        const { firebaseQuestions, templateId } = action.payload;
        // Store raw Firebase data (without functions for serialization)
        state.firebaseQuestions = firebaseQuestions.reduce(
          (acc, q) => ({
            ...acc,
            [q.uid]: stripFunctions(q),
          }),
          {}
        );
        // Store questions without functions (functions will be merged on access)
        const mergedQuestions = mergeQuestionsData(
          firebaseQuestions,
          templateId
        );
        state.questions = mergedQuestions.map((q) =>
          stripFunctions(q)
        ) as Query[];
      })
      .addCase(fetchQuestionsFromFirebase.rejected, (state, action) => {
        state.loading.questions = false;
        state.error.questions =
          action.error.message || 'Failed to fetch questions';
      })
      // Handle fetchQuestionData
      .addCase(fetchQuestionData.pending, (state) => {
        state.loading.questionData = true;
        state.error.questionData = null;
      })
      .addCase(fetchQuestionData.fulfilled, (state, action) => {
        state.loading.questionData = false;
        state.questionData[action.payload.questionId] = action.payload.data;
      })
      .addCase(fetchQuestionData.rejected, (state, action) => {
        state.loading.questionData = false;
        state.error.questionData =
          action.error.message || 'Failed to fetch question data';
      });
  },
});

export const { setCurrentQuestion, setNormalized, clearErrors } =
  questionSlice.actions;
export default questionSlice.reducer;
