import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import {
  setCurrentTest,
  setAnswer,
  updateTimeRemaining,
  completeTest
} from '../../store/slices/testSlice';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TestTaking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentTest = useSelector((state: RootState) => state.test.currentTest);
  const timeRemaining = useSelector((state: RootState) => state.test.timeRemaining);
  const answers = useSelector((state: RootState) => state.test.answers);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (id) {
      dispatch(setCurrentTest(id));
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (timeRemaining === null || !currentTest) return;

    const timer = setInterval(() => {
      if (timeRemaining <= 0) {
        clearInterval(timer);
        handleSubmit();
      } else {
        dispatch(updateTimeRemaining(timeRemaining - 1));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, currentTest, dispatch]);

  if (!currentTest) return null;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    dispatch(setAnswer({ questionId, answer }));
  };

  const handleSubmit = () => {
    if (!currentTest) return;

    // Calculate score (mock implementation)
    const score = Math.floor(Math.random() * 40) + 60; // Random score between 60-100
    dispatch(completeTest({ testId: currentTest.id, score }));
    navigate('/tests');
  };

  const currentQuestion = currentTest.questions[currentPage - 1];

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {currentTest.name}
            </h1>
            <div className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300">
              Time Left: {formatTime(timeRemaining || 0)}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
              {currentQuestion.type}
            </h2>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-full inline-block align-middle">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-collapse">
                  <thead>
                    <tr className="divide-x divide-gray-200 dark:divide-gray-700">
                      <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-500 border-r border-gray-200 dark:border-gray-700">Q#</th>
                      {Array.from({ length: 5 }, (_, i) => (
                        <th key={i} className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm font-medium text-gray-500 border-r border-gray-200 dark:border-gray-700">
                          Q{i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {currentQuestion.numbers.map((row, rowIndex) => (
                      <tr key={rowIndex} className="divide-x divide-gray-200 dark:divide-gray-700">
                        <td className="px-2 sm:px-4 py-2 text-sm sm:text-base text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">No {rowIndex + 1}</td>
                        {row.map((num, colIndex) => (
                          <td key={colIndex} className="px-2 sm:px-4 py-2 text-sm sm:text-base text-gray-900 dark:text-white text-center font-mono border-r border-gray-200 dark:border-gray-700 w-16 sm:w-24 relative">
                            <span className="inline-block w-8 relative">
                              {typeof num === 'number' && num < 0 && (
                                <span className="absolute right-full mr-0.5">−</span>
                              )}
                              {typeof num === 'number' ? Math.abs(num) : num}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="divide-x divide-gray-200 dark:divide-gray-700">
                      <td className="px-2 sm:px-4 py-2 text-sm sm:text-base text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">Answer</td>
                      {currentQuestion.answers.map((_, index) => (
                        <td key={index} className="px-2 sm:px-4 py-2 text-center border-r border-gray-200 dark:border-gray-700">
                          <div className="relative inline-block">
                            <input
                              type="text"
                              value={answers[`${currentQuestion.id}_${index}`] || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Allow only numbers, minus sign, and empty string
                                if (value === '' || value === '-' || /^-?\d+$/.test(value)) {
                                  handleAnswerChange(`${currentQuestion.id}_${index}`, value);
                                }
                              }}
                              className="w-8 px-0 py-1 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-center font-mono"
                              placeholder="?"
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-50 transition-colors duration-200"
                aria-label="Previous question"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm sm:text-base">
                {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(currentTest.questions.length, p + 1))}
                disabled={currentPage === currentTest.questions.length}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-50 transition-colors duration-200"
                aria-label="Next question"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleSubmit}
              className="w-full sm:w-auto px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestTaking;