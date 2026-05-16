export const REGISTER_SUCCESS_REDIRECT_DELAY_MS = 600;

export const FEEDBACK_COLORS = {
  error: '#b91c1c',
  success: '#047857'
};

export async function registerUser({ username, password }) {
  const response = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json().catch(() => ({}));

  return { response, data };
}

export function getRegistrationErrorMessage(response, data) {
  if (response.status === 409) {
    return 'User already exists.';
  }

  if (response.status === 400) {
    return 'Username or password is invalid.';
  }

  if (!response.ok) {
    return data.error || 'Unable to create your account.';
  }

  return '';
}
