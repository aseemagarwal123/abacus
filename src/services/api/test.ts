import { Test, TestsResponse } from '../../types';

const API_URL = 'https://abacusync.onrender.com/api';

export const testApi = {
  getAvailableTests: async (): Promise<Test[]> => {
    const response = await fetch(`${API_URL}/tests/available-test/`, {
      headers: {
        'Authorization': `Token ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch available tests');
    }
    return response.json();
  },

  getStudentTests: async (): Promise<TestsResponse> => {
    const response = await fetch(`${API_URL}/tests/student-test/`, {
      headers: {
        'Authorization': `Token ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch student tests');
    }
    return response.json();
  },

  getTestDetails: async (testId: string): Promise<Test> => {
    const response = await fetch(`${API_URL}/tests/available-test/${testId}/`, {
      headers: {
        'Authorization': `Token ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch test details');
    }
    return response.json();
  },

  startStudentTest: async (testId: string): Promise<{ student_test_uuid: string }> => {
    const response = await fetch(`${API_URL}/tests/student-test/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ test_uuid: testId })
    });
    if (!response.ok) {
      throw new Error('Failed to start student test');
    }
    return response.json();
  },

  beginStudentTest: async (studentTestId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/tests/student-test/${studentTestId}/start/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to begin student test');
    }
  },

  getTestById: async (testId: string): Promise<Test> => {
    const response = await fetch(`${API_URL}/tests/${testId}/`, {
      headers: {
        'Authorization': `Token ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch test');
    }
    return response.json();
  },

  submitTest: async (testId: string, answers: Record<string, string>): Promise<void> => {
    const response = await fetch(`${API_URL}/tests/${testId}/submit/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ answers })
    });
    if (!response.ok) {
      throw new Error('Failed to submit test');
    }
  },

  uploadTest: async (formData: FormData): Promise<void> => {
    const response = await fetch(`${API_URL}/tests/upload-excel/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${localStorage.getItem('token')}`
      },
      body: formData
    });
    if (!response.ok) {
      throw new Error('Failed to upload test');
    }
  }
}; 