import React from 'react';
import useAuth from '../../hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
const ProtectedRoute = ({ children }) => {
 const { user, loading } = useAuth();
 const location=useLocation();
 if(loading)return <Center h="60vh"><Loader /></Center>;
 if(!user)return <Navigate to={`/auth?next=${encodeURIComponent(location.pathname+location.search)}`} replace />;
 if(!['TEACHER','ADMIN'].includes(user.role))return <Navigate to="/student" replace />;
 return children;
};
export default ProtectedRoute;
