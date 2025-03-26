import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { RootState } from '../../store/store';
import { saveAnswer, saveTestState, getTestState, clearTestState } from '../../utils/storage';
import { submitAnswer } from '../../services/api';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { isOnline } from '../../utils/connectivity';
import { TestProgress } from './TestProgress';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';

interface TestContainerProps {
  testId: string;
  sectionId: string;
  totalSections: number;
  currentSection: number;
  totalQuestions: number;
  answeredQuestions: number;
  children: React.ReactNode;
  onSectionComplete: () => void;
}

export const TestContainer: React.FC<TestContainerProps> = ({
  testId,
  sectionId,
  totalSections,
  currentSection,
  totalQuestions,
  answeredQuestions,
  children,
  onSectionComplete,
}) => {
  const navigate = useNavigate();
  const [initialized, setInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);
  const { syncPendingAnswers } = useOfflineSync();

  // Handle online/offline status
  useEffect(() => {
    const subscription = isOnline.subscribe((online) => {
      if (online) {
        toast.success('Back online! Syncing your answers...', {
          icon: <Wifi className="w-5 h-5" />,
        });
      } else {
        toast.warning('You are offline. Your answers will be saved locally.', {
          icon: <WifiOff className="w-5 h-5" />,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Initialize test state
  useEffect(() => {
    const initializeTest = async () => {
      const savedState = await getTestState();
      if (savedState?.testId === testId) {
        // Restore test state
        if (savedState.sectionId !== sectionId) {
          // User is on a different section, confirm they want to continue
          const confirmed = window.confirm(
            'You have a test in progress. Would you like to continue where you left off?'
          );
          if (confirmed) {
            navigate(`/test/${testId}/section/${savedState.sectionId}`);
            return;
          } else {
            await clearTestState();
          }
        }
      }
      setInitialized(true);
    };

    initializeTest();
  }, [testId, sectionId, navigate]);

  const handleAnswer = async (questionId: string, answer: string) => {
    try {
      setIsSubmitting(true);
      const timestamp = Date.now();
      const answerData = {
        questionId,
        answer,
        timestamp,
        testId,
        sectionId,
      };

      // Save current state
      await saveTestState({
        testId,
        sectionId,
        lastAnswered: questionId,
        timestamp,
      });

      // If online, try to submit immediately
      if (isOnline.value) {
        const success = await submitAnswer(answerData);
        if (!success) {
          await saveAnswer(answerData);
          toast.error('Failed to submit answer. It will be synced when possible.', {
            icon: <AlertTriangle className="w-5 h-5" />,
          });
        }
      } else {
        // If offline, save for later
        await saveAnswer(answerData);
      }
    } catch (error) {
      console.error('Error handling answer:', error);
      toast.error('Error saving your answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle section completion
  const handleSectionComplete = async () => {
    try {
      // Ensure all answers are synced before proceeding
      if (isOnline.value) {
        await syncPendingAnswers();
      }
      
      // Clear the current section state
      await clearTestState();
      
      // Move to next section
      onSectionComplete();
    } catch (error) {
      console.error('Error completing section:', error);
      toast.error('Error completing section. Please try again.');
    }
  };

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Connectivity Status */}
        <div
          className={`mb-4 px-4 py-2 rounded-md flex items-center ${
            isOnline.value
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {isOnline.value ? (
            <Wifi className="w-5 h-5 mr-2" />
          ) : (
            <WifiOff className="w-5 h-5 mr-2" />
          )}
          {isOnline.value
            ? 'Online'
            : 'Offline - Your answers will be saved and synced when online'}
        </div>

        {/* Progress Indicator */}
        <TestProgress
          totalQuestions={totalQuestions}
          answeredQuestions={answeredQuestions}
          currentSection={currentSection}
          totalSections={totalSections}
        />

        {/* Test Content */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          {children}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Previous
          </button>
          <button
            onClick={handleSectionComplete}
            disabled={isSubmitting || answeredQuestions < totalQuestions}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Complete Section'}
          </button>
        </div>
      </div>
    </div>
  );
};