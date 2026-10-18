import { createContext, useContext, useEffect, useState } from 'react';
import { setAccessToken, clearAccessToken } from '../auth/tokenStore';
import { useAuthService } from '../services/useAuthService';
import {useNavigate} from "react-router";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const {
    login: loginService,
    register: registerService,
    refresh: refreshService,
    logout: logoutService,
    me: meService,
  } = useAuthService();

  const login = async (email, password) => {
    const data = await loginService(email, password);
    setAccessToken(data.accessToken);
    setUser(data.user);
    navigate('/');
  };

  const register = async (payload) => {
    const data = await registerService(payload);
    return data;
  };

  const refresh = async () => {
    const data = await refreshService();
    setAccessToken(data.accessToken);
  };

  const logout = async () => {
    try {
      await logoutService();
    } catch (e) {
      console.error('Logout request failed:', e);
    } finally {
      clearAccessToken();
      setUser(null);
      navigate('/auth');
    }
  };

  const me = async () => {
    try {
      const data = await meService();
      setUser(data);
    } catch {
      clearAccessToken();
      setUser(null);
      throw new Error('Unauthorized');
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await me();
          // if (!getAccessToken()) {
          //     setLoading(false);
          //     return;
          // }
      } catch {
        // A new visitor has no refresh cookie yet; guest routes remain available.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, refresh, logout, me }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);
