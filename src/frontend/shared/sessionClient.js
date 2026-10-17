export const SESSION_INVALID_EVENT = 'barotrader:session-invalid';

export async function getCurrentSession() {
  const response = await fetch('/api/session', {
    cache: 'no-store',
    credentials: 'same-origin'
  });
  const data = await response.json().catch(() => ({}));

  return { response, data };
}

export async function fetchAuthenticated(input, options = {}) {
  const response = await fetch(input, {
    credentials: 'same-origin',
    ...options
  });

  if (response.status === 401) {
    window.dispatchEvent(new Event(SESSION_INVALID_EVENT));
  }

  return response;
}

export async function loginUser({ username, password }) {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json().catch(() => ({}));

  return { response, data };
}

export async function logoutUser() {
  return fetch('/api/logout', {
    method: 'DELETE'
  });
}

export function getLoginErrorMessage(response, data) {
  if (response.status === 401) {
    return 'Invalid username or password.';
  }

  if (!response.ok) {
    return data.error || 'Unable to login.';
  }

  return '';
}
