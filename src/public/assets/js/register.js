import { getCredentialsFromInputs, showMessage } from '/static/shared/js/utils.js';

const registerForm = document.querySelector('#register-form');
const usernameInput = document.querySelector('#username-email');
const passwordInput = document.querySelector('#password-register');
const feedback = document.querySelector('#register-feedback');

const usernamePattern = usernameInput?.getAttribute('pattern') ?? '';
const passwordPattern = passwordInput?.getAttribute('pattern') ?? '';
const usernameRegex = usernamePattern ? new RegExp(usernamePattern) : null;
const passwordRegex = passwordPattern ? new RegExp(passwordPattern) : null;
const usernameMinLength = usernameInput?.minLength ?? 1;
const usernameMaxLength = usernameInput?.maxLength ?? 32;
const passwordMinLength = passwordInput?.minLength ?? 8;
const passwordMaxLength = passwordInput?.maxLength ?? 64;

function isValidUsername(username) {
  if (!username) return false;
  if (username.length < usernameMinLength) return false;
  if (usernameMaxLength > 0 && username.length > usernameMaxLength) return false;
  return usernameRegex ? usernameRegex.test(username) : true;
}

function isValidPassword(password) {
  if (!password) return false;
  if (password.length < passwordMinLength) return false;
  if (passwordMaxLength > 0 && password.length > passwordMaxLength) return false;
  return passwordRegex ? passwordRegex.test(password) : true;
}

async function submitRegistration(event) {
  event.preventDefault();

  const { username, password } = getCredentialsFromInputs(usernameInput, passwordInput);

  if (!username || !password.trim()) {
    showMessage(feedback, 'Informe usuario e senha para registrar.', true);
    return;
  }

  if (!isValidUsername(username)) {
    showMessage(
      feedback,
      `Username invalido. Use ${usernameMinLength}-${usernameMaxLength} caracteres: letras minusculas, numeros, ponto, sublinhado ou hifen.`,
      true
    );
    return;
  }

  if (!isValidPassword(password)) {
    showMessage(
      feedback,
      `Senha invalida. Use ${passwordMinLength}-${passwordMaxLength} caracteres, com letra e numero.`,
      true
    );
    return;
  }

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 409) {
      showMessage(feedback, 'Usuario ja existe.', true);
      return;
    }

    if (response.status === 400) {
      showMessage(feedback, 'Username ou senha invalidos.', true);
      return;
    }

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
