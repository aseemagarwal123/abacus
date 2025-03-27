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
    console.log('Calling startStudentTest with testId:', testId);
    try {
      const response = await fetch(`${API_URL}/tests/student-test/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ test_uuid: testId })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('startStudentTest error response:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        throw new Error(`Failed to start student test: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('startStudentTest response:', data);
      
      if (!data.uuid) {
        console.error('startStudentTest response missing uuid:', data);
        throw new Error('Response missing uuid');
      }
      
      // Return the uuid as student_test_uuid to maintain compatibility
      return { student_test_uuid: data.uuid };
    } catch (error) {
      console.error('startStudentTest error:', error);
      throw error;
    }
  },

  startTest: async (studentTestUuid: string): Promise<void> => {
    const response = await fetch(`${API_URL}/tests/student-test/${studentTestUuid}/start/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to start test');
    }
  },

  beginStudentTest: async (studentTestId: string): Promise<void> => {
    console.log('Calling beginStudentTest with studentTestId:', studentTestId);
    const response = await fetch(`${API_URL}/tests/student-test/${studentTestId}/start/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to begin student test');
    }
    console.log('beginStudentTest response:', response.status);
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

  submitStudentTest: async (studentTestUuid: string, answers: Record<string, string>): Promise<void> => {
    const response = await fetch(`${API_URL}/tests/student-test/${studentTestUuid}/submit/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ answers })
    });
    if (!response.ok) {
      throw new Error('Failed to submit student test');
    }
  },

  submitAnswer: async (studentTestUuid: string, questionUuid: string, answerText: string): Promise<void> => {
    const response = await fetch(`${API_URL}/tests/student-test/${studentTestUuid}/submit_answer/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        question: questionUuid,
        answer_text: answerText
      })
    });
    if (!response.ok) {
      throw new Error('Failed to submit answer');
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
  },

  getRemainingDuration: async (studentTestUuid: string): Promise<{ remaining_duration: number; status: string }> => {
    const response = await fetch(`${API_URL}/tests/student-test/${studentTestUuid}/remaining_duration/`, {
      headers: {
        'Authorization': `Token ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to get remaining duration');
    }
    return response.json();
  },

  getAnswers: async (studentTestUuid: string): Promise<{
    student_test_uuid: string;
    test_title: string;
    status: string;
    answers: Array<{
      question_uuid: string;
      question_text: string;
      question_order: number;
      answer_text: string;
      is_correct: boolean | null;
      marks_obtained: number | null;
      submitted_at: string;
    }>;
  }> => {
    const response = await fetch(`${API_URL}/tests/student-test/${studentTestUuid}/answers/`, {
      headers: {
        'Authorization': `Token ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch answers');
    }
    return response.json();
  }
}; 