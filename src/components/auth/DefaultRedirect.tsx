import React from 'react';
import { Navigate } from 'react-router-dom';
import { store } from '../../store/store';

const DefaultRedirect: React.FC = () => {
  const user = store.getState().auth.user;
  
  if (!user) return <Navigate to="/login" replace />;
  
  switch (user.user_type) {
    case 'ADMIN':
      return <Navigate to="/dashboard" replace />;
    case 'CENTRE':
      return <Navigate to="/centre-dashboard" replace />;
    case 'STUDENT':
      return <Navigate to="/student-dashboard" replace />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

export default DefaultRedirect; 