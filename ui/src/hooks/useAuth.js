import { useAuthContext } from '../context/AuthContext';

export default function useAuth() {
  const ctx = useAuthContext();
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider/>');
  return ctx;
}
