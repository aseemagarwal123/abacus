import apiClient from './client';

interface LoginCredentials {
  phone_number: string;
  password: string;
}

interface User {
  uuid: string;
  phone_number: string;
  email: string;
  is_active: boolean;
}

interface CentreUserData {
  uuid: string;
  user: User;
  centre_name: string;
  area: string;
  is_active: boolean;
  cis: any[];
  student_count: number;
  active_students_count: number;
  created_at: string;
}

interface AdminUserData {
  uuid: string;
  email: string;
  phone_number: string;
  total_centers: number;
  active_users: number;
}

interface LoginResponse {
  token: string;
  user_type: 'ADMIN' | 'CENTRE' | 'STUDENT';
  user_data: AdminUserData | CentreUserData;
}

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await apiClient.post<LoginResponse>('/auth/login/', credentials);
    return response.data;
  },

  logout: async () => {
    // Add logout endpoint if available
    return null;
  }
}; 