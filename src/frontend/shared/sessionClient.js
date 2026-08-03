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
