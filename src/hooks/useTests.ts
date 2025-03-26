import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { testApi } from '../services/api/test';
import { Test, TestsResponse, AdminTestsResponse } from '../types';

export const useTests = () => {
  const [tests, setTests] = useState<TestsResponse | AdminTestsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userType = useSelector((state: RootState) => state.auth.user?.user_type);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (userType === 'ADMIN') {
          const data = await testApi.getAvailableTests();
          setTests(data);
        } else if (userType === 'STUDENT') {
          const data = await testApi.getStudentTests();
          setTests(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tests');
      } finally {
        setIsLoading(false);
      }
    };

    if (userType) {
      fetchTests();
    }
  }, [userType]);

  return { tests, isLoading, error };
}; 