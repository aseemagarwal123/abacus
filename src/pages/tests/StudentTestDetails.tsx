import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft, ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { setTests } from '../../store/slices/testSlice';
import { testApi } from '../../services/api/test';
import { Question, Test } from '../../types';
import debounce from 'lodash/debounce';

const StudentTestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [test, setTest] = useState<Test | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage, setQuestionsPerPage] = useState(10);
  const [testStarted, setTestStarted] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [studentTestUuid, setStudentTestUuid] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const [submittingQuestionId, setSubmittingQuestionId] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const inputRefs = useRef<Record<string, HTMLInputElement>>({});

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const isMulDiv = test?.sections[0]?.section_type === "MUL_DIV";
      
      if (isMulDiv) {
        // Pagination for multiplication/division questions
        if (width < 640) { // mobile
          setQuestionsPerPage(3);
        } else if (width < 1024) { // tablet
          setQuestionsPerPage(4);
        } else { // desktop
          setQuestionsPerPage(6);
        }
      } else {
        // Original pagination for addition questions
        if (width < 640) { // mobile
          setQuestionsPerPage(3);
        } else if (width < 1024) { // tablet
          setQuestionsPerPage(5);
        } else { // desktop
          setQuestionsPerPage(10); // Ensure 10 questions per page for addition on desktop
        }
      }
    };

    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [test]);

  useEffect(() => {
    const initializeTest = async () => {
      if (initializedRef.current || !id) return;
      
      try {
        setLoading(true);
        initializedRef.current = true;
        
        console.log('Initializing test with ID:', id);

        // Check if we have saved test state in localStorage first
        const savedTestState = localStorage.getItem(`test_state_${id}`);
        
        if (savedTestState) {
          const { student_test_uuid, remaining_time } = JSON.parse(savedTestState);
          console.log('Found saved test state:', { student_test_uuid, remaining_time });
          
          // First check the status of the existing test
          try {
            const durationData = await testApi.getRemainingDuration(student_test_uuid);
            console.log('Fetched remaining duration:', durationData);
            
            // Set the student test UUID regardless of status
            setStudentTestUuid(student_test_uuid);
            
            if (durationData.status === 'IN_PROGRESS') {
              // Update localStorage and state with the API's remaining duration
              setTestStarted(true);
              setRemainingTime(durationData.remaining_duration);
              localStorage.setItem(`test_state_${id}`, JSON.stringify({
                student_test_uuid,
                remaining_time: durationData.remaining_duration
              }));

              // Fetch and populate saved answers
              try {
                const answersData = await testApi.getAnswers(student_test_uuid);
                const savedAnswers = answersData.answers.reduce((acc, answer) => ({
                  ...acc,
                  [answer.question_uuid]: answer.answer_text
                }), {});
                setAnswers(savedAnswers);
              } catch (error) {
                console.error('Error fetching saved answers:', error);
              }
            } else if (durationData.status === 'PENDING') {
              // For PENDING status, keep the student test UUID but reset test started state
              setTestStarted(false);
              // Don't create a new test, just fetch test details
              const testData = await testApi.getTestDetails(id);
              const testDetails = testData.test || testData;
              setTest(testDetails);
              setRemainingTime(testDetails.duration_minutes * 60);

              // Also fetch any saved answers for PENDING tests
              try {
                const answersData = await testApi.getAnswers(student_test_uuid);
                const savedAnswers = answersData.answers.reduce((acc, answer) => ({
                  ...acc,
                  [answer.question_uuid]: answer.answer_text
                }), {});
                setAnswers(savedAnswers);
              } catch (error) {
                console.error('Error fetching saved answers:', error);
              }
              return;
            } else {
              // For any other status (like COMPLETED, EXPIRED, etc.)
              // Clear the local storage and redirect to dashboard
              localStorage.removeItem(`test_state_${id}`);
              navigate('/student-dashboard');
              return;
            }
          } catch (error) {
            console.error('Error fetching remaining duration:', error);
            // If there's an error fetching duration, clear localStorage
            localStorage.removeItem(`test_state_${id}`);
          }
        }
        
        // Only fetch test details and create new test if we don't have a valid saved state
        const testData = await testApi.getTestDetails(id);
        console.log('Test details received:', testData);
        
        // Handle both test structures (in_progress and upcoming)
        const testDetails = testData.test || testData;
        setTest(testDetails);

        // Only create new test if we don't have a saved state and it's an upcoming test
        if (!savedTestState && !testData.test && !studentTestUuid) {
          try {
            const { student_test_uuid } = await testApi.startStudentTest(id);
            console.log('Student test initialized with UUID:', student_test_uuid);
            
            if (!student_test_uuid) {
              throw new Error('Failed to get student test UUID from response');
            }
            
            setStudentTestUuid(student_test_uuid);
            setRemainingTime(testDetails.duration_minutes * 60);
            setTestStarted(false);

            // Save initial state to localStorage
            localStorage.setItem(`test_state_${id}`, JSON.stringify({
              student_test_uuid,
              remaining_time: testDetails.duration_minutes * 60
            }));
          } catch (error) {
            console.error('Error creating new test:', error);
            throw error;
          }
        }
      } catch (error) {
        console.error('Error initializing test:', error);
        initializedRef.current = false;
        alert('Failed to initialize test. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializeTest();
  }, [id, navigate]);

  // Update the periodic check effect to handle different statuses
  useEffect(() => {
    let timer: number;
    
    const checkRemainingDuration = async () => {
      if (testStarted && studentTestUuid) {
        try {
          const durationData = await testApi.getRemainingDuration(studentTestUuid);
          if (durationData.status === 'IN_PROGRESS') {
            setRemainingTime(durationData.remaining_duration);
            // Update localStorage
            if (id) {
              localStorage.setItem(`test_state_${id}`, JSON.stringify({
                student_test_uuid: studentTestUuid,
                remaining_time: durationData.remaining_duration
              }));
            }
          } else if (durationData.status === 'PENDING') {
            // For PENDING status, reset to initial state
            setTestStarted(false);
          } else {
            // For any other status (COMPLETED, EXPIRED, etc.)
            // Clear local storage and redirect to dashboard
            if (id) {
              localStorage.removeItem(`test_state_${id}`);
            }
            navigate('/student-dashboard');
            return;
          }
        } catch (error) {
          console.error('Error checking remaining duration:', error);
        }
      }
    };

    if (testStarted && studentTestUuid) {
      // Check remaining duration every 30 seconds
      timer = window.setInterval(checkRemainingDuration, 30000);
      // Initial check
      checkRemainingDuration();
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [testStarted, studentTestUuid, id, navigate]);

  useEffect(() => {
    let timer: number;
    if (testStarted && remainingTime > 0) {
      timer = setInterval(() => {
        setRemainingTime(prev => {
          const newTime = prev - 1;
          // Save updated state to localStorage every 2 seconds
          if (studentTestUuid && id && newTime % 2 === 0) {
            localStorage.setItem(`test_state_${id}`, JSON.stringify({
              student_test_uuid: studentTestUuid,
              remaining_time: newTime
            }));
          }
          return newTime;
        });
      }, 1000);
    } else if (remainingTime === 0 && testStarted) {  // Only submit if test was actually started
      // Clear localStorage when test is complete
      if (id) {
        localStorage.removeItem(`test_state_${id}`);
      }
      handleSubmit();
    }
    return () => clearInterval(timer);
  }, [testStarted, remainingTime, studentTestUuid, id]);

  const handleBeginTest = async () => {
    try {
      if (!studentTestUuid) {
        console.error('No student test UUID available. Current state:', {
          studentTestUuid,
          test,
          initializedRef: initializedRef.current
        });
        alert('Test not properly initialized. Please refresh the page and try again.');
        return;
      }

      console.log('Starting test with UUID:', studentTestUuid);
      await testApi.beginStudentTest(studentTestUuid);
      console.log('Test started successfully');
      setTestStarted(true);
    } catch (error) {
      console.error('Error starting test:', error);
      alert('Failed to start test. Please try again.');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const parseQuestionText = (text: string): number[] => {
    try {
      return JSON.parse(text);
    } catch {
      return [];
    }
  };

  // Function to find the next question UUID and its page
  const findNextQuestionInfo = useCallback((currentQuestionUuid: string): { uuid: string | null; page: number } => {
    if (!test) return { uuid: null, page: 1 };

    let totalQuestions = 0;
    let foundCurrent = false;
    
    for (const section of test.sections) {
      for (const question of section.questions) {
        if (foundCurrent) {
          // Calculate the page number for the next question
          const nextPage = Math.floor(totalQuestions / questionsPerPage) + 1;
          return { uuid: question.uuid, page: nextPage };
        }
        if (question.uuid === currentQuestionUuid) {
          foundCurrent = true;
        }
        totalQuestions++;
      }
    }
    return { uuid: null, page: 1 };
  }, [test, questionsPerPage]);

  // Update the debounced submit answer function to handle focus movement and page changes
  const debouncedSubmitAnswer = useCallback(
    debounce(async (studentTestUuid: string, questionUuid: string, answerText: string) => {
      try {
        setSubmittingQuestionId(questionUuid);
        await testApi.submitAnswer(studentTestUuid, questionUuid, answerText);
        console.log('Answer submitted successfully');
        
        // Find next question info and handle page change
        const { uuid: nextQuestionUuid, page: nextPage } = findNextQuestionInfo(questionUuid);
        if (nextQuestionUuid) {
          // If we need to change page, do it before focusing
          if (nextPage !== currentPage) {
            setCurrentPage(nextPage);
            // Add a small delay to allow the page change to complete before focusing
            setTimeout(() => {
              if (inputRefs.current[nextQuestionUuid]) {
                inputRefs.current[nextQuestionUuid].focus();
              }
            }, 100);
          } else if (inputRefs.current[nextQuestionUuid]) {
            // If we're staying on the same page, focus immediately
            inputRefs.current[nextQuestionUuid].focus();
          }
        }
      } catch (error) {
        console.error('Error submitting answer:', error);
      } finally {
        setSubmittingQuestionId(null);
      }
    }, 1000),
    [findNextQuestionInfo, currentPage]
  );

  // Update the keydown handler to use the new findNextQuestionInfo function
  const handleKeyDown = useCallback((questionUuid: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const { uuid: nextQuestionUuid, page: nextPage } = findNextQuestionInfo(questionUuid);
      if (nextQuestionUuid) {
        if (nextPage !== currentPage) {
          setCurrentPage(nextPage);
          setTimeout(() => {
            if (inputRefs.current[nextQuestionUuid]) {
              inputRefs.current[nextQuestionUuid].focus();
            }
          }, 100);
        } else if (inputRefs.current[nextQuestionUuid]) {
          inputRefs.current[nextQuestionUuid].focus();
        }
      }
    }
  }, [findNextQuestionInfo, currentPage]);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSubmitAnswer.cancel();
    };
  }, [debouncedSubmitAnswer]);

  // Function to find the page number containing a specific question
  const findQuestionPage = useCallback((questionUuid: string) => {
    if (!test) return 1;
    
    let totalQuestions = 0;
    for (const section of test.sections) {
      for (let i = 0; i < section.questions.length; i++) {
        if (section.questions[i].uuid === questionUuid) {
          return Math.floor(totalQuestions / questionsPerPage) + 1;
        }
        totalQuestions++;
      }
    }
    return 1;
  }, [test, questionsPerPage]);

  // Function to find the most recently answered question's page
  const findLatestAnsweredPage = useCallback((answersData: Array<{
    question_uuid: string;
    submitted_at: string;
  }>) => {
    if (answersData.length === 0) return 1;

    // Sort answers by submission time (most recent first)
    const sortedAnswers = [...answersData].sort((a, b) => 
      new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    );

    // Find the page number of the most recently answered question
    return findQuestionPage(sortedAnswers[0].question_uuid);
  }, [findQuestionPage]);

  // Update the answers fetch logic to set the current page
  useEffect(() => {
    const fetchAnswers = async () => {
      if (!studentTestUuid) return;

      try {
        const answersData = await testApi.getAnswers(studentTestUuid);
        const savedAnswers = answersData.answers.reduce((acc, answer) => ({
          ...acc,
          [answer.question_uuid]: answer.answer_text
        }), {});
        setAnswers(savedAnswers);

        // Set the current page to show the most recently answered questions
        const latestPage = findLatestAnsweredPage(answersData.answers);
        setCurrentPage(latestPage);
      } catch (error) {
        console.error('Error fetching saved answers:', error);
      }
    };

    if (testStarted || (studentTestUuid && test)) {
      fetchAnswers();
    }
  }, [studentTestUuid, test, findLatestAnsweredPage, testStarted]);

  // Update the answer change handler to navigate to the question's page
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));

    // Only submit if test is started and we have a value
    if (testStarted && studentTestUuid && value.trim()) {
      debouncedSubmitAnswer(studentTestUuid, questionId, value);
      // Navigate to the page containing this question
      const questionPage = findQuestionPage(questionId);
      setCurrentPage(questionPage);
    }
  };

  const handleSubmit = async () => {
    try {
      if (studentTestUuid && testStarted) {  // Only submit if test was actually started
        await testApi.submitStudentTest(studentTestUuid);
        // Clear all test-related items from localStorage
        if (id) {
          localStorage.removeItem(`test_state_${id}`);
        }
        localStorage.removeItem(`test_time_${studentTestUuid}`);
        navigate('/student-dashboard');
      }
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

  const renderMulDivQuestions = (questions: Question[]) => {
    return questions.map((question) => {
      const numbers = parseQuestionText(question.text);
      const operatorSign = question.question_type === 'multiply' ? '×' : '÷';
      const isSubmitting = submittingQuestionId === question.uuid;
      
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
            <div className={`inline-block rounded-lg border transition-colors duration-200 ${
              isSubmitting 
                ? 'border-yellow-300 dark:border-yellow-700' 
                : 'border-indigo-100 dark:border-indigo-800 focus-within:border-indigo-600 dark:focus-within:border-indigo-500'
            } bg-white dark:bg-gray-900`}>
              <input
                ref={el => {
                  if (el) {
                    inputRefs.current[question.uuid] = el;
                  }
                }}
                type="number"
                value={answers[question.uuid] || ''}
                onChange={(e) => handleAnswerChange(question.uuid, e.target.value)}
                onKeyDown={(e) => handleKeyDown(question.uuid, e)}
                className="w-14 sm:w-16 py-1.5 text-lg sm:text-xl text-center font-mono bg-transparent focus:outline-none dark:text-white placeholder-indigo-300 dark:placeholder-indigo-600"
                placeholder="?"
                disabled={!testStarted}
              />
            </div>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="max-w-full mx-auto">
        <button
          onClick={() => navigate('/student-dashboard')}
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
                  <span className="font-medium">{testStarted ? formatTime(remainingTime) : `${test.duration_minutes} minutes`}</span>
                </div>
                <div className="flex items-center text-purple-600 dark:text-purple-400">
                  <span className="font-medium">Level {test.level}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {!testStarted ? (
              <div className="text-center py-12">
                <div className="mb-6">
                  <PlayCircle className="w-16 h-16 text-indigo-500 mx-auto animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Ready to Begin?
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  This test will take {test.duration_minutes} minutes to complete.
                  Make sure you have enough time and a quiet environment.
                </p>
                <button
                  onClick={handleBeginTest}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-medium rounded-full hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 shadow-lg"
                >
                  Begin Test
                </button>
              </div>
            ) : (
              test.sections.map((section, sectionIndex) => {
                const { currentQuestions, pagination } = renderPagination(section.questions, sectionIndex);
                const isMulDiv = section.section_type === "MUL_DIV";
                
                if (isMulDiv) {
                  return (
                    <div key={section.uuid} className="mb-8 last:mb-0">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mr-3 shadow-lg">
                          <span className="text-lg font-bold text-white">{sectionIndex + 1}</span>
                        </div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          Multiplication & Division Fun!
                        </h2>
                      </div>
                      
                      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-indigo-100 dark:border-indigo-800">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-indigo-100 dark:border-indigo-800">
                              <th className="w-16 sm:w-20 px-2 sm:px-3 py-2.5 text-left text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 border-r-[3px] border-r-indigo-900 dark:border-r-indigo-900 sticky left-0">
                                No.
                              </th>
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
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-indigo-100/50 dark:divide-indigo-800/50">
                            {renderMulDivQuestions(currentQuestions)}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-6">
                        {pagination}
                      </div>
                    </div>
                  );
                }

                // For addition sections, keep the existing rendering logic
                const maxLength = currentQuestions.reduce((max, question) => {
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
                        {section.section_type === 'add' ? 'Addition' : 'Multiplication'} Fun!
                      </h2>
                    </div>
                    
                    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-indigo-200 dark:border-indigo-800">
                      <table className="min-w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="w-16 sm:w-20 md:w-24 px-2 sm:px-3 py-3 text-left text-sm sm:text-base font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 border-r-[3px] border-r-indigo-900 dark:border-r-indigo-900 sticky left-0">
                              No.
                            </th>
                            {currentQuestions.map((question) => (
                              <th
                                key={question.uuid}
                                className="w-16 sm:w-20 md:w-24 px-2 sm:px-3 py-3 text-center text-sm sm:text-base font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 border-r-[3px] border-r-indigo-900 dark:border-r-indigo-900"
                              >
                                Q{question.order}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
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
                                <div className={`inline-block rounded-lg border transition-colors duration-200 ${
                                  submittingQuestionId === question.uuid 
                                    ? 'border-yellow-300 dark:border-yellow-700' 
                                    : 'border-indigo-100 dark:border-indigo-800 focus-within:border-indigo-600 dark:focus-within:border-indigo-500'
                                } bg-white dark:bg-gray-900`}>
                                  <input
                                    ref={el => {
                                      if (el) {
                                        inputRefs.current[question.uuid] = el;
                                      }
                                    }}
                                    type="number"
                                    value={answers[question.uuid] || ''}
                                    onChange={(e) => handleAnswerChange(question.uuid, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(question.uuid, e)}
                                    className="w-16 sm:w-20 px-2 py-2 text-base sm:text-lg md:text-xl text-center font-mono 
                                      bg-transparent
                                      rounded-lg focus:outline-none
                                      dark:text-white placeholder-indigo-300 dark:placeholder-indigo-600
                                      transition-colors duration-200"
                                    placeholder="?"
                                    disabled={!testStarted}
                                  />
                                </div>
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-6">
                      {pagination}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentTestDetails; 