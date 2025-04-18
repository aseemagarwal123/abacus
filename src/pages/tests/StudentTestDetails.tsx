import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft, ChevronLeft, ChevronRight, PlayCircle, Wifi, WifiOff } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { setTests } from '../../store/slices/testSlice';
import { testApi } from '../../services/api/test';
import { Question, Test } from '../../types';
import debounce from 'lodash/debounce';
import { toast } from 'react-hot-toast';
import { Tab } from '@headlessui/react';

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
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isTimeExpired, setIsTimeExpired] = useState(false);
  const [isPendingSubmission, setIsPendingSubmission] = useState(false);
  const [sectionPages, setSectionPages] = useState<Record<string, number>>({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const isMulDiv = test?.sections[0]?.section_type === "MUL_DIV";
      
      if (isMulDiv) {
        // Pagination for multiplication/division questions
        if (width < 640) { // mobile
          setQuestionsPerPage(4);
          setIsMobile(true)
        } else if (width < 1024) { // tablet
          setQuestionsPerPage(4);
        } else { // desktop
          setQuestionsPerPage(10);
        }
      } else {
        // Updated pagination for addition questions
        if (width < 640) { // mobile
          setQuestionsPerPage(4);
          setIsMobile(true)
        } else if (width < 1024) { // tablet
          setQuestionsPerPage(5);
        } else { // desktop
          setQuestionsPerPage(10); // Ensure 10 questions per page for addition on desktop
        }
      }
      console.log("isMobile", isMobile);
    };

    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [test]);

  // Add cleanup helper function
  const cleanupTestStorage = useCallback((testId: string, studentTestUuid: string) => {
    console.log('Cleaning up test storage...', { testId, studentTestUuid });
    // Clean up ALL localStorage items related to the test
    localStorage.removeItem(`test_state_${testId}`);
    localStorage.removeItem(`test_time_${studentTestUuid}`);
    localStorage.removeItem(`test_time_expired_${studentTestUuid}`);
    localStorage.removeItem(`test_submission_pending_${studentTestUuid}`);
    localStorage.removeItem(`pending_submissions_${studentTestUuid}`);
  }, []);

  // Update handleTimeUp to use cleanup function
  const handleTimeUp = useCallback(async () => {
    setShowTimeUpModal(true);
    await new Promise(resolve => setTimeout(resolve, 4000));
    setShowTimeUpModal(false);
    
    if (!isOnline) {
      // Store time expiration state
      setIsTimeExpired(true);
      setIsPendingSubmission(true);
      localStorage.setItem(`test_time_expired_${studentTestUuid}`, 'true');
      toast('Time is up! Your test will be submitted when you are back online.', {
        duration: 4000,
        icon: <WifiOff className="w-5 h-5 text-yellow-500" />,
      });
    } else {
      // Submit test immediately if online
      if (studentTestUuid && id) {
        await submitTest(studentTestUuid, true);
      }
    }
  }, [studentTestUuid, id, navigate, isOnline, cleanupTestStorage]);

  const initializeTest = async () => {
    if (initializedRef.current || !id) return;
    
    try {
      setLoading(true);
      initializedRef.current = true;
      
      console.log('Initializing test with ID:', id);

      // First try to get test details from localStorage if offline
      const savedTestState = localStorage.getItem(`test_state_${id}`);
      let testData;
      
      if (!navigator.onLine && savedTestState) {
        const state = JSON.parse(savedTestState);
        if (state.test_data) {
          testData = { test: state.test_data };
          setIsOfflineMode(true);
          console.log('Using saved test data from localStorage');
          
          // Restore section pages if available
          if (state.section_pages) {
            setSectionPages(state.section_pages);
          }
        }
      }
      
      if (!testData) {
        // Fetch test details from API if online or no saved data
        testData = await testApi.getTestDetails(id);
      }
      
      console.log('Test details received:', testData);
      
      const testDetails = testData.test || testData;
      setTest(testDetails);
      setRemainingTime(testDetails.duration_minutes * 60);

      if (savedTestState) {
        const { student_test_uuid, remaining_time, current_section, section_pages } = JSON.parse(savedTestState);
        console.log('Found saved test state:', { student_test_uuid, remaining_time, current_section, section_pages });
        
        // Restore section pages if available
        if (section_pages) {
          setSectionPages(section_pages);
        }

        // Check if test was submitted offline or expired offline
        const wasSubmittedOffline = localStorage.getItem(`test_submission_pending_${student_test_uuid}`) === 'true';
        const wasExpiredOffline = localStorage.getItem(`test_time_expired_${student_test_uuid}`) === 'true';
        
        // Get pending submissions using the student_test_uuid from saved state
        const pendingSubmissions = getPendingSubmissions(student_test_uuid);

        if (!navigator.onLine) {
          // Handle offline state
          setStudentTestUuid(student_test_uuid);
          setTestStarted(true);
          setCurrentSection(current_section || 0);
          setRemainingTime(remaining_time);
          setIsOfflineMode(true);
          
          // Load saved answers
          const savedAnswers = pendingSubmissions.reduce((acc: Record<string, string>, submission: { questionUuid: string; answer: string }) => ({
            ...acc,
            [submission.questionUuid]: submission.answer
          }), {});
          setAnswers(savedAnswers);
          
          return;
        }

        try {
          const durationData = await testApi.getRemainingDuration(student_test_uuid);
          console.log('Fetched remaining duration:', durationData);
          
          setStudentTestUuid(student_test_uuid);
          
          if (durationData.status === 'IN_PROGRESS') {
            // NEW: Always check for pending answers when coming back online
            if (pendingSubmissions.length > 0) {
              console.log('Found pending submissions, syncing...');
              const syncResults = await syncPendingAnswers(student_test_uuid);
              if (syncResults.failed.length > 0) {
                toast.error('Some answers failed to sync. Please try again.');
              } else if (syncResults.success.length > 0) {
                toast.success('Successfully synced your answers!');
              }
            }

            // If test was submitted offline or expired offline and we're now online
            if ((wasSubmittedOffline || wasExpiredOffline) && navigator.onLine) {
              console.log('Test was submitted/expired offline and now online, will sync first...');
              setTestStarted(true);
              setRemainingTime(0);
              setIsTimeExpired(wasExpiredOffline);
              setIsPendingSubmission(true);
              
              // Show appropriate modal
              if (wasExpiredOffline) {
                setShowTimeUpModal(true);
                setTimeout(() => setShowTimeUpModal(false), 4000);
              }
              
              // IMPORTANT: Return here to prevent the normal test flow
              // This ensures we don't accidentally submit the test before syncing
              return;
            }

            // Normal test continuation
            setTestStarted(true);
            setRemainingTime(durationData.remaining_duration);
            setCurrentSection(current_section || 0);
            
            // Save state to localStorage
            localStorage.setItem(`test_state_${id}`, JSON.stringify({
              student_test_uuid,
              remaining_time: durationData.remaining_duration,
              current_section: current_section || 0
            }));

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
            setTestStarted(false);
            setRemainingTime(testDetails.duration_minutes * 60);
          } else {
            // Test is already completed or expired
            cleanupTestStorage(id, student_test_uuid);
            navigate('/student-dashboard');
            return;
          }
        } catch (error) {
          console.error('Error fetching remaining duration:', error);
          if (!navigator.onLine) {
            // If offline, use saved state
            setStudentTestUuid(student_test_uuid);
            setTestStarted(true);
            setCurrentSection(current_section || 0);
            setRemainingTime(remaining_time);
            setIsOfflineMode(true);
          } else {
            localStorage.removeItem(`test_state_${id}`);
          }
        }
      }
      
    } catch (error) {
      console.error('Error initializing test:', error);
      initializedRef.current = false;
      if (navigator.onLine) {
        alert('Failed to initialize test. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeTest();
  }, [id]);

  const handleBeginTest = async () => {
    try {
      setLoading(true);
      
      // Create new student test
      const { student_test_uuid } = await testApi.startStudentTest(id!);
      console.log('Student test initialized with UUID:', student_test_uuid);
      
      if (!student_test_uuid) {
        throw new Error('Failed to get student test UUID from response');
      }
      
      // Start the test
      await testApi.beginStudentTest(student_test_uuid);
      console.log('Test started successfully');
      
      // Update state and localStorage
      setStudentTestUuid(student_test_uuid);
      setTestStarted(true);
      
      // Save initial state to localStorage
      localStorage.setItem(`test_state_${id}`, JSON.stringify({
        student_test_uuid,
        remaining_time: test?.duration_minutes ? test.duration_minutes * 60 : 0
      }));
      
    } catch (error) {
      console.error('Error starting test:', error);
      alert('Failed to start test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to get pending submissions from localStorage
  const getPendingSubmissions = useCallback((testUuid: string) => {
    try {
      const saved = localStorage.getItem(`pending_submissions_${testUuid}`);
      console.log('Retrieved pending submissions from localStorage for UUID:', testUuid, 'Data:', saved);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error getting pending submissions:', error);
      return [];
    }
  }, []);

  // Function to save pending submission to localStorage
  const savePendingSubmission = useCallback((testUuid: string, submission: { questionUuid: string; answer: string; timestamp: number }) => {
    const currentSubmissions = getPendingSubmissions(testUuid);
    const updatedSubmissions = [...currentSubmissions, submission];
    localStorage.setItem(`pending_submissions_${testUuid}`, JSON.stringify(updatedSubmissions));
  }, [getPendingSubmissions]);

  // Function to clear pending submissions from localStorage
  const clearPendingSubmissions = useCallback(() => {
    if (!studentTestUuid) return;
    localStorage.removeItem(`pending_submissions_${studentTestUuid}`);
  }, [studentTestUuid]);

  // Single function to handle bulk answer syncing
  const syncPendingAnswers = async (student_test_uuid: string): Promise<{ success: string[], failed: string[] }> => {
    const pendingSubmissions = getPendingSubmissions(student_test_uuid);
    const syncResults = {
      success: [] as string[],
      failed: [] as string[]
    };

    toast('Syncing your answers...', {
      duration: 3000,
      icon: <Wifi className="w-5 h-5 text-green-500" />,
    });

    for (const sub of pendingSubmissions) {
      try {
        await testApi.submitAnswer(student_test_uuid, sub.questionUuid, sub.answer);
        syncResults.success.push(sub.questionUuid);
      } catch (error) {
        console.error('Error syncing answer:', error);
        syncResults.failed.push(sub.questionUuid);
      }
    }

    // Update localStorage based on sync results
    if (syncResults.success.length > 0) {
      const remainingSubmissions = pendingSubmissions.filter(
        (sub: { questionUuid: string; answer: string; timestamp: number }) => 
          !syncResults.success.includes(sub.questionUuid)
      );
      localStorage.setItem(
        `pending_submissions_${student_test_uuid}`,
        JSON.stringify(remainingSubmissions)
      );
    }

    return syncResults;
  };

  // Update submitTest to use syncPendingAnswers
  const submitTest = async (student_test_uuid: string, isTimeUp = false) => {
    try {
      if (!isOnline) {
        // Store submission intent locally
        localStorage.setItem(`test_submission_pending_${student_test_uuid}`, 'true');
        setIsPendingSubmission(true);
        toast('Your test will be submitted automatically when you are back online. You can safely close this window.', {
          duration: 5000,
          icon: <WifiOff className="w-5 h-5 text-yellow-500" />,
        });
        return;
      }

      // First, sync all pending answers
      const syncResults = await syncPendingAnswers(student_test_uuid);

      // If any answers failed to sync, don't proceed with test submission
      if (syncResults.failed.length > 0) {
        toast.error('Some answers failed to sync. Please try again.');
        return;
      }

      // Show submission toast
      toast('Submitting your test...', {
        duration: 2000,
        icon: <Clock className="w-5 h-5 text-blue-500" />,
      });

      // Only proceed with test submission if all answers are synced
      await testApi.submitStudentTest(student_test_uuid);
      toast.success('Test submitted successfully!');
      if (id) {
        cleanupTestStorage(id, student_test_uuid);
      }
      navigate('/student-dashboard');
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('Failed to submit test. Please try again.');
    }
  };

  // Update handleOnline to use syncPendingAnswers
  const handleOnline = async () => {
    try {
      const savedTestState = localStorage.getItem(`test_state_${id}`);
      if (!savedTestState) return;

      const { student_test_uuid } = JSON.parse(savedTestState);
      if (!student_test_uuid) return;

      // Show syncing toast
      toast('Syncing answers...', {
        duration: 3000,
        icon: <Wifi className="w-5 h-5 text-green-500" />,
      });

      // First sync all pending answers
      const syncResults = await syncPendingAnswers(student_test_uuid);

      // If any answers failed to sync, don't proceed with test submission
      if (syncResults.failed.length > 0) {
        toast.error('Some answers failed to sync. Please try again.');
        return;
      }

      // Check if we need to submit the test
      const isTimeExpired = localStorage.getItem(`test_time_expired_${student_test_uuid}`);
      const hasTestSubmissionPending = localStorage.getItem(`test_submission_pending_${student_test_uuid}`);

      // Only submit if we have no pending submissions
      const remainingSubmissions = getPendingSubmissions(student_test_uuid);
      if ((isTimeExpired === 'true' || hasTestSubmissionPending === 'true') && remainingSubmissions.length === 0) {
        await submitTest(student_test_uuid);
      }
    } catch (error) {
      console.error('Error handling online state:', error);
      toast.error('Failed to sync answers. Please try again.');
    }
  };

  // Keep the debounced answer submission for real-time saving
  const debouncedSubmitAnswer = useCallback(
    debounce(async (studentTestUuid: string, questionUuid: string, answerText: string) => {
      try {
        setSubmittingQuestionId(questionUuid);
        
        if (!isOnline) {
          // Store answer in localStorage if offline
          savePendingSubmission(studentTestUuid, {
            questionUuid,
            answer: answerText,
            timestamp: Date.now(),
          });
          
          toast('Answer saved locally. Will sync when online.', {
            duration: 2000,
            icon: <WifiOff className="w-5 h-5 text-yellow-500" />,
          });
        } else {
          await testApi.submitAnswer(studentTestUuid, questionUuid, answerText);
        }
      } catch (error) {
        console.error('Error submitting answer:', error);
        toast.error('Failed to save answer. Please try again.', {
          duration: 3000,
        });
      } finally {
        setSubmittingQuestionId(null);
      }
    }, 1000),
    [isOnline, savePendingSubmission]
  );

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
    } else if (remainingTime === 0 && testStarted) {
      handleTimeUp();
    }
    return () => clearInterval(timer);
  }, [testStarted, remainingTime, studentTestUuid, id, handleTimeUp]);

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

  // Add helper function to find next question
  const findNextQuestionInfo = useCallback((currentQuestionUuid: string): { uuid: string | null; sectionIndex: number; page: number } => {
    if (!test) return { uuid: null, sectionIndex: currentSection, page: 1 };

    let foundCurrent = false;
    let totalQuestions = 0;
    
    for (let sectionIndex = 0; sectionIndex < test.sections.length; sectionIndex++) {
      const section = test.sections[sectionIndex];
      for (let i = 0; i < section.questions.length; i++) {
        if (foundCurrent) {
          // Calculate the page number for the next question
          const nextPage = Math.floor(i / questionsPerPage) + 1;
          return { 
            uuid: section.questions[i].uuid, 
            sectionIndex,
            page: nextPage 
          };
        }
        if (section.questions[i].uuid === currentQuestionUuid) {
          foundCurrent = true;
        }
        totalQuestions++;
      }
    }
    return { uuid: null, sectionIndex: currentSection, page: 1 };
  }, [test, currentSection, questionsPerPage]);

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

  // Update the answers fetch effect
  useEffect(() => {
    const fetchAnswers = async () => {
      if (!studentTestUuid || !test) return;

      try {
        const answersData = await testApi.getAnswers(studentTestUuid);
        const savedAnswers = answersData.answers.reduce((acc, answer) => ({
          ...acc,
          [answer.question_uuid]: answer.answer_text
        }), {});
        setAnswers(savedAnswers);

        if (answersData.answers.length > 0) {
          // Sort answers by submission time (most recent first)
          const sortedAnswers = [...answersData.answers].sort((a, b) => 
            new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
          );

          // Find the section and page of the most recently answered question
          const lastAnsweredQuestionId = sortedAnswers[0].question_uuid;
          let foundSection = 0;
          let foundPage = 1;

          // Find the section index and page number
          test.sections.forEach((section, sectionIndex) => {
            const questionIndex = section.questions.findIndex(q => q.uuid === lastAnsweredQuestionId);
            if (questionIndex !== -1) {
              foundSection = sectionIndex;
              foundPage = Math.floor(questionIndex / questionsPerPage) + 1;
              
              // Update section pages state
              setSectionPages(prev => ({
                ...prev,
                [section.uuid]: foundPage
              }));
            }
          });

          // Update current section
          setCurrentSection(foundSection);
          
          // Save the state to localStorage
          if (id) {
            const savedTestState = localStorage.getItem(`test_state_${id}`);
            if (savedTestState) {
              const state = JSON.parse(savedTestState);
              localStorage.setItem(`test_state_${id}`, JSON.stringify({
                ...state,
                current_section: foundSection,
                section_pages: {
                  ...state.section_pages,
                  [test.sections[foundSection].uuid]: foundPage
                }
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching saved answers:', error);
      }
    };

    if (testStarted || (studentTestUuid && test)) {
      fetchAnswers();
    }
  }, [studentTestUuid, test, questionsPerPage, testStarted, id]);

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

  // Add offline mode UI elements
  const renderOfflineIndicator = () => {
    if (!isOnline) {
      return (
        <div className="fixed bottom-4 right-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-50">
          <WifiOff className="w-5 h-5" />
          <span>
            {isTimeExpired 
              ? "Time's up! Your test will be submitted when you're back online."
              : "You are offline. Your answers will be saved locally."}
          </span>
        </div>
      );
    }
    return null;
  };

  // Update handleKeyDown to handle page navigation
  const handleKeyDown = useCallback((questionUuid: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const { uuid: nextQuestionUuid, sectionIndex, page: nextPage } = findNextQuestionInfo(questionUuid);
      
      if (nextQuestionUuid) {
        // If next question is in a different section
        if (sectionIndex !== currentSection) {
          setCurrentSection(sectionIndex);
          // Update section pages for the new section
          setSectionPages(prev => ({
            ...prev,
            [test!.sections[sectionIndex].uuid]: nextPage
          }));
          
          // Save state to localStorage
          if (studentTestUuid && id) {
            const savedTestState = localStorage.getItem(`test_state_${id}`);
            if (savedTestState) {
              const state = JSON.parse(savedTestState);
              localStorage.setItem(`test_state_${id}`, JSON.stringify({
                ...state,
                current_section: sectionIndex,
                section_pages: {
                  ...state.section_pages,
                  [test!.sections[sectionIndex].uuid]: nextPage
                }
              }));
            }
          }
        } else {
          // If next question is in the same section but different page
          const currentSectionUuid = test!.sections[currentSection].uuid;
          const currentSectionPage = sectionPages[currentSectionUuid] || 1;
          
          if (nextPage !== currentSectionPage) {
            setSectionPages(prev => ({
              ...prev,
              [currentSectionUuid]: nextPage
            }));
          }
        }

        // Focus the next input after a short delay to allow for state updates
        setTimeout(() => {
          if (inputRefs.current[nextQuestionUuid]) {
            inputRefs.current[nextQuestionUuid].focus();
          }
        }, 100);
      }
    }
  }, [test, currentSection, sectionPages, findNextQuestionInfo, studentTestUuid, id]);

  // Add effect to handle online/offline events
  useEffect(() => {
    const handleOnlineEvent = () => {
      setIsOnline(true);
      toast('Back online!', {
        duration: 4000,
        icon: <Wifi className="w-5 h-5 text-green-500" />,
      });
      handleOnline();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast('You are offline. Your answers will be saved locally.', {
        duration: 4000,
        icon: <WifiOff className="w-5 h-5 text-yellow-500" />,
      });
    };

    window.addEventListener('online', handleOnlineEvent);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnlineEvent);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add effect to check for pending submission on component mount
  useEffect(() => {
    if (studentTestUuid) {
      const hasPendingSubmission = localStorage.getItem(`test_submission_pending_${studentTestUuid}`) === 'true';
      setIsPendingSubmission(hasPendingSubmission);
    }
  }, [studentTestUuid]);

  // Add effect to check for time expiration on component mount
  useEffect(() => {
    if (studentTestUuid) {
      const isTimeExpired = localStorage.getItem(`test_time_expired_${studentTestUuid}`) === 'true';
      const hasTestSubmissionPending = localStorage.getItem(`test_submission_pending_${studentTestUuid}`) === 'true';
      
      // Set UI state if either condition is true
      if (isTimeExpired || hasTestSubmissionPending) {
        setIsPendingSubmission(true);
        setIsTimeExpired(isTimeExpired);
      }
    }
  }, [studentTestUuid]);

  // Add cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clean up if test is completed or component unmounts
      if (id && studentTestUuid) {
        const isCompleted = localStorage.getItem(`test_submission_pending_${studentTestUuid}`) === 'true' ||
                          localStorage.getItem(`test_time_expired_${studentTestUuid}`) === 'true';
        if (isCompleted) {
          localStorage.removeItem(`test_state_${id}`);
          localStorage.removeItem(`test_time_${studentTestUuid}`);
          localStorage.removeItem(`test_time_expired_${studentTestUuid}`);
          localStorage.removeItem(`test_submission_pending_${studentTestUuid}`);
          localStorage.removeItem(`pending_submissions_${studentTestUuid}`);
          console.log('Cleaned up all localStorage items on unmount');
        }
      }
    };
  }, [id, studentTestUuid]);

  // Update the handleSubmit function
  const handleSubmit = async () => {
    try {
      if (studentTestUuid && testStarted) {
        if (!isOnline) {
          // Store submission intent locally
          localStorage.setItem(`test_submission_pending_${studentTestUuid}`, 'true');
          setIsPendingSubmission(true);
          toast('Your test will be submitted automatically when you are back online. You can safely close this window.', {
            duration: 5000,
            icon: <WifiOff className="w-5 h-5 text-yellow-500" />,
          });
        } else {
          setIsPendingSubmission(true);
          // Use submitTest which will ensure all answers are synced first
          await submitTest(studentTestUuid);
        }
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('Failed to submit test. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-indigo-200 dark:border-indigo-900 p-8 max-w-sm w-full">
          <div className="flex flex-col items-center">
            {/* Bouncing Numbers Animation */}
            <div className="flex items-center space-x-2 mb-6">
              {[1, 2, 3].map((num, index) => (
                <div
                  key={num}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold animate-bounce"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  {num}
                </div>
              ))}
            </div>

            {/* Loading Text with Rainbow Animation */}
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
              Loading Your Test...
            </h2>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-[loading_2s_ease-in-out_infinite]"></div>
            </div>

            {/* Fun Loading Messages */}
            <p className="text-indigo-600 dark:text-indigo-400 text-center text-sm animate-[fadeInOut_4s_ease-in-out_infinite]">
              Getting your math adventure ready! 🚀
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

  if (!test) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">Test not found</p>
      </div>
    );
  }

  const renderPagination = (questions: Question[], sectionUuid: string) => {
    const totalPages = Math.ceil(questions.length / questionsPerPage);
    const currentSectionPage = sectionPages[sectionUuid] || 1;
    const startIndex = (currentSectionPage - 1) * questionsPerPage;
    const endIndex = startIndex + questionsPerPage;
    const currentQuestions = questions.slice(startIndex, endIndex);

    return {
      currentQuestions,
      pagination: (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSectionPages(prev => ({
                ...prev,
                [sectionUuid]: Math.max((prev[sectionUuid] || 1) - 1, 1)
              }))}
              disabled={currentSectionPage === 1 || isPendingSubmission}
              className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Page {currentSectionPage} of {totalPages}
            </span>
            <button
              onClick={() => setSectionPages(prev => ({
                ...prev,
                [sectionUuid]: Math.min((prev[sectionUuid] || 1) + 1, totalPages)
              }))}
              disabled={currentSectionPage === totalPages || isPendingSubmission}
              className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          {sectionUuid === test.sections[test.sections.length - 1].uuid && (
            <button
              onClick={handleSubmit}
              disabled={isPendingSubmission}
              className={`px-6 py-2 font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 shadow-md ${
                isPendingSubmission
                  ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 focus:ring-blue-500'
              }`}
            >
              {isPendingSubmission ? 'Test Pending Submission...' : 'Submit Test'}
            </button>
          )}
        </div>
      )
    };
  };

  const renderMobileView = (questions: Question[], isMulDiv: boolean) => {
    if (isMulDiv) {
      return questions.map((question) => (
        <tr key={question.uuid} className="border-b border-blue-100 dark:border-blue-800">
          <td className="w-8 px-2 py-3 text-center text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap bg-indigo-50/50 dark:bg-indigo-900/20">
            {question.order}
          </td>
          <td className="px-3 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-mono whitespace-nowrap">{parseQuestionText(question.text)[0]}</span>
                  <span className="text-lg text-blue-600 dark:text-blue-400 font-mono">
                    {question.question_type === 'multiply' ? '×' : '÷'}
                  </span>
                  <span className="text-lg font-mono whitespace-nowrap">{parseQuestionText(question.text)[1]}</span>
                  <span className="text-lg text-blue-600 dark:text-blue-400 font-mono">=</span>
                </div>
                <div className={`inline-block rounded-lg border transition-colors duration-200 ${
                  submittingQuestionId === question.uuid 
                    ? 'border-yellow-300 dark:border-yellow-700' 
                    : isPendingSubmission
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800'
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
                    className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-16 py-2 text-lg text-center font-mono bg-transparent focus:outline-none dark:text-white placeholder-indigo-300 dark:placeholder-indigo-600 ${
                      isPendingSubmission ? 'cursor-not-allowed text-gray-500 dark:text-gray-400' : ''
                    }`}
                    placeholder="?"
                    disabled={!testStarted || isPendingSubmission}
                  />
                </div>
              </div>
            </div>
          </td>
        </tr>
      ));
    } else {
      return (
        <>
          {Array.from({ length: Math.max(...questions.map(q => parseQuestionText(q.text).length)) }).map((_, rowIndex) => {
            const bottomUpIndex = Math.max(...questions.map(q => parseQuestionText(q.text).length)) - rowIndex - 1;
            return (
              <tr key={rowIndex}>
                <td className="w-12 px-1 py-2 text-center text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap bg-indigo-50/50 dark:bg-indigo-900/10 border-t border-t-indigo-100 dark:border-t-indigo-800 border-r-[3px] border-r-indigo-900 dark:border-r-indigo-900 sticky left-0">
                  {rowIndex + 1}
                </td>
                {questions.map((question) => {
                  const numbers = parseQuestionText(question.text);
                  return (
                    <td
                      key={question.uuid}
                      className="w-12 px-1 py-2 text-sm text-gray-900 dark:text-white whitespace-nowrap border-t border-t-indigo-100 dark:border-t-indigo-800 border-r-[3px] border-r-indigo-900 dark:border-r-indigo-900"
                    >
                      <div className="w-full flex justify-end pr-1 font-mono">
                        {numbers[bottomUpIndex] !== undefined ? formatNumber(numbers[bottomUpIndex]) : ''}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
          <tr>
            <td className="w-12 px-1 py-3 text-center text-sm font-bold text-indigo-700 dark:text-indigo-300 whitespace-nowrap bg-indigo-50/50 dark:bg-indigo-900/10 border-t-2 border-t-indigo-200 dark:border-t-indigo-800 border-r-[3px] border-r-indigo-900 dark:border-r-indigo-900 sticky left-0">
              Answer
            </td>
            {questions.map((question) => (
              <td
                key={question.uuid}
                className="w-12 px-1 py-3 text-center border-t-2 border-t-indigo-200 dark:border-t-indigo-800 border-r-[3px] border-r-indigo-900 dark:border-r-indigo-900"
              >
                <div className={`inline-block rounded-lg border transition-colors duration-200 ${
                  submittingQuestionId === question.uuid 
                    ? 'border-yellow-300 dark:border-yellow-700' 
                    : isPendingSubmission
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800'
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
                    className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-12 px-1 py-1 text-sm text-center font-mono bg-transparent focus:outline-none dark:text-white placeholder-indigo-300 dark:placeholder-indigo-600 ${
                      isPendingSubmission ? 'cursor-not-allowed text-gray-500 dark:text-gray-400' : ''
                    }`}
                    placeholder="?"
                    disabled={!testStarted || isPendingSubmission}
                  />
                </div>
              </td>
            ))}
          </tr>
        </>
      );
    }
  };

  const renderDesktopView = (questions: Question[], isMulDiv: boolean) => {
    if (isMulDiv) {
      const rowsPerColumn = Math.ceil(questions.length / 2);
      const firstColumnQuestions = questions.slice(0, rowsPerColumn);
      const secondColumnQuestions = questions.slice(rowsPerColumn);

      return firstColumnQuestions.map((question1, rowIndex) => {
        const question2 = secondColumnQuestions[rowIndex];
        return (
          <tr key={question1.uuid}>
            <td className="w-16 px-4 py-3 text-center text-base font-medium text-gray-900 dark:text-white whitespace-nowrap bg-indigo-50/50 dark:bg-indigo-900/20 border-b-[3px] border-b-blue-600 border-r-[3px] border-r-blue-600">
              {question1.order}
            </td>
            <td className="px-4 py-3 border-b-[3px] border-b-blue-600 border-r-[3px] border-r-blue-600">
              <div className="flex items-center space-x-4">
                <span className="text-xl font-mono">{parseQuestionText(question1.text)[0]}</span>
                <span className="text-xl text-blue-600 dark:text-blue-400 font-mono">
                  {question1.question_type === 'multiply' ? '×' : '÷'}
                </span>
                <span className="text-xl font-mono">{parseQuestionText(question1.text)[1]}</span>
                <span className="text-xl text-blue-600 dark:text-blue-400 font-mono">=</span>
                <div className={`inline-block rounded-lg border transition-colors duration-200 ${
                  submittingQuestionId === question1.uuid 
                    ? 'border-yellow-300 dark:border-yellow-700' 
                    : isPendingSubmission
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800'
                    : 'border-indigo-100 dark:border-indigo-800 focus-within:border-indigo-600 dark:focus-within:border-indigo-500'
                } bg-white dark:bg-gray-900`}>
                  <input
                    ref={el => {
                      if (el) {
                        inputRefs.current[question1.uuid] = el;
                      }
                    }}
                    type="number"
                    value={answers[question1.uuid] || ''}
                    onChange={(e) => handleAnswerChange(question1.uuid, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(question1.uuid, e)}
                    className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-20 py-1.5 text-xl text-center font-mono bg-transparent focus:outline-none dark:text-white placeholder-indigo-300 dark:placeholder-indigo-600 ${
                      isPendingSubmission ? 'cursor-not-allowed text-gray-500 dark:text-gray-400' : ''
                    }`}
                    placeholder="?"
                    disabled={!testStarted || isPendingSubmission}
                  />
                </div>
              </div>
            </td>
            {question2 ? (
              <>
                <td className="w-16 px-4 py-3 text-center text-base font-medium text-gray-900 dark:text-white whitespace-nowrap bg-indigo-50/50 dark:bg-indigo-900/20 border-b-[3px] border-b-blue-600 border-r-[3px] border-r-blue-600">
                  {question2.order}
                </td>
                <td className="px-4 py-3 border-b-[3px] border-b-blue-600">
                  <div className="flex items-center space-x-4">
                    <span className="text-xl font-mono">{parseQuestionText(question2.text)[0]}</span>
                    <span className="text-xl text-blue-600 dark:text-blue-400 font-mono">
                      {question2.question_type === 'multiply' ? '×' : '÷'}
                    </span>
                    <span className="text-xl font-mono">{parseQuestionText(question2.text)[1]}</span>
                    <span className="text-xl text-blue-600 dark:text-blue-400 font-mono">=</span>
                    <div className={`inline-block rounded-lg border transition-colors duration-200 ${
                      submittingQuestionId === question2.uuid 
                        ? 'border-yellow-300 dark:border-yellow-700' 
                        : isPendingSubmission
                        ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800'
                        : 'border-indigo-100 dark:border-indigo-800 focus-within:border-indigo-600 dark:focus-within:border-indigo-500'
                    } bg-white dark:bg-gray-900`}>
                      <input
                        ref={el => {
                          if (el) {
                            inputRefs.current[question2.uuid] = el;
                          }
                        }}
                        type="number"
                        value={answers[question2.uuid] || ''}
                        onChange={(e) => handleAnswerChange(question2.uuid, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(question2.uuid, e)}
                        className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-20 py-1.5 text-xl text-center font-mono bg-transparent focus:outline-none dark:text-white placeholder-indigo-300 dark:placeholder-indigo-600 ${
                          isPendingSubmission ? 'cursor-not-allowed text-gray-500 dark:text-gray-400' : ''
                        }`}
                        placeholder="?"
                        disabled={!testStarted || isPendingSubmission}
                      />
                    </div>
                  </div>
                </td>
              </>
            ) : (
              <>
                <td className="w-16 px-4 py-3 bg-indigo-50/50 dark:bg-indigo-900/20 border-b-[3px] border-b-blue-600 border-r-[3px] border-r-blue-600"></td>
                <td className="px-4 py-3 border-b-[3px] border-b-blue-600"></td>
              </>
            )}
          </tr>
        );
      });
    } else {
      {
        return (
          <>
            {Array.from({ length: Math.max(...questions.map(q => parseQuestionText(q.text).length)) }).map((_, rowIndex) => {
              const bottomUpIndex = Math.max(...questions.map(q => parseQuestionText(q.text).length)) - rowIndex - 1;
              return (
                <tr key={rowIndex}>
                  <td className="w-12 px-1 py-2 text-center text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap bg-indigo-50/50 dark:bg-indigo-900/10 border-t border-t-indigo-100 dark:border-t-indigo-800 border-r-[3px] border-r-indigo-900 dark:border-r-indigo-900 sticky left-0">
                    {rowIndex + 1}
                  </td>
                  {questions.map((question) => {
                    const numbers = parseQuestionText(question.text);
                    return (
                      <td
                        key={question.uuid}
                        className="w-12 px-1 py-2 text-sm text-gray-900 dark:text-white whitespace-nowrap border-t border-t-indigo-100 dark:border-t-indigo-800 border-r-[3px] border-r-indigo-900 dark:border-r-indigo-900"
                      >
                        <div className="w-full flex justify-end pr-1 font-mono">
                          {numbers[bottomUpIndex] !== undefined ? formatNumber(numbers[bottomUpIndex]) : ''}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            <tr>
              <td className="w-12 px-1 py-3 text-center text-sm font-bold text-indigo-700 dark:text-indigo-300 whitespace-nowrap bg-indigo-50/50 dark:bg-indigo-900/10 border-t-2 border-t-indigo-200 dark:border-t-indigo-800 border-r-[3px] border-r-indigo-900 dark:border-r-indigo-900 sticky left-0">
                Answer
              </td>
              {questions.map((question) => (
                <td
                  key={question.uuid}
                  className="w-12 px-1 py-3 text-center border-t-2 border-t-indigo-200 dark:border-t-indigo-800 border-r-[3px] border-r-indigo-900 dark:border-r-indigo-900"
                >
                  <div className={`inline-block rounded-lg border transition-colors duration-200 ${
                    submittingQuestionId === question.uuid 
                      ? 'border-yellow-300 dark:border-yellow-700' 
                      : isPendingSubmission
                      ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800'
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
                      className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-20 px-1 py-1 text-sm text-center font-mono bg-transparent focus:outline-none dark:text-white placeholder-indigo-300 dark:placeholder-indigo-600 ${
                        isPendingSubmission ? 'cursor-not-allowed text-gray-500 dark:text-gray-400' : ''
                      }`}
                      placeholder="?"
                      disabled={!testStarted || isPendingSubmission}
                    />
                  </div>
                </td>
              ))}
            </tr>
          </>
        );
      }
    }
  };

  return (
    <>
      {showTimeUpModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-indigo-200 dark:border-indigo-900 p-8 max-w-sm w-full mx-4 animate-bounce">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-4">
                <Clock className="w-12 h-12 text-white animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Time's Up! 🎯
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Great job on your math adventure! Let's see how you did! ⭐
              </p>
            </div>
          </div>
        </div>
      )}
      
      {renderOfflineIndicator()}
      
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
                    className="px-8 py-3 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 shadow-md"
                  >
                    Begin Test
                  </button>
                </div>
              ) : (
                <Tab.Group selectedIndex={currentSection} onChange={(index) => {
                  setCurrentSection(index);
                  // Save the current section and pages to localStorage
                  if (studentTestUuid && id) {
                    const savedTestState = localStorage.getItem(`test_state_${id}`);
                    if (savedTestState) {
                      const state = JSON.parse(savedTestState);
                      localStorage.setItem(`test_state_${id}`, JSON.stringify({
                        ...state,
                        current_section: index,
                        section_pages: sectionPages
                      }));
                    }
                  }
                }}>
                  <Tab.List className={`${isMobile ? 'grid grid-cols-2 gap-2' : 'flex justify-start space-x-2'} rounded-xl bg-indigo-100/20 dark:bg-indigo-900/20 p-1 mb-6`}>
                    {test.sections.map((section, index) => (
                      <Tab
                        key={section.uuid}
                        className={({ selected }) =>
                          `px-4 rounded-lg py-2.5 text-sm font-medium leading-5 ${isMobile ? 'w-full' : 'min-w-[200px]'}
                          ${selected
                            ? 'bg-white dark:bg-gray-800 shadow text-indigo-600 dark:text-indigo-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-indigo-600 dark:hover:text-indigo-400'
                          } transition-all duration-200`
                        }
                      >
                        {section.section_type === "MUL_DIV" ? "Multiplication & Division" : "Addition"} {index + 1}
                      </Tab>
                    ))}
                  </Tab.List>
                  <Tab.Panels className={isMobile ? 'max-w-[300px] mx-auto' : ''}>
                    {test.sections.map((section, sectionIndex) => {
                      const { currentQuestions, pagination } = renderPagination(section.questions, section.uuid);
                      const isMulDiv = section.section_type === "MUL_DIV";
                      
                      return (
                        <Tab.Panel key={section.uuid}>
                          <div className={`overflow-x-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg`}>
                            <table className="w-full border-collapse border-[3px] border-blue-600 dark:border-blue-600">
                              <thead>
                                <tr>
                                  {isMulDiv ? (
                                    isMobile ? (
                                      <>
                                        <th className="w-8 px-1 py-2 text-left text-xs font-semibold text-blue-600 dark:text-blue-400 bg-indigo-50/50 dark:bg-indigo-900/20 border-b border-b-blue-300">
                                          No.
                                        </th>
                                        <th className="px-2 py-2 text-left text-xs font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 border-b border-b-blue-300">
                                          Question
                                        </th>
                                      </>
                                    ) : (
                                      <>
                                        <th className="w-16 px-4 py-3 text-left text-sm font-semibold text-blue-600 dark:text-blue-400 bg-indigo-50/50 dark:bg-indigo-900/20 border-b-[3px] border-b-blue-600 border-r-[3px] border-r-blue-600">
                                          No.
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 border-b-[3px] border-b-blue-600 border-r-[3px] border-r-blue-600">
                                          Question
                                        </th>
                                        <th className="w-16 px-4 py-3 text-left text-sm font-semibold text-blue-600 dark:text-blue-400 bg-indigo-50/50 dark:bg-indigo-900/20 border-b-[3px] border-b-blue-600 border-r-[3px] border-r-blue-600">
                                          No.
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 border-b-[3px] border-b-blue-600">
                                          Question
                                        </th>
                                      </>
                                    )
                                  ) : (
                                    <>
                                      <th className="w-16 sm:w-20 md:w-24 px-2 sm:px-3 py-3 text-center text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 bg-indigo-50/50 dark:bg-indigo-900/20 border-r-[3px] border-r-blue-600">
                                       No.
                                      </th>
                                      {currentQuestions.map((question) => (
                                        <th
                                          key={question.uuid}
                                          className="w-16 sm:w-20 md:w-24 px-2 sm:px-3 py-3 text-center text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 bg-indigo-50/50 dark:bg-indigo-900/20 border-r-[3px] border-r-blue-600"
                                        >
                                          Q{question.order}
                                        </th>
                                      ))}
                                    </>
                                  )}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-indigo-100/50 dark:divide-indigo-800/50">
                                {isMobile ? renderMobileView(currentQuestions, isMulDiv) : renderDesktopView(currentQuestions, isMulDiv)}
                              </tbody>
                            </table>
                          </div>
                          <div className="mt-6">
                            {pagination}
                          </div>
                        </Tab.Panel>
                      );
                    })}
                  </Tab.Panels>
                </Tab.Group>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentTestDetails; 