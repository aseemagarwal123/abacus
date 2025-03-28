import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Clock, Target, CheckCircle2, XCircle, Percent, Award } from 'lucide-react';
import { testApi } from '../../services/api/test';

interface Answer {
  question_text: string;
  question_order: number;
  answer_text: string;
  is_correct: boolean;
  marks_obtained: string;
  correct_answer_value: string;
  question_type: 'plus' | 'multiply' | 'divide';
}

interface TestResult {
  uuid: string;
  status: string;
  start_time: string;
  end_time: string;
  total_questions: number;
  total_attempted: number;
  total_marks: number;
  marks_obtained: number;
  correct_answers: number;
  incorrect_answers: number;
  accuracy_percentage: number;
  completion_time: {
    seconds: number;
    formatted: string;
  };
  answers: Answer[];
}

const StudentTestResult: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const data = await testApi.getStudentTestResult(id!);
        setResult(data);
      } catch (error) {
        console.error('Error fetching test result:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchResult();
    }
  }, [id]);

  const parseQuestionText = (text: string): number[] => {
    try {
      return JSON.parse(text);
    } catch {
      return [];
    }
  };

  const formatQuestion = (numbers: number[], questionType: string): string => {
    // Get the operator based on question type
    const operator = {
      'plus': '+',
      'multiply': '×',
      'divide': '÷'
    }[questionType] || '+';

    // For addition questions, show all numbers
    if (questionType === 'plus') {
      return numbers.map(num => num >= 0 ? num : `(${num})`).join(' + ');
    }
    
    // For multiplication/division questions, show first two numbers
    return `${numbers[0]} ${operator} ${numbers[1]}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-indigo-200 dark:border-indigo-900 p-8 max-w-sm w-full">
          <div className="flex flex-col items-center">
            {/* Trophy Animation */}
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center animate-bounce">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center animate-ping">
                <span className="text-white text-xs">✨</span>
              </div>
            </div>

            {/* Loading Text with Rainbow Animation */}
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
              Calculating Results...
            </h2>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-[loading_2s_ease-in-out_infinite]"></div>
            </div>

            {/* Fun Loading Messages */}
            <p className="text-indigo-600 dark:text-indigo-400 text-center text-sm animate-[fadeInOut_4s_ease-in-out_infinite]">
              Preparing your amazing results! 🎉
            </p>
          </div>
        </div>

        <style>
          {`
            @keyframes loading {
              0% { width: 0%; }
              50% { width: 100%; }
              100% { width: 0%; }
            }
            @keyframes fadeInOut {
              0%, 100% { opacity: 0.5; }
              50% { opacity: 1; }
            }
          `}
        </style>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">Result not found</p>
      </div>
    );
  }

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-500';
    if (percentage >= 70) return 'text-blue-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getGradeEmoji = (percentage: number) => {
    if (percentage >= 90) return '🌟';
    if (percentage >= 70) return '😊';
    if (percentage >= 50) return '🙂';
    return '😢';
  };

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/student-dashboard')}
          className="flex items-center text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium mb-6 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-indigo-200 dark:border-indigo-900 overflow-hidden">
          {/* Header Section */}
          <div className="p-6 border-b-2 border-indigo-100 dark:border-indigo-800 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            <div className="flex flex-col items-center text-white">
              <Trophy className="w-16 h-16 mb-4 animate-bounce" />
              <h1 className="text-3xl font-bold mb-2">Test Results</h1>
              <p className="text-lg opacity-90">
                Completed on {new Date(result.end_time).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <Target className="w-8 h-8 text-blue-500" />
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {result.total_attempted}/{result.total_questions}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400">Questions Attempted</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-4 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {result.correct_answers}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">Correct Answers</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 p-4 rounded-xl border border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between">
                <XCircle className="w-8 h-8 text-red-500" />
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {result.incorrect_answers}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">Incorrect Answers</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <Clock className="w-8 h-8 text-purple-500" />
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {result.completion_time.formatted}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-purple-600 dark:text-purple-400">Completion Time</p>
            </div>
          </div>

          {/* Overall Score */}
          <div className="px-6 pb-6">
            <div className="bg-gradient-to-br from-indigo-50 to-pink-50 dark:from-indigo-900/30 dark:to-pink-900/30 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center justify-center space-x-4">
                <Award className="w-12 h-12 text-indigo-500" />
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    Overall Score
                  </h2>
                  <div className="flex items-center justify-center space-x-2">
                    <span className={`text-4xl font-bold ${getGradeColor(result.accuracy_percentage)}`}>
                      {result.accuracy_percentage.toFixed(1)}%
                    </span>
                    <span className="text-4xl">{getGradeEmoji(result.accuracy_percentage)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Answers Review */}
          <div className="px-6 pb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Questions Review
            </h2>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-indigo-200 dark:border-indigo-800 overflow-hidden">
              <table className="min-w-full divide-y divide-indigo-200 dark:divide-indigo-800">
                <thead className="bg-indigo-50 dark:bg-indigo-900/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
                      Your Answer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
                      Correct Answer
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
                      Result
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-100 dark:divide-indigo-800">
                  {result.answers.map((answer) => {
                    const numbers = parseQuestionText(answer.question_text);
                    return (
                      <tr key={answer.question_order} className="hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900 dark:text-white font-mono">
                          {formatQuestion(numbers, answer.question_type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-500 dark:text-gray-400 font-mono">
                          {answer.answer_text}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-500 dark:text-gray-400 font-mono">
                          {answer.correct_answer_value}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {answer.is_correct ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Correct ✓
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              Incorrect ✗
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentTestResult; 