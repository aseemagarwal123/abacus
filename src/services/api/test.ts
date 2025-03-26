import apiClient from './client';
import { Test } from '../../types';

export const testApi = {
  getAvailableTests: async (): Promise<Test[]> => {
    const response = await apiClient.get<Test[]>('/tests/available-test/');
    return response.data;
  },

  getTestById: async (testId: string): Promise<Test> => {
    const response = await apiClient.get<Test>(`/tests/${testId}/`);
    return response.data;
  },

  submitTest: async (testId: string, answers: Record<string, string>): Promise<void> => {
    await apiClient.post(`/tests/${testId}/submit/`, { answers });
  }
}; 