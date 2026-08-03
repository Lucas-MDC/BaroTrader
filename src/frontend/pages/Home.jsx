import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ACCOUNT_ROUTE, REGISTER_ROUTE } from '../shared/navigation.js';
import {
  getLoginErrorMessage,
  loginUser
} from '../shared/sessionClient.js';
import { getCredentialsFromInputs } from '../shared/validation.js';

const feedbackColors = {
  error: '#b91c1c'
};

export default function Home() {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    document.title = 'Home';
  }, []);

  async function handleLogin(event) {
    event.preventDefault();

    const form = formRef.current;
    const usernameInput = usernameRef.current;
    const passwordInput = passwordRef.current;

    if (
      !form ||
      !usernameInput ||
      !passwordInput ||
      !form.contains(usernameInput) ||
      !form.contains(passwordInput)
    ) {
      setFeedback('Login form is unavailable.');
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    try {
      const { response, data } = await loginUser(
        getCredentialsFromInputs(usernameInput, passwordInput)
      );
      const errorMessage = getLoginErrorMessage(response, data);

      if (errorMessage) {
        setFeedback(errorMessage);
        return;
      }

      navigate(ACCOUNT_ROUTE, { replace: true });
    } catch (err) {
      console.error('Failed to login', err);
      setFeedback('Network error while attempting to login.');
    }
  }

  return (
    <>
      <header>
        <h1>Home</h1>
      </header>

      <main>
        <div className="container">
          <section id="login-area">
            <form id="login-form" ref={formRef} onSubmit={handleLogin}>
              <input
                type="text"
                id="username-login"
                name="username"
                placeholder="Username"
                autoComplete="username"
                required
                ref={usernameRef}
              />
              <input
                type="password"
                id="password-login"
                name="password"
                placeholder="Password"
                autoComplete="current-password"
                required
                ref={passwordRef}
              />
              <button type="submit" id="login-button">Login</button>
              <p
                id="login-feedback"
                aria-live="polite"
                style={feedback ? { color: feedbackColors.error } : undefined}
              >
                {feedback}
              </p>
            </form>
          </section>
          <section id="register-area">
            <Link to={REGISTER_ROUTE}>Create an account</Link>
          </section>
        </div>
      </main>
    </>
  );
}
