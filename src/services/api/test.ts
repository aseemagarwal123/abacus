import { getApiUrl } from '../../config/api';
import { Test, TestsResponse } from '../../types';

export const testApi = {
  getAvailableTests: async (): Promise<Test[]> => {
    const response = await fetch(getApiUrl('tests/available-test/'), {
      headers: {
        'Authorization': `Token ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch available tests');
    return response.json();
  },

  getStudentTests: async (): Promise<TestsResponse> => {
    const response = await fetch(getApiUrl('tests/student-test/'), {
      headers: {
        'Authorization': `Token ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch student tests');
    return response.json();
  },

  getTestById: async (testId: string): Promise<Test> => {
    const response = await fetch(getApiUrl(`tests/${testId}/`), {
      headers: {
        'Authorization': `Token ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch test details');
    return response.json();
  },

  submitTest: async (testId: string, answers: Record<string, string>): Promise<void> => {
    const response = await fetch(getApiUrl(`tests/${testId}/submit/`), {
      method: 'POST',
      headers: {
        'Authorization': `Token ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ answers })
    });
    if (!response.ok) throw new Error('Failed to submit test');
  }
}; 