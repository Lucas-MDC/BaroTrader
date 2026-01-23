import { getCredentialsFromInputs, showMessage } from '/static/shared/js/utils.js';

const registerForm = document.querySelector('#register-form');
const usernameInput = document.querySelector('#username-email');
const passwordInput = document.querySelector('#password-register');
const feedback = document.querySelector('#register-feedback');

async function submitRegistration(event) {
  event.preventDefault();

  if (!registerForm || !usernameInput || !passwordInput) {
    showMessage(feedback, 'Registration form is unavailable.', true);
    return;
  }

  if (!registerForm.checkValidity()) {
    registerForm.reportValidity();
    return;
  }

  const { username, password } = getCredentialsFromInputs(usernameInput, passwordInput);

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 409) {
      showMessage(feedback, 'User already exists.', true);
      return;
    }

    if (response.status === 400) {
      showMessage(feedback, 'Username or password is invalid.', true);
      return;
    }

    if (!response.ok) {
      showMessage(feedback, data.error || 'Unable to create your account.', true);
      return;
    }

    showMessage(feedback, 'Registration complete! Redirecting...');
    setTimeout(() => {
      window.location.href = '/private/static/pages/homeInternal.html';
    }, 600);
  } catch (err) {
    console.error('Failed to register user', err);
    showMessage(feedback, 'Network error while attempting to register.', true);
  }
}

registerForm?.addEventListener('submit', submitRegistration);
