import { useEffect } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import LoginForm from '../components/LoginForm.jsx';
import { useAuth } from '../shared/authContext.jsx';
import { HOME_ROUTE, getSafeReturnLocation } from '../shared/navigation.js';

export default function Login() {
  const location = useLocation();
  const {
    status,
    checkSession,
    setAuthenticatedUser,
    retrySessionCheck
  } = useAuth();

  useEffect(() => {
    document.title = 'Login';
  }, []);

  useEffect(() => {
    if (status === 'unknown') {
      void checkSession();
    }
  }, [checkSession, status]);

  if (status === 'unknown' || status === 'checking') {
    return (
      <main>
        <div className="container" role="status" aria-live="polite">
          Checking your session…
        </div>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main>
        <div className="container" role="status" aria-live="polite">
          <p>Unable to check your session.</p>
          <button onClick={retrySessionCheck}>Try again</button>
        </div>
      </main>
    );
  }

  if (status === 'authenticated') {
    return <Navigate to={getSafeReturnLocation(location.state?.from)} replace />;
  }

  function handleLoginSuccess(user) {
    setAuthenticatedUser(user);
  }

  return (
    <>
      <header>
        <h1>Login</h1>
        <div className="header-right">
          <Link to={HOME_ROUTE}>Home</Link>
        </div>
      </header>

      <main>
        <div className="container">
          <section id="login-area">
            <LoginForm onSuccess={handleLoginSuccess} />
          </section>
        </div>
      </main>
    </>
  );
}
