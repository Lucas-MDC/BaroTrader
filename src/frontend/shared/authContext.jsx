import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import {
  getCurrentSession,
  SESSION_INVALID_EVENT
} from './sessionClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('unknown');
  const [user, setUser] = useState(null);
  const sessionRequest = useRef(null);

  const checkSession = useCallback(async () => {
    if (status === 'authenticated') return true;
    if (status === 'unauthenticated') return false;
    if (sessionRequest.current) return sessionRequest.current;

    setStatus('checking');
    sessionRequest.current = (async () => {
      try {
        const { response, data } = await getCurrentSession();

        if (response.ok && data.user) {
          setUser(data.user);
          setStatus('authenticated');
          return true;
        }

        if (response.status === 401) {
          setUser(null);
          setStatus('unauthenticated');
          return false;
        }

        setStatus('error');
        return null;
      } catch {
        setStatus('error');
        return null;
      } finally {
        sessionRequest.current = null;
      }
    })();

    return sessionRequest.current;
  }, [status]);

  const setAuthenticatedUser = useCallback((authenticatedUser) => {
    setUser(authenticatedUser);
    setStatus('authenticated');
  }, []);

  const clearAuthentication = useCallback(() => {
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    window.addEventListener(SESSION_INVALID_EVENT, clearAuthentication);
    return () => {
      window.removeEventListener(SESSION_INVALID_EVENT, clearAuthentication);
    };
  }, [clearAuthentication]);

  const retrySessionCheck = useCallback(() => {
    setStatus('unknown');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        checkSession,
        setAuthenticatedUser,
        clearAuthentication,
        retrySessionCheck
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
