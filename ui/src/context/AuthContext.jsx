import {beginPasswordSignIn,beginBrowserLogout} from '../auth/browserSession.js';
import { createContext, useContext, useEffect, useState } from 'react';
import { getAccessToken, setAccessToken, clearAccessToken } from '../auth/tokenStore';
import { useAuthService } from '../services/useAuthService';


const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const {
    register: registerService,
    refresh: refreshService,
    me: meService,
  } = useAuthService();

  const login = (email,password) => beginPasswordSignIn(email,password);

  const register = async (payload) => {
    const data = await registerService(payload);
    return data;
  };

  const refresh = async () => {
    const data = await refreshService();
    setAccessToken(data.accessToken);
  };

  const logout = () => {
    clearAccessToken();setUser(null);
    return beginBrowserLogout();
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
        if(getAccessToken()&&window.location.pathname!=='/auth/complete')await me();
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
