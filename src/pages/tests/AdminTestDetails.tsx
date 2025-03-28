import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { setTests } from '../../store/slices/testSlice';
import { testApi } from '../../services/api/test';
import { Question } from '../../types';

const AdminTestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const tests = useSelector((state: RootState) => state.test.tests);
  const test = tests.find(t => t.uuid === id);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage, setQuestionsPerPage] = useState(10);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const isMulDiv = test?.sections[0]?.section_type === "MUL_DIV";
      
      if (width < 640) { // mobile
        setQuestionsPerPage(3);
      } else if (width < 1024) { // tablet
        setQuestionsPerPage(4);
      } else { // desktop
        setQuestionsPerPage(isMulDiv ? 6 : 10); // 6 for mul/div, 10 for addition
      }
    };

    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [test]);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const data = await testApi.getAvailableTests();
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
    try {
      await testApi.submitTest(id!, answers);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting test:', error);
    }
  };

  const formatNumber = (num: number) => {
    if (num < 0) {
      return (
        <div className="flex items-center justify-end font-mono text-lg sm:text-xl md:text-2xl">
          <span className="mr-1">-</span>
          <span>{Math.abs(num)}</span>
        </div>
      );
    }
    return <div className="text-right font-mono text-lg sm:text-xl md:text-2xl">{num}</div>;
  };

  const renderMulDivQuestions = (questions: Question[]) => {
    return questions.map((question) => {
      const numbers = parseQuestionText(question.text);
      const operatorSign = question.question_type === 'multiply' ? '×' : '÷';
      
      return (
        <tr key={question.uuid} className="border-b border-indigo-100/50 dark:border-indigo-800/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/30 transition-colors duration-150">
          <td className="w-16 sm:w-20 px-2 sm:px-3 py-2.5 text-center text-base sm:text-lg font-medium text-gray-900 dark:text-white whitespace-nowrap bg-indigo-50/30 dark:bg-indigo-900/10 border-r-[3px] border-r-indigo-900 dark:border-r-indigo-900 sticky left-0">
            {question.order}
          </td>
          <td className="w-20 sm:w-24 px-2 sm:px-3 py-2.5 text-right text-lg sm:text-xl text-gray-900 dark:text-white whitespace-nowrap border-r-[3px] border-r-indigo-900 dark:border-r-indigo-900 font-mono">
            {numbers[0]}
          </td>
          <td className="w-12 sm:w-16 px-2 py-2.5 text-center text-lg sm:text-xl text-indigo-600 dark:text-indigo-400 whitespace-nowrap border-r-[3px] border-r-indigo-900 dark:border-r-indigo-900 font-mono">
            {operatorSign}
          </td>
          <td className="w-16 sm:w-20 px-2 sm:px-3 py-2.5 text-left text-lg sm:text-xl text-gray-900 dark:text-white whitespace-nowrap border-r-[3px] border-r-indigo-900 dark:border-r-indigo-900 font-mono">
            {numbers[1]}
          </td>
          <td className="w-24 sm:w-28 px-2 sm:px-3 py-2.5 text-center">
            <div className="inline-block rounded-lg border border-indigo-100 dark:border-indigo-800 bg-white dark:bg-gray-900">
              <input
                type="number"
                value={answers[question.uuid] || ''}
                onChange={(e) => handleAnswerChange(question.uuid, e.target.value)}
                className="w-14 sm:w-16 py-1.5 text-lg sm:text-xl text-center font-mono bg-transparent focus:outline-none dark:text-white placeholder-indigo-300 dark:placeholder-indigo-600"
                placeholder="?"
              />
            </div>
          </td>
        </tr>
      );
    });
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

  const renderPagination = (questions: Question[], sectionIndex: number) => {
    const totalPages = Math.ceil(questions.length / questionsPerPage);
    const startIndex = (currentPage - 1) * questionsPerPage;
    const endIndex = startIndex + questionsPerPage;
    const currentQuestions = questions.slice(startIndex, endIndex);

    return {
      currentQuestions,
      pagination: (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 transition-colors duration-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 transition-colors duration-200"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          {sectionIndex === test.sections.length - 1 && (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-medium rounded-full hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 shadow-lg"
            >
              Submit Answers
            </button>
          )}
        </div>
      )
    };
  };

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="max-w-full mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium mb-6 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl border-2 border-indigo-200 dark:border-indigo-900">
          <div className="p-4 sm:p-6 border-b-2 border-indigo-100 dark:border-indigo-800">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {test.title}
              </h1>
              <div className="flex items-center space-x-4 bg-indigo-50/80 dark:bg-indigo-900/30 px-4 py-2 rounded-full shadow-sm border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center text-indigo-600 dark:text-indigo-400">
                  <Clock className="w-5 h-5 mr-2" />
                  <span className="font-medium">{test.duration_minutes} minutes</span>
                </div>
                <div className="flex items-center text-purple-600 dark:text-purple-400">
                  <span className="font-medium">Level {test.level}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {test.sections.map((section, sectionIndex) => {
              const { currentQuestions, pagination } = renderPagination(section.questions, sectionIndex);
              const isMulDiv = section.section_type === "MUL_DIV";
              
              // For addition sections, keep the existing maxLength calculation
              const maxLength = isMulDiv ? 1 : currentQuestions.reduce((max, question) => {
                const numbers = parseQuestionText(question.text);
                return Math.max(max, numbers.length);
              }, 0);

              return (
                <div key={section.uuid} className="mb-8 last:mb-0">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mr-3 shadow-lg">
                      <span className="text-lg font-bold text-white">{sectionIndex + 1}</span>
                    </div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {section.section_type === "MUL_DIV" ? "Multiplication & Division" : "Addition"} Fun!
                    </h2>
                  </div>
                  
                  <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-indigo-100 dark:border-indigo-800">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-indigo-100 dark:border-indigo-800">
                          <th className="w-16 sm:w-20 px-2 sm:px-3 py-2.5 text-left text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 border-r-[3px] border-r-indigo-900 dark:border-r-indigo-900 sticky left-0">
                            No.
                          </th>
                          {isMulDiv ? (
                            <>
                              <th className="w-20 sm:w-24 px-2 sm:px-3 py-2.5 text-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 border-r-[3px] border-r-indigo-900 dark:border-r-indigo-900">
                                First Number
                              </th>
                              <th className="w-12 sm:w-16 px-2 py-2.5 text-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 border-r-[3px] border-r-indigo-900 dark:border-r-indigo-900">
                                Operation
                              </th>
                              <th className="w-16 sm:w-20 px-2 sm:px-3 py-2.5 text-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 border-r-[3px] border-r-indigo-900 dark:border-r-indigo-900">
                                Second Number
                              </th>
                              <th className="w-24 sm:w-28 px-2 sm:px-3 py-2.5 text-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20">
                                Answer
                              </th>
                            </>
                          ) : (
                            currentQuestions.map((question) => (
                              <th
                                key={question.uuid}
                                className="w-16 sm:w-20 md:w-24 px-2 sm:px-3 py-3 text-center text-sm sm:text-base font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 border-r-[3px] border-r-indigo-900 dark:border-r-indigo-900"
                              >
                                Q{question.order}
                              </th>
                            ))
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-indigo-100/50 dark:divide-indigo-800/50">
                        {isMulDiv ? (
                          renderMulDivQuestions(currentQuestions)
                        ) : (
                          <>
                            {Array.from({ length: maxLength }).map((_, rowIndex) => {
                              const bottomUpIndex = maxLength - rowIndex - 1;
                              return (
                                <tr key={rowIndex}>
                                  <td className="w-16 sm:w-20 md:w-24 px-2 sm:px-3 py-3 text-center text-base sm:text-lg font-medium text-gray-900 dark:text-white whitespace-nowrap bg-indigo-50/50 dark:bg-indigo-900/10 border-t border-t-indigo-100 dark:border-t-indigo-800 border-r-[3px] border-r-indigo-900 dark:border-r-indigo-900 sticky left-0">
                                    {rowIndex + 1}
                                  </td>
                                  {currentQuestions.map((question) => {
                                    const numbers = parseQuestionText(question.text);
                                    return (
                                      <td
                                        key={question.uuid}
                                        className="w-16 sm:w-20 md:w-24 px-2 sm:px-3 py-3 text-base sm:text-lg text-gray-900 dark:text-white whitespace-nowrap border-t border-t-indigo-100 dark:border-t-indigo-800 border-r-[3px] border-r-indigo-900 dark:border-r-indigo-900"
                                      >
                                        <div className="w-full flex justify-end pr-2 font-mono">
                                          {numbers[bottomUpIndex] !== undefined ? formatNumber(numbers[bottomUpIndex]) : ''}
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                            <tr>
                              <td className="w-16 sm:w-20 md:w-24 px-2 sm:px-3 py-4 text-center text-base sm:text-lg font-bold text-indigo-700 dark:text-indigo-300 whitespace-nowrap bg-indigo-50/50 dark:bg-indigo-900/10 border-t-2 border-t-indigo-200 dark:border-t-indigo-800 border-r-[3px] border-r-indigo-900 dark:border-r-indigo-900 sticky left-0">
                                Answer
                              </td>
                              {currentQuestions.map((question) => (
                                <td
                                  key={question.uuid}
                                  className="w-16 sm:w-20 md:w-24 px-2 sm:px-3 py-4 text-center border-t-2 border-t-indigo-200 dark:border-t-indigo-800 border-r-[3px] border-r-indigo-900 dark:border-r-indigo-900"
                                >
                                  <input
                                    type="number"
                                    value={answers[question.uuid] || ''}
                                    onChange={(e) => handleAnswerChange(question.uuid, e.target.value)}
                                    className="w-16 sm:w-20 px-2 py-2 text-base sm:text-lg md:text-xl text-center font-mono bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-300 dark:border-indigo-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white placeholder-indigo-300 dark:placeholder-indigo-600"
                                    placeholder="?"
                                  />
                                </td>
                              ))}
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-6">
                    {pagination}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTestDetails; 