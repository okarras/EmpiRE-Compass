import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ScidQuestState {
  answers: Record<string, string>;
}

const initialState: ScidQuestState = {
  answers: {},
};

const scidQuestSlice = createSlice({
  name: 'scidQuest',
  initialState,
  reducers: {
    setScidQuestAnswers(state, action: PayloadAction<Record<string, string>>) {
      state.answers = action.payload;
    },
    updateScidQuestAnswer(
      state,
      action: PayloadAction<{ questionId: string; answer: string }>
    ) {
      state.answers[action.payload.questionId] = action.payload.answer;
    },
  },
});

export const { setScidQuestAnswers, updateScidQuestAnswer } =
  scidQuestSlice.actions;
export default scidQuestSlice.reducer;
