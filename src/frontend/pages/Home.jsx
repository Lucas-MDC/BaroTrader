import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm.jsx';
import { useAuth } from '../shared/authContext.jsx';
import { ACCOUNT_ROUTE, REGISTER_ROUTE } from '../shared/navigation.js';

export default function Home() {
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useAuth();

  useEffect(() => {
    document.title = 'Home';
  }, []);

  function handleLoginSuccess(user) {
    setAuthenticatedUser(user);
    navigate(ACCOUNT_ROUTE, { replace: true });
  }

  return (
    <>
      <header>
        <h1>Home</h1>
      </header>

      <main>
        <div className="container">
          <section id="login-area">
            <LoginForm onSuccess={handleLoginSuccess} />
          </section>
          <section id="register-area">
            <Link to={REGISTER_ROUTE}>Create an account</Link>
          </section>
        </div>
      </main>
    </>
  );
}
