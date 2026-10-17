import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LOGIN_ROUTE } from '../shared/navigation.js';
import { useAuth } from '../shared/authContext.jsx';

function SessionCheckMessage({ onRetry, children }) {
  return (
    <main>
      <div className="container" role="status" aria-live="polite">
        <p>{children}</p>
        {onRetry && <button onClick={onRetry}>Try again</button>}
      </div>
    </main>
  );
}

export default function RequireSession({ children }) {
  const location = useLocation();
  const { status, checkSession, retrySessionCheck } = useAuth();

  useEffect(() => {
    if (status === 'unknown') {
      void checkSession();
    }
  }, [checkSession, status]);

  if (status === 'unknown' || status === 'checking') {
    return <SessionCheckMessage>Checking your session…</SessionCheckMessage>;
  }

  if (status === 'error') {
    return (
      <SessionCheckMessage onRetry={retrySessionCheck}>
        Unable to check your session.
      </SessionCheckMessage>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Navigate
        to={LOGIN_ROUTE}
        replace
        state={{ from: location }}
      />
    );
  }

  return children;
}
