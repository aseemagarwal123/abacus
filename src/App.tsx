import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { AuthProvider } from './components/auth/AuthProvider';
import PrivateRoute from './components/auth/PrivateRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import DefaultRedirect from './components/auth/DefaultRedirect';
import Login from './pages/auth/Login';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import CentreDashboard from './pages/dashboard/CentreDashboard';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import CentresList from './pages/centres/CentresList';
import CentreDetails from './pages/centres/CentreDetails';
import CentreForm from './pages/centres/CentreForm';
import StudentsList from './pages/students/StudentsList';
import StudentDetails from './pages/students/StudentDetails';
import StudentForm from './pages/students/StudentForm';
import ActivityLogs from './pages/activity/ActivityLogs';
import AdminTestList from './pages/tests/AdminTestList';
import AdminTestDetails from './pages/tests/AdminTestDetails';
import StudentTestDetails from './pages/tests/StudentTestDetails';
import StudentTestList from './pages/tests/StudentTestList';
import StudentTestResult from './pages/tests/StudentTestResult';
import { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { RootState } from './store/store';

const AppRoutes = () => {
  const userType = useSelector((state: RootState) => state.auth.user?.user_type);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<DefaultRedirect />} />
        
        <Route element={<PrivateRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/centre-dashboard" element={<CentreDashboard />} />
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/student-test/:id/result" element={<StudentTestResult />} />
            <Route path="/centres" element={<CentresList />} />
            <Route path="/centres/:id" element={<CentreDetails />} />
            <Route path="/centres/new" element={<CentreForm />} />
            <Route path="/centres/:id/edit" element={<CentreForm />} />
            <Route path="/students" element={<StudentsList />} />
            <Route path="/students/:id" element={<StudentDetails />} />
            <Route path="/students/new" element={<StudentForm />} />
            <Route path="/students/:id/edit" element={<StudentForm />} />
            <Route path="/logs" element={<ActivityLogs />} />
            
            {/* Test Routes based on user type */}
            <Route 
              path="/tests" 
              element={userType === 'ADMIN' ? <AdminTestList /> : <StudentTestList />} 
            />
            <Route 
              path="/tests/:id" 
              element={userType === 'ADMIN' ? <AdminTestDetails /> : <StudentTestDetails />} 
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Provider>
  );
}

export default App;