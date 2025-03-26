import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

const PrivateRoute: React.FC = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  
  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};

export default PrivateRoute;