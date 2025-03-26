import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setTests } from '../store/slices/testSlice';
import { testApi } from '../services/api/test';

export const useTests = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        console.log('fetching tests');
        setIsLoading(true);
        const data = await testApi.getAvailableTests();
        dispatch(setTests(data));
      } catch (error) {
        console.error('Error fetching tests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTests();
  }, [dispatch]);

  return { isLoading };
}; 