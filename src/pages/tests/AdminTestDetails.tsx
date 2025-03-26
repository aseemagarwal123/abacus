import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { setTests } from '../../store/slices/testSlice';
import { getApiUrl } from '../../config/api';

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

interface Test {
  uuid: string;
  title: string;
  level: number;
  duration_minutes: number;
  sections: Section[];
  due_date: string | null;
  created_at: string;
}

const AdminTestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const tests = useSelector((state: RootState) => state.test.tests);
  const user = useSelector((state: RootState) => state.auth.user);
  const test = tests.find(t => t.uuid === id);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 10;

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(getApiUrl('tests/available-test/'), {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch tests');
        }
        const data = await response.json();
        dispatch(setTests(data));
      } catch (error) {
        console.error('Error fetching tests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [dispatch]);

  const parseQuestionText = (text: string): number[] => {
    try {
      return JSON.parse(text);
    } catch {
      return [];
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    // TODO: Implement answer submission
    console.log('Submitting answers:', answers);
  };

  const formatNumber = (num: number) => {
    if (num < 0) {
      return (
        <div className="flex items-center justify-center">
          <span className="mr-1">-</span>
          <span>{Math.abs(num)}</span>
        </div>
      );
    }
    return num;
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">Loading test details...</p>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">Test not found</p>
      </div>
    );
  }

  const isStudent = user?.user_type === 'STUDENT';

  const renderPagination = (questions: Question[]) => {
    const totalPages = Math.ceil(questions.length / questionsPerPage);
    const startIndex = (currentPage - 1) * questionsPerPage;
    const endIndex = startIndex + questionsPerPage;
    const currentQuestions = questions.slice(startIndex, endIndex);

    return {
      currentQuestions,
      pagination: (
        <div className="flex items-center justify-center mt-4 space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-md border border-gray-200 dark:border-gray-700 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md border border-gray-200 dark:border-gray-700 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )
    };
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/tests')}
          className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Tests
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {test.title}
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Clock className="w-5 h-5 mr-2" />
                <span>{test.duration_minutes} minutes</span>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Level {test.level}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {test.sections.map((section, sectionIndex) => {
            const { currentQuestions, pagination } = renderPagination(section.questions);
            
            return (
              <div key={section.uuid} className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Section {sectionIndex + 1} - {section.section_type === 'add' ? 'Addition' : 'Multiplication'}
                </h2>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-collapse">
                    <thead>
                      <tr className="divide-x divide-gray-200 dark:divide-gray-700">
                        <th className="w-16 px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700">
                          No.
                        </th>
                        {currentQuestions.map((question) => (
                          <th
                            key={question.uuid}
                            className="w-16 px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700"
                          >
                            Q{question.order}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {Array.from({ length: 11 }).map((_, rowIndex) => (
                        <tr key={rowIndex} className="divide-x divide-gray-200 dark:divide-gray-700">
                          <td className="w-16 px-3 py-2 text-center text-sm text-gray-900 dark:text-white whitespace-nowrap bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700">
                            {rowIndex + 1}
                          </td>
                          {currentQuestions.map((question) => {
                            const numbers = parseQuestionText(question.text);
                            return (
                              <td
                                key={question.uuid}
                                className="w-16 px-3 py-2 text-center text-sm text-gray-900 dark:text-white whitespace-nowrap border border-gray-200 dark:border-gray-700"
                              >
                                {numbers[rowIndex] !== undefined ? formatNumber(numbers[rowIndex]) : ''}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      {isStudent && (
                        <tr className="divide-x divide-gray-200 dark:divide-gray-700">
                          <td className="w-16 px-3 py-2 text-center text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700">
                            Answer
                          </td>
                          {currentQuestions.map((question) => (
                            <td
                              key={question.uuid}
                              className="w-16 px-3 py-2 text-center border border-gray-200 dark:border-gray-700"
                            >
                              <input
                                type="number"
                                value={answers[question.uuid] || ''}
                                onChange={(e) => handleAnswerChange(question.uuid, e.target.value)}
                                className="w-full px-2 py-1 text-sm text-center border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Answer"
                              />
                            </td>
                          ))}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {pagination}
              </div>
            );
          })}
        </div>

        {isStudent && (
          <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSubmit}
              className="w-full sm:w-auto px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200"
            >
              Submit Answers
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTestDetails; 