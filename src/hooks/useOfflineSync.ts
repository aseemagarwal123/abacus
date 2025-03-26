import { useEffect, useCallback } from 'react';
import { isOnline } from '../utils/connectivity';
import {
  getPendingAnswers,
  removePendingAnswer,
  updatePendingAnswerRetry,
  shouldRetryAnswer,
} from '../utils/storage';
import { submitAnswer } from '../services/api';

export const useOfflineSync = () => {
  const syncPendingAnswers = useCallback(async () => {
    const pendingAnswers = await getPendingAnswers();
    
    for (const answer of pendingAnswers) {
      const success = await submitAnswer(answer);
      
      if (success) {
        await removePendingAnswer(answer.questionId);
      } else {
        if (shouldRetryAnswer(answer.retryCount)) {
          await updatePendingAnswerRetry(answer.questionId);
        } else {
          // If max retries reached, remove the answer
          await removePendingAnswer(answer.questionId);
          // Here you might want to notify the user that some answers failed to sync
        }
      }
    }
  }, []);

  useEffect(() => {
    const subscription = isOnline.subscribe(async (online) => {
      if (online) {
        await syncPendingAnswers();
      }
    });

    return () => subscription.unsubscribe();
  }, [syncPendingAnswers]);

  return { syncPendingAnswers };
};