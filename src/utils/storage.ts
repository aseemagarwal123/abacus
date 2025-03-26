import localforage from 'localforage';

// Configure localforage
localforage.config({
  name: 'abacus-platform',
  storeName: 'test_answers'
});

export interface StoredAnswer {
  questionId: string;
  answer: string;
  timestamp: number;
  testId: string;
  sectionId: string;
}

export interface PendingAnswer extends StoredAnswer {
  retryCount: number;
}

// Store for pending API calls
const PENDING_ANSWERS_KEY = 'pending_answers';
const CURRENT_TEST_STATE_KEY = 'current_test_state';
const MAX_RETRIES = 3;

export const saveAnswer = async (answer: StoredAnswer): Promise<void> => {
  try {
    const pendingAnswers = await getPendingAnswers();
    pendingAnswers.push({ ...answer, retryCount: 0 });
    await localforage.setItem(PENDING_ANSWERS_KEY, pendingAnswers);
  } catch (error) {
    console.error('Error saving answer:', error);
  }
};

export const getPendingAnswers = async (): Promise<PendingAnswer[]> => {
  try {
    const answers = await localforage.getItem<PendingAnswer[]>(PENDING_ANSWERS_KEY);
    return answers || [];
  } catch (error) {
    console.error('Error getting pending answers:', error);
    return [];
  }
};

export const removePendingAnswer = async (questionId: string): Promise<void> => {
  try {
    const pendingAnswers = await getPendingAnswers();
    const updatedAnswers = pendingAnswers.filter(
      answer => answer.questionId !== questionId
    );
    await localforage.setItem(PENDING_ANSWERS_KEY, updatedAnswers);
  } catch (error) {
    console.error('Error removing pending answer:', error);
  }
};

export const saveTestState = async (state: any): Promise<void> => {
  try {
    await localforage.setItem(CURRENT_TEST_STATE_KEY, state);
  } catch (error) {
    console.error('Error saving test state:', error);
  }
};

export const getTestState = async (): Promise<any> => {
  try {
    return await localforage.getItem(CURRENT_TEST_STATE_KEY);
  } catch (error) {
    console.error('Error getting test state:', error);
    return null;
  }
};

export const clearTestState = async (): Promise<void> => {
  try {
    await localforage.removeItem(CURRENT_TEST_STATE_KEY);
  } catch (error) {
    console.error('Error clearing test state:', error);
  }
};

export const updatePendingAnswerRetry = async (questionId: string): Promise<void> => {
  try {
    const pendingAnswers = await getPendingAnswers();
    const updatedAnswers = pendingAnswers.map(answer => {
      if (answer.questionId === questionId) {
        return { ...answer, retryCount: answer.retryCount + 1 };
      }
      return answer;
    });
    await localforage.setItem(PENDING_ANSWERS_KEY, updatedAnswers);
  } catch (error) {
    console.error('Error updating pending answer retry count:', error);
  }
};

export const shouldRetryAnswer = (retryCount: number): boolean => {
  return retryCount < MAX_RETRIES;
};