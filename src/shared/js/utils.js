export function showMessage(target, message, isError = false) {
  if (!target) return;
  target.textContent = message;
  target.style.color = isError ? '#b91c1c' : '#047857';
}

export function getCredentialsFromInputs(usernameInput, passwordInput) {
  return {
    username: usernameInput?.value?.trim?.() ?? '',
    password: passwordInput?.value ?? ''
  };
}
