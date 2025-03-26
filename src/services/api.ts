import axios from 'axios';
import { StoredAnswer } from '../utils/storage';
import { waitForConnection } from '../utils/connectivity';
import { API_URL } from '../config/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export const submitAnswer = async (answer: StoredAnswer): Promise<boolean> => {
  try {
    await waitForConnection();
    await api.post('/answers', answer);
    return true;
  } catch (error) {
    console.error('Error submitting answer:', error);
    return false;
  }
};

export const syncPendingAnswers = async (answers: StoredAnswer[]): Promise<boolean> => {
  try {
    await waitForConnection();
    await api.post('/answers/bulk', answers);
    return true;
  } catch (error) {
    console.error('Error syncing pending answers:', error);
    return false;
  }
};

export const toggleCentreActive = async (centreId: string): Promise<boolean> => {
  try {
    await api.post(`/centres/${centreId}/toggle_active/`);
    return true;
  } catch (error) {
    console.error('Error toggling centre status:', error);
    throw error;
  }
};

export const deleteCentre = async (centreId: string): Promise<boolean> => {
  try {
    await api.delete(`/centres/${centreId}/`);
    return true;
  } catch (error) {
    console.error('Error deleting centre:', error);
    throw error;
  }
};