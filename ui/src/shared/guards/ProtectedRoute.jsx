import React from 'react';
import useAuth from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
const ProtectedRoute = ({ children }) => {
 const { user, loading } = useAuth();
 if(loading)return <Center h="60vh"><Loader /></Center>;
 if(!user)return <Navigate to="/auth" replace />;
 if(!['TEACHER','ADMIN'].includes(user.role))return <Navigate to="/student" replace />;
 return children;
};
export default ProtectedRoute;
