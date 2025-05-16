/* eslint-disable @typescript-eslint/ban-ts-comment */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Query } from '../../constants/queries_chart_info';
import { queries } from '../../constants/queries_chart_info';
import CRUDQuestions from '../../firestore/CRUDQuestions';
import fetchSPARQLData from '../../helpers/fetch_query';
import { SPARQL_QUERIES } from '../../api/SPARQL_QUERIES';

export interface FirebaseQuestion {
  id: number;
  title: string;
  uid: string;
  dataAnalysisInformation: {
    question: string;
    dataAnalysis: string;
    requiredDataForAnalysis: string;
    questionExplanation: string;
    dataInterpretation: string;
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

// Helper function to merge Firebase data with local queries
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mergeQuestionsData = (firebaseQuestions: any[]) => {
  const questionsMap = new Map(firebaseQuestions.map((q) => [q.uid, q]));

  return [...queries]
    .map((query) => {
      const firebaseData = questionsMap.get(query.uid);
      if (!firebaseData) {
        console.error(
          `Query with uid ${query.uid} not found in Firebase data.`
        );
        return query;
      }
      return {
        ...query,
        ...firebaseData, // Firebase data takes priority
      } as Query;
    })
    .sort((a, b) => a.id - b.id);
};

// Async thunk for fetching questions from Firebase
export const fetchQuestionsFromFirebase = createAsyncThunk(
  'questions/fetchQuestions',
  async () => {
    const firebaseQuestions = await CRUDQuestions.getQuestions();
    return firebaseQuestions;
  }
);

// Async thunk for fetching SPARQL data for a specific question
export const fetchQuestionData = createAsyncThunk(
  'questions/fetchQuestionData',
  async (questionId: string) => {
    //@ts-expect-error
    const data = await fetchSPARQLData(SPARQL_QUERIES[questionId]);
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
      const questionId = action.payload;
      const targetQuery = queries.find((q) => q.id === questionId);
      if (!targetQuery) return;

      // Merge with Firebase data if available
      const firebaseData = state.firebaseQuestions[targetQuery.uid];
      state.currentQuestion = firebaseData
        ? { ...targetQuery, ...firebaseData }
        : targetQuery;
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
        // Store raw Firebase data
        state.firebaseQuestions = action.payload.reduce(
          (acc, q) => ({
            ...acc,
            [q.uid]: q,
          }),
          {}
        );
        // Merge with local queries
        state.questions = mergeQuestionsData(action.payload);
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
