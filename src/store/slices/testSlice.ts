import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Question {
  uuid: string;
  text: string;
  order: number;
  marks: number;
}

interface Section {
  uuid: string;
  section_type: string;
  order: number;
  questions: Question[];
}

export interface Test {
  uuid: string;
  title: string;
  level: number;
  level_uuid: string;
  duration_minutes: number;
  sections: Section[];
  duration_remaining: number;
  due_date: string | null;
  created_at: string;
}

interface TestState {
  tests: Test[];
  currentTest: Test | null;
  answers: Record<string, string>;
  timeRemaining: number | null;
}

const initialState: TestState = {
  tests: [],
  currentTest: null,
  answers: {},
  timeRemaining: null,
};

const testSlice = createSlice({
  name: 'test',
  initialState,
  reducers: {
    setTests: (state, action: PayloadAction<Test[]>) => {
      state.tests = action.payload;
    },
    setCurrentTest: (state, action: PayloadAction<string>) => {
      state.currentTest = state.tests.find(test => test.uuid === action.payload) || null;
      if (state.currentTest) {
        state.timeRemaining = state.currentTest.duration_minutes * 60;
      }
    },
    setAnswer: (state, action: PayloadAction<{ questionId: string; answer: string }>) => {
      state.answers[action.payload.questionId] = action.payload.answer;
    },
    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
    },
    completeTest: (state, action: PayloadAction<{ testId: string; score: number }>) => {
      const test = state.tests.find(t => t.uuid === action.payload.testId);
      if (test) {
        test.duration_remaining = 0;
      }
      state.currentTest = null;
      state.timeRemaining = null;
      state.answers = {};
    },
  },
});

export const {
  setTests,
  setCurrentTest,
  setAnswer,
  updateTimeRemaining,
  completeTest,
} = testSlice.actions;

export default testSlice.reducer;