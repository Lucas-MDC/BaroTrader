export const USERNAME_PATTERN = '^[a-z0-9](?:[a-z0-9._-]{1,30}[a-z0-9])?$';
export const PASSWORD_PATTERN = '^(?=.*[A-Za-z])(?=.*\\d)[\\x21-\\x7E]{8,64}$';

export const USERNAME_TITLE =
  'Use 1-32 characters: lowercase letters, numbers, dot, underscore, or hyphen.';
export const PASSWORD_TITLE = 'Use 8-64 characters with at least one letter and one number.';

export function getCredentialsFromInputs(usernameInput, passwordInput) {
  return {
    username: usernameInput?.value?.trim?.() ?? '',
    password: passwordInput?.value ?? ''
  };
}
