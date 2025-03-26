import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../services/api/auth';

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

interface StudentUserData {
  uuid: string;
  user: User;
  name: string;
  dob: string;
  gender: string;
  current_level: string;
  level_start_date: string;
  level_completion_date: string | null;
  level_name: string;
  tests_taken: number;
}

interface LoginResponse {
  token: string;
  user_type: 'ADMIN' | 'CENTRE' | 'STUDENT';
  user_data: AdminUserData | CentreUserData | StudentUserData;
}

interface AuthState {
  user: {
    uuid: string;
    email: string;
    phone_number: string;
    user_type: 'ADMIN' | 'CENTRE' | 'STUDENT';
    user_data: AdminUserData | CentreUserData | StudentUserData;
  } | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  user_type: string | null;
  userData: StudentUserData | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
  isInitialized: false,
  user_type: null,
  userData: null,
  isAuthenticated: Boolean(localStorage.getItem('token'))
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { phone_number: string; password: string }) => {
    const response = await authApi.login(credentials) as LoginResponse;
    
    // Store the complete response in localStorage for dashboard
    localStorage.setItem('userData', JSON.stringify(response));
    
    // Store modified data for auth state
    let email: string;
    let phone_number: string;
    
    if (response.user_type === 'ADMIN') {
      const adminData = response.user_data as AdminUserData;
      email = adminData.email;
      phone_number = adminData.phone_number;
    } else if (response.user_type === 'CENTRE') {
      const centreData = response.user_data as CentreUserData;
      email = centreData.user.email;
      phone_number = centreData.user.phone_number;
    } else {
      const studentData = response.user_data as StudentUserData;
      email = studentData.user.email;
      phone_number = studentData.user.phone_number;
    }
    
    const userData = {
      uuid: response.user_data.uuid,
      email,
      phone_number,
      user_type: response.user_type,
      user_data: response.user_data
    };
    
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    return {
      token: response.token,
      user: userData
    };
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.userData = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userData');
    },
    initializeAuth: (state) => {
      state.isInitialized = true;
      // Initialize userData from localStorage if available
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        try {
          const parsedData = JSON.parse(storedUserData);
          if (parsedData.user_type === 'STUDENT') {
            state.userData = parsedData.user_data;
          }
        } catch (error) {
          console.error('Error parsing userData:', error);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        if (action.payload.user.user_type === 'STUDENT') {
          state.userData = action.payload.user.user_data as StudentUserData;
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      });
  },
});

export const { logout, initializeAuth } = authSlice.actions;
export default authSlice.reducer;