import React, { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <Center style={{ height: '60vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (!user) {
    return <Navigate to={'/auth'} replace />;
  }
  // if (roles && !roles?.includes(user?.role)) {
  //   return <Navigate to={'/forbidden'} replace />;
  // }
  return children;
};

export default ProtectedRoute;
