import { getCredentialsFromInputs, showMessage } from '/static/shared/js/utils.js';

const registerForm = document.querySelector('#register-form');
const usernameInput = document.querySelector('#username-email');
const passwordInput = document.querySelector('#password-register');
const feedback = document.querySelector('#register-feedback');

async function submitRegistration(event) {
  event.preventDefault();

  const { username, password } = getCredentialsFromInputs(usernameInput, passwordInput);

  if (!username || !password.trim()) {
    showMessage(feedback, 'Informe usuario e senha para registrar.', true);
    return;
  }

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      showMessage(feedback, data.error || 'Nao foi possivel criar sua conta.', true);
      return;
    }

    showMessage(feedback, 'Registro concluido! Redirecionando...');
    setTimeout(() => {
      window.location.href = '/private/static/pages/homeInternal.html';
    }, 600);
  } catch (err) {
    console.error('Erro ao registrar usuario', err);
    showMessage(feedback, 'Erro de rede ao tentar registrar.', true);
  }
}

registerForm?.addEventListener('submit', submitRegistration);
