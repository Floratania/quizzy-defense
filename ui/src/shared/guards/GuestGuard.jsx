import useAuth from '../../hooks/useAuth.js';
import { Navigate } from 'react-router-dom';

export const GuestGuard = ({ children }) => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
