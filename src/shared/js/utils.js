/*
Shared UI helpers for public and private pages.
*/

export function showMessage(target, message, isError = false) {

  /*
  Render feedback text in a target element with a basic error style.
  */

  if (!target) return;
  target.textContent = message;
  target.style.color = isError ? '#b91c1c' : '#047857';
}

export function getCredentialsFromInputs(usernameInput, passwordInput) {

  /*
  Extract trimmed credentials from input fields.
  */

  return {
    username: usernameInput?.value?.trim?.() ?? '',
    password: passwordInput?.value ?? ''
  };
}
