import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Centre, Student, ActivityLog, Test } from '../../types/auth';

interface DataState {
  centres: Centre[];
  students: Student[];
  activityLogs: ActivityLog[];
  tests: Test[];
}

const initialState: DataState = {
  centres: [
    {
      id: '1',
      name: 'Excellence Centre',
      email: 'excellence@example.com',
      location: 'New York',
      studentsCount: 45,
      status: 'active',
      joinedDate: '2024-01-15'
    },
    {
      id: '2',
      name: 'Bright Minds Academy',
      email: 'bright@example.com',
      location: 'London',
      studentsCount: 32,
      status: 'active',
      joinedDate: '2024-02-01'
    },
    {
      id: '3',
      name: 'Math Masters',
      email: 'math@example.com',
      location: 'Toronto',
      studentsCount: 28,
      status: 'active',
      joinedDate: '2024-02-15'
    }
  ],
  students: [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      level: 3,
      centreId: '1',
      centreName: 'Excellence Centre',
      progress: 75,
      joinedDate: '2024-01-20',
      lastActive: '2024-03-15',
      completedTests: 8,
      currentLevel: 3
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      level: 2,
      centreId: '1',
      centreName: 'Excellence Centre',
      progress: 60,
      joinedDate: '2024-02-01',
      lastActive: '2024-03-14',
      completedTests: 5,
      currentLevel: 2
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@example.com',
      level: 4,
      centreId: '2',
      centreName: 'Bright Minds Academy',
      progress: 90,
      joinedDate: '2024-01-15',
      lastActive: '2024-03-15',
      completedTests: 12,
      currentLevel: 4
    }
  ],
  activityLogs: [
    {
      id: '1',
      action: 'Test Completed',
      userType: 'Student',
      userName: 'John Doe',
      timestamp: '2024-03-15T10:30:00',
      details: 'Completed Level 3 Test with score 95%',
      type: 'test',
      centreId: '1',
      centreName: 'Excellence Centre',
      metadata: {
        testName: 'Advanced Operations',
        level: 3,
        score: 95
      }
    },
    {
      id: '2',
      action: 'Level Completed',
      userType: 'Student',
      userName: 'Jane Smith',
      timestamp: '2024-03-14T15:45:00',
      details: 'Completed Level 2 and advanced to Level 3',
      type: 'level',
      centreId: '1',
      centreName: 'Excellence Centre',
      metadata: {
        previousLevel: 2,
        newLevel: 3
      }
    },
    {
      id: '3',
      action: 'Test Started',
      userType: 'Student',
      userName: 'Mike Johnson',
      timestamp: '2024-03-13T09:15:00',
      details: 'Started Level 4 Assessment Test',
      type: 'test',
      centreId: '2',
      centreName: 'Bright Minds Academy',
      metadata: {
        testName: 'Level 4 Assessment',
        level: 4
      }
    },
    {
      id: '4',
      action: 'Level Completed',
      userType: 'Student',
      userName: 'Mike Johnson',
      timestamp: '2024-03-12T14:20:00',
      details: 'Completed Level 3 with distinction',
      type: 'level',
      centreId: '2',
      centreName: 'Bright Minds Academy',
      metadata: {
        previousLevel: 3,
        newLevel: 4,
        achievement: 'distinction'
      }
    },
    {
      id: '5',
      action: 'Test Completed',
      userType: 'Student',
      userName: 'John Doe',
      timestamp: '2024-03-11T11:30:00',
      details: 'Completed Speed Mathematics Test with score 88%',
      type: 'test',
      centreId: '1',
      centreName: 'Excellence Centre',
      metadata: {
        testName: 'Speed Mathematics',
        level: 3,
        score: 88
      }
    }
  ],
  tests: [
    {
      id: '1',
      name: 'Basic Operations',
      level: 1,
      duration: 10,
      totalQuestions: 20,
      status: 'completed',
      score: 95,
      completedAt: '2024-03-10T14:30:00'
    },
    {
      id: '2',
      name: 'Advanced Calculations',
      level: 2,
      duration: 15,
      totalQuestions: 25,
      status: 'available'
    },
    {
      id: '3',
      name: 'Speed Mathematics',
      level: 3,
      duration: 20,
      totalQuestions: 30,
      status: 'in_progress'
    }
  ]
};

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setCentres: (state, action: PayloadAction<Centre[]>) => {
      state.centres = action.payload;
    },
    setStudents: (state, action: PayloadAction<Student[]>) => {
      state.students = action.payload;
    },
    setActivityLogs: (state, action: PayloadAction<ActivityLog[]>) => {
      state.activityLogs = action.payload;
    },
    setTests: (state, action: PayloadAction<Test[]>) => {
      state.tests = action.payload;
    }
  }
});

export const { setCentres, setStudents, setActivityLogs, setTests } = dataSlice.actions;
export default dataSlice.reducer;