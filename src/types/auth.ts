export interface User {
  id: string;
  email: string;
  role: 'admin' | 'centre' | 'student';
  name: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface Centre {
  id: string;
  name: string;
  email: string;
  location: string;
  studentsCount: number;
  status: 'active' | 'inactive';
  joinedDate: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  level: number;
  centreId: string;
  centreName: string;
  progress: number;
  joinedDate: string;
  lastActive: string;
  completedTests: number;
  currentLevel: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  userType: string;
  userName: string;
  timestamp: string;
  details: string;
  type: 'test' | 'level';
  centreId: string;
  centreName: string;
  metadata: {
    testName?: string;
    level?: number;
    score?: number;
    previousLevel?: number;
    newLevel?: number;
    achievement?: string;
  };
}

export interface Test {
  id: string;
  name: string;
  level: number;
  duration: number;
  totalQuestions: number;
  status: 'available' | 'completed' | 'in_progress';
  score?: number;
  completedAt?: string;
}