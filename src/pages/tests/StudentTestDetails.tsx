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
  const [pendingSubmissions, setPendingSubmissions] = useState<Array<{
    questionUuid: string;
    answer: string;
    timestamp: number;
  }>>([]);
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());
  const [isTimeExpired, setIsTimeExpired] = useState(false);
  const [pendingTestSubmission, setPendingTestSubmission] = useState(false);
  const [isPendingSubmission, setIsPendingSubmission] = useState(false);

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

  const handleTimeUp = useCallback(async () => {
    setShowTimeUpModal(true);
    await new Promise(resolve => setTimeout(resolve, 4000));
    setShowTimeUpModal(false);
    
    if (!isOnline) {
      // Store time expiration state
      setIsTimeExpired(true);
      setIsPendingSubmission(true); // Also set pending submission to lock the UI
      localStorage.setItem(`test_time_expired_${studentTestUuid}`, 'true');
      toast('Time is up! Your test will be submitted when you are back online.', {
        duration: 4000,
        icon: <WifiOff className="w-5 h-5 text-yellow-500" />,
      });
    } else {
      // Submit test immediately if online
      if (studentTestUuid) {
        await testApi.submitStudentTest(studentTestUuid);
        // Clean up ALL localStorage items
        if (id) {
          localStorage.removeItem(`test_state_${id}`);
        }
        localStorage.removeItem(`test_time_${studentTestUuid}`);
        localStorage.removeItem(`test_time_expired_${studentTestUuid}`);
        localStorage.removeItem(`test_submission_pending_${studentTestUuid}`);
        localStorage.removeItem(`pending_submissions_${studentTestUuid}`);
        navigate('/student-dashboard');
      }
    }
  }, [studentTestUuid, id, navigate, isOnline]);

  const initializeTest = async () => {
    if (initializedRef.current || !id) return;
    
    try {
      setLoading(true);
      initializedRef.current = true;
      
      console.log('Initializing test with ID:', id);

      // First fetch test details
      const testData = await testApi.getTestDetails(id);
      console.log('Test details received:', testData);
      
      const testDetails = testData.test || testData;
      setTest(testDetails);
      setRemainingTime(testDetails.duration_minutes * 60);

      const savedTestState = localStorage.getItem(`test_state_${id}`);
      
      if (savedTestState) {
        const { student_test_uuid, remaining_time } = JSON.parse(savedTestState);
        console.log('Found saved test state:', { student_test_uuid, remaining_time });
        
        // Check if test was submitted offline or expired offline
        const wasSubmittedOffline = localStorage.getItem(`test_submission_pending_${student_test_uuid}`) === 'true';
        const wasExpiredOffline = localStorage.getItem(`test_time_expired_${student_test_uuid}`) === 'true';
        
        // Get pending submissions using the student_test_uuid from saved state
        const pendingSubmissions = getPendingSubmissions(student_test_uuid);
        console.log('Test status:', { 
          wasSubmittedOffline, 
          wasExpiredOffline,
          pendingSubmissionsCount: pendingSubmissions.length,
          pendingSubmissions,
          student_test_uuid 
        });

        try {
          const durationData = await testApi.getRemainingDuration(student_test_uuid);
          console.log('Fetched remaining duration:', durationData);
          
          setStudentTestUuid(student_test_uuid);
          
          if (durationData.status === 'IN_PROGRESS') {
            // If test was submitted offline or expired offline and we're now online, submit immediately
            if ((wasSubmittedOffline || wasExpiredOffline) && navigator.onLine) {
              console.log('Test was submitted/expired offline and now online, submitting...', {
                pendingSubmissions,
                student_test_uuid
              });
              setTestStarted(true);
              setRemainingTime(0);
              setIsTimeExpired(wasExpiredOffline);
              setIsPendingSubmission(true);
              
              // Show appropriate modal
              if (wasExpiredOffline) {
                setShowTimeUpModal(true);
              }
              
              setTimeout(async () => {
                if (wasExpiredOffline) {
                  setShowTimeUpModal(false);
                }
                
                // Show loading toast for sync process
                const syncToastId = toast.loading('Syncing your offline answers...', {
                  icon: '🔄',
                });

                try {
                  // First sync any pending answers
                  console.log('Found pending submissions to sync:', pendingSubmissions);

                  if (pendingSubmissions.length > 0) {
                    for (const submission of pendingSubmissions) {
                      console.log('Syncing answer:', submission);
                      await testApi.submitAnswer(
                        student_test_uuid,
                        submission.questionUuid,
                        submission.answer
                      );
                      console.log('Successfully synced answer:', submission.questionUuid);
                    }
                    localStorage.removeItem(`pending_submissions_${student_test_uuid}`);
                    console.log('Cleared pending submissions from localStorage');
                    
                    // Update sync toast to success
                    toast.success('All offline answers have been synced!', {
                      id: syncToastId,
                      duration: 2000,
                      icon: <Wifi className="w-5 h-5 text-green-500" />,
                    });
                  } else {
                    // If no pending submissions, dismiss the sync toast
                    toast.dismiss(syncToastId);
                  }

                  // Show loading toast for test submission
                  const submitToastId = toast.loading(
                    wasExpiredOffline ? 'Submitting your expired test...' : 'Submitting your test...',
                    { icon: '📝' }
                  );
                  
                  // Then submit the test
                  await testApi.submitStudentTest(student_test_uuid);
                  
                  // Clean up localStorage
                  localStorage.removeItem(`test_state_${id}`);
                  localStorage.removeItem(`test_time_${student_test_uuid}`);
                  localStorage.removeItem(`test_time_expired_${student_test_uuid}`);
                  localStorage.removeItem(`test_submission_pending_${student_test_uuid}`);
                  localStorage.removeItem(`pending_submissions_${student_test_uuid}`);
                  
                  // Update submit toast to success
                  toast.success('Your test has been submitted successfully!', {
                    id: submitToastId,
                    duration: 3000,
                    icon: '✅',
                  });
                  navigate('/student-dashboard');
                } catch (error) {
                  console.error('Error during sync/submit:', error);
                  toast.error('Failed to sync and submit test. Please try again.', {
                    duration: 4000,
                  });
                }
              }, wasExpiredOffline ? 2000 : 0); // Add delay only for expired tests
              return;
            }

            // If time is up but test is still in progress, show modal and submit
            if (durationData.remaining_duration <= 0) {
              setTestStarted(true);
              setRemainingTime(0);
              // Add a small delay to ensure test data is set before showing modal
              setTimeout(() => {
                handleTimeUp();
              }, 300);
              return;
            }

            // Normal test continuation
            setTestStarted(true);
            setRemainingTime(durationData.remaining_duration);
            localStorage.setItem(`test_state_${id}`, JSON.stringify({
              student_test_uuid,
              remaining_time: durationData.remaining_duration
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
            localStorage.removeItem(`test_state_${id}`);
            localStorage.removeItem(`test_time_${student_test_uuid}`);
            localStorage.removeItem(`test_time_expired_${student_test_uuid}`);
            localStorage.removeItem(`test_submission_pending_${student_test_uuid}`);
            localStorage.removeItem(`pending_submissions_${student_test_uuid}`);
            navigate('/student-dashboard');
            return;
          }
        } catch (error) {
          console.error('Error fetching remaining duration:', error);
          localStorage.removeItem(`test_state_${id}`);
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
  const getPendingSubmissions = useCallback((testUuid?: string) => {
    const uuid = testUuid || studentTestUuid;
    if (!uuid) return [];
    try {
      const saved = localStorage.getItem(`pending_submissions_${uuid}`);
      console.log('Retrieved pending submissions from localStorage for UUID:', uuid, 'Data:', saved);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error getting pending submissions:', error);
      return [];
    }
  }, [studentTestUuid]);

  // Function to save pending submission to localStorage
  const savePendingSubmission = useCallback((submission: { questionUuid: string; answer: string; timestamp: number }) => {
    if (!studentTestUuid) return;
    const currentSubmissions = getPendingSubmissions();
    const updatedSubmissions = [...currentSubmissions, submission];
    localStorage.setItem(`pending_submissions_${studentTestUuid}`, JSON.stringify(updatedSubmissions));
  }, [studentTestUuid, getPendingSubmissions]);

  // Function to clear pending submissions from localStorage
  const clearPendingSubmissions = useCallback(() => {
    if (!studentTestUuid) return;
    localStorage.removeItem(`pending_submissions_${studentTestUuid}`);
  }, [studentTestUuid]);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = async () => {
      console.log('Online event detected');
      setIsOnline(true);
      setIsOfflineMode(false);
      
      // Wait for state to be updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      toast.success('You are back online!', {
        duration: 2000,
        icon: <Wifi className="w-5 h-5 text-green-500" />,
      });
      
      // Force update isOnline in the closure
      const forceSync = async () => {
        console.log('Force syncing with online status:', true);
        try {
          // First check for pending submissions
          const pendingSubmissions = getPendingSubmissions();
          console.log('Retrieved pending submissions:', pendingSubmissions);

          if (pendingSubmissions.length > 0) {
            // Show loading toast for sync process
            const syncToastId = toast.loading('Syncing your offline answers...', {
              icon: '🔄',
            });

            try {
              // First sync all pending answers
              for (const submission of pendingSubmissions) {
                console.log('Attempting to submit answer:', submission);
                await testApi.submitAnswer(
                  studentTestUuid!,
                  submission.questionUuid,
                  submission.answer
                );
                console.log('Successfully submitted answer:', submission.questionUuid);
              }
              
              clearPendingSubmissions();
              setLastSyncTime(Date.now());
              
              // Update sync toast to success
              toast.success('All offline answers have been synced!', {
                id: syncToastId,
                duration: 3000,
                icon: <Wifi className="w-5 h-5 text-green-500" />,
              });
            } catch (error) {
              console.error('Error syncing answers:', error);
              // Update sync toast to error if sync fails
              toast.error('Failed to sync some answers. Please try again.', {
                id: syncToastId,
                duration: 4000,
              });
              throw error; // Propagate error to outer catch block
            }
          }

          // Check for either time expiration or manual submission
          const isTimeExpired = localStorage.getItem(`test_time_expired_${studentTestUuid}`);
          const hasTestSubmissionPending = localStorage.getItem(`test_submission_pending_${studentTestUuid}`);
          
          console.log('Checking submission conditions:', {
            isTimeExpired: isTimeExpired === 'true',
            hasTestSubmissionPending: hasTestSubmissionPending === 'true'
          });
          
          // Submit if either time expired or manual submission pending
          if (isTimeExpired === 'true' || hasTestSubmissionPending === 'true') {
            // Show loading toast for test submission
            const submitToastId = toast.loading(
              isTimeExpired === 'true' 
                ? 'Submitting your expired test...'
                : 'Submitting your test...',
              { icon: '📝' }
            );

            try {
              console.log('Submitting test due to:', isTimeExpired === 'true' ? 'time expiration' : 'manual submission');
              await testApi.submitStudentTest(studentTestUuid!);
              
              // Clean up ALL localStorage items
              if (id) {
                localStorage.removeItem(`test_state_${id}`);
              }
              localStorage.removeItem(`test_time_${studentTestUuid}`);
              localStorage.removeItem(`test_time_expired_${studentTestUuid}`);
              localStorage.removeItem(`test_submission_pending_${studentTestUuid}`);
              localStorage.removeItem(`pending_submissions_${studentTestUuid}`);
              console.log('Test submitted and localStorage cleaned up');
              
              // Update submit toast to success
              toast.success('Your test has been submitted successfully!', {
                id: submitToastId,
                duration: 3000,
                icon: '✅',
              });
              navigate('/student-dashboard');
            } catch (error) {
              console.error('Error submitting test:', error);
              // Update submit toast to error if submission fails
              toast.error('Failed to submit test. Please try again.', {
                id: submitToastId,
                duration: 4000,
              });
              throw error;
            }
          }
        } catch (error) {
          console.error('Error during forced sync:', error);
        }
      };

      // Add a small delay and then force sync
      setTimeout(forceSync, 500);
    };

    const handleOffline = () => {
      console.log('Offline event detected');
      setIsOnline(false);
      setIsOfflineMode(true);
      toast.error('You are offline. Your answers will be saved locally.', {
        duration: 4000,
        icon: <WifiOff className="w-5 h-5 text-red-500" />,
      });
    };

    // Initial check for online status
    console.log('Initial online status:', navigator.onLine);
    setIsOnline(navigator.onLine);
    setIsOfflineMode(!navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [studentTestUuid, getPendingSubmissions, clearPendingSubmissions]);

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

  // Add the handleKeyDown function
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

  // Update the answer submission logic to handle offline mode
  const debouncedSubmitAnswer = useCallback(
    debounce(async (studentTestUuid: string, questionUuid: string, answerText: string) => {
      try {
        setSubmittingQuestionId(questionUuid);
        console.log('Submitting answer:', { studentTestUuid, questionUuid, answerText, isOnline });
        
        if (!isOnline) {
          // Store answer in localStorage if offline
          savePendingSubmission({
            questionUuid,
            answer: answerText,
            timestamp: Date.now(),
          });
          console.log('Answer saved to localStorage for offline sync');
          toast('Answer saved locally. Will sync when online.', {
            duration: 2000,
            icon: <WifiOff className="w-5 h-5 text-yellow-500" />,
          });
        } else {
          // Submit answer online
          await testApi.submitAnswer(studentTestUuid, questionUuid, answerText);
          console.log('Answer submitted successfully online');
        }

        // Find next question info and handle page change
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
      } catch (error) {
        console.error('Error submitting answer:', error);
        toast.error('Failed to save answer. Please try again.', {
          duration: 3000,
        });
      } finally {
        setSubmittingQuestionId(null);
      }
    }, 1000),
    [findNextQuestionInfo, currentPage, isOnline, savePendingSubmission]
  );

  // Update the handleSubmit function to handle offline submission
  const handleSubmit = async () => {
    try {
      if (studentTestUuid && testStarted) {
        if (!isOnline) {
          // Get only the offline answers from pending submissions
          const pendingSubmissions = getPendingSubmissions();
          console.log('Saving offline answers as pending submissions:', pendingSubmissions);
          
          // Store submission intent locally
          localStorage.setItem(`test_submission_pending_${studentTestUuid}`, 'true');
          setIsPendingSubmission(true); // Set this first to disable inputs
          toast('Your test will be submitted automatically when you are back online.', {
            duration: 4000,
            icon: <WifiOff className="w-5 h-5 text-yellow-500" />,
          });
        } else {
          // Show loading toast for online submission
          const submitToastId = toast.loading('Submitting your test...', {
            icon: '📝',
          });

          try {
            setIsPendingSubmission(true); // Set this first to disable inputs
            await testApi.submitStudentTest(studentTestUuid);
            
            // Clean up ALL localStorage items
            if (id) {
              localStorage.removeItem(`test_state_${id}`);
            }
            localStorage.removeItem(`test_time_${studentTestUuid}`);
            localStorage.removeItem(`test_submission_pending_${studentTestUuid}`);
            localStorage.removeItem(`pending_submissions_${studentTestUuid}`);
            localStorage.removeItem(`test_time_expired_${studentTestUuid}`);
            
            // Update toast to success
            toast.success('Your test has been submitted successfully! 🎉', {
              id: submitToastId,
              duration: 3000,
              icon: '✅',
            });
            
            // Add a small delay before navigation to show the success message
            setTimeout(() => {
              navigate('/student-dashboard');
            }, 1000);
          } catch (error) {
            console.error('Error submitting test:', error);
            setIsPendingSubmission(false); // Reset on error
            // Update toast to error
            toast.error('Failed to submit test. Please try again.', {
              id: submitToastId,
              duration: 4000,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setIsPendingSubmission(false); // Reset on error
      toast.error('Something went wrong. Please try again.', {
        duration: 3000,
      });
    }
  };

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
              disabled={currentPage === 1 || isPendingSubmission}
              className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || isPendingSubmission}
              className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          {sectionIndex === test.sections.length - 1 && (
            <button
              onClick={handleSubmit}
              disabled={isPendingSubmission}
              className={`px-6 py-2 font-medium rounded-full transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 shadow-lg ${
                isPendingSubmission
                  ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 focus:ring-indigo-500'
              }`}
            >
              {isPendingSubmission ? 'Test Pending Submission...' : 'Submit Test'}
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
                className={`w-14 sm:w-16 py-1.5 text-lg sm:text-xl text-center font-mono bg-transparent focus:outline-none dark:text-white placeholder-indigo-300 dark:placeholder-indigo-600 ${
                  isPendingSubmission ? 'cursor-not-allowed text-gray-500 dark:text-gray-400' : ''
                }`}
                placeholder="?"
                disabled={!testStarted || isPendingSubmission}
              />
            </div>
          </td>
        </tr>
      );
    });
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
                                      disabled={!testStarted || isPendingSubmission}
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
    </>
  );
};

export default StudentTestDetails; 