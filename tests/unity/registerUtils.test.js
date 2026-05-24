/** @jest-environment jsdom */
/**
 * This test suite covers the isolated validation helpers used by the client
 * registration flow.
 */
import {
  PASSWORD_PATTERN,
  USERNAME_PATTERN,
  getCredentialsFromInputs
} from '../../src/frontend/shared/validation.js';

describe('registration validation patterns', () => {
  test('username pattern accepts normalized usernames', () => {
    // REG-UNIT-004: validation patterns
    const pattern = new RegExp(USERNAME_PATTERN);

    expect(pattern.test('user')).toBe(true);
    expect(pattern.test('user.name_123')).toBe(true);
  });

  test('username pattern rejects uppercase and invalid boundary characters', () => {
    // REG-UNIT-004: validation patterns
    const pattern = new RegExp(USERNAME_PATTERN);

    expect(pattern.test('User')).toBe(false);
    expect(pattern.test('.user')).toBe(false);
    expect(pattern.test('user-')).toBe(false);
  });

  test('password pattern requires a visible ASCII password with letters and numbers', () => {
    // REG-UNIT-004: validation patterns
    const pattern = new RegExp(PASSWORD_PATTERN);

    expect(pattern.test('Pass1234!')).toBe(true);
    expect(pattern.test('password')).toBe(false);
    expect(pattern.test('12345678')).toBe(false);
    expect(pattern.test('        ')).toBe(false);
  });
});

describe('getCredentialsFromInputs', () => {
  test('trims username and keeps raw password', () => {
    // REG-UNIT-005: getCredentialsFromInputs
    const usernameInput = { value: '  user  ' };
    const passwordInput = { value: '  pass  ' };
    const { username, password } = getCredentialsFromInputs(
      usernameInput,
      passwordInput
    );
    expect(username).toBe('user');
    expect(password).toBe('  pass  ');
  });

  test('null inputs return empty strings', () => {
    // REG-UNIT-005: getCredentialsFromInputs
    const { username, password } = getCredentialsFromInputs(null, undefined);
    expect(username).toBe('');
    expect(password).toBe('');
  });

  test('non-string usernames return an empty string', () => {
    // REG-UNIT-005: getCredentialsFromInputs
    const numberInput = { value: 123 };
    const objectInput = { value: { name: 'user' } };
    const passwordInput = { value: 'pass' };

    expect(getCredentialsFromInputs(numberInput, passwordInput).username)
      .toBe('');
    expect(getCredentialsFromInputs(objectInput, passwordInput).username)
      .toBe('');
  });
});
