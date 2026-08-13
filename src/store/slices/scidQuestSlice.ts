import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Answer values are typed loosely because the questionnaire mixes shapes:
 * strings for text/url fields, arrays for `repeat_*`, objects for `group`.
 */
type ScidQuestAnswers = Record<string, unknown>;

interface ScidQuestState {
  answers: ScidQuestAnswers;
}

const initialState: ScidQuestState = {
  answers: {},
};

const scidQuestSlice = createSlice({
  name: 'scidQuest',
  initialState,
  reducers: {
    setScidQuestAnswers(state, action: PayloadAction<ScidQuestAnswers>) {
      state.answers = action.payload;
    },
    updateScidQuestAnswer(
      state,
      action: PayloadAction<{ questionId: string; answer: unknown }>
    ) {
      state.answers[action.payload.questionId] = action.payload.answer;
    },
  },
});

export const { setScidQuestAnswers, updateScidQuestAnswer } =
  scidQuestSlice.actions;
export default scidQuestSlice.reducer;
