import { useEffect, useRef, useState } from 'react';
import { Link } from '../routes.jsx';
import {
  ACCOUNT_ROUTE,
  HOME_ROUTE,
  redirectTo
} from '../shared/navigation.js';
import {
  FEEDBACK_COLORS,
  REGISTER_SUCCESS_REDIRECT_DELAY_MS,
  getRegistrationErrorMessage,
  registerUser
} from '../shared/registrationClient.js';
import {
  PASSWORD_PATTERN,
  PASSWORD_TITLE,
  USERNAME_PATTERN,
  USERNAME_TITLE,
  getCredentialsFromInputs
} from '../shared/validation.js';

const initialFeedback = {
  message: '',
  isError: false
};

export default function Register() {
  const formRef = useRef(null);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const [feedback, setFeedback] = useState(initialFeedback);

  useEffect(() => {
    document.title = 'Register';
  }, []);

  function showMessage(message, isError = false) {
    setFeedback({ message, isError });
  }

  async function submitRegistration(event) {
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
      showMessage('Registration form is unavailable.', true);
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const credentials = getCredentialsFromInputs(usernameInput, passwordInput);

    try {
      const { response, data } = await registerUser(credentials);
      const errorMessage = getRegistrationErrorMessage(response, data);

      if (errorMessage) {
        showMessage(errorMessage, true);
        return;
      }

      showMessage('Registration complete! Redirecting...');
      window.setTimeout(() => {
        redirectTo(ACCOUNT_ROUTE);
      }, REGISTER_SUCCESS_REDIRECT_DELAY_MS);
    } catch (err) {
      console.error('Failed to register user', err);
      showMessage('Network error while attempting to register.', true);
    }
  }

  const feedbackStyle = feedback.message
    ? { color: feedback.isError ? FEEDBACK_COLORS.error : FEEDBACK_COLORS.success }
    : undefined;

  return (
    <>
      <header>
        <h1>Register</h1>
        <div className="header-right">
          <Link to={HOME_ROUTE}>Back</Link>
        </div>
      </header>

      <main>
        <div className="container">
          <section id="register-area">
            <form id="register-form" ref={formRef} onSubmit={submitRegistration}>
              <input
                type="text"
                id="username-email"
                name="username"
                placeholder="Username"
                autoComplete="username"
                required
                pattern={USERNAME_PATTERN}
                minLength={1}
                maxLength={32}
                title={USERNAME_TITLE}
                ref={usernameRef}
              />
              <input
                type="password"
                id="password-register"
                name="password"
                placeholder="Password"
                autoComplete="new-password"
                required
                pattern={PASSWORD_PATTERN}
                minLength={8}
                maxLength={64}
                title={PASSWORD_TITLE}
                ref={passwordRef}
              />
              <button type="submit" id="register-button">Register</button>
              <p id="register-feedback" aria-live="polite" style={feedbackStyle}>
                {feedback.message}
              </p>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}
