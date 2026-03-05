/** @jest-environment jsdom */
/**
 * This test suite covers the isolated utilities used by the client registration flow.
 * The tests are grouped here because they validate small, reusable DOM helpers,
 * focusing on how messages are shown and how credentials are read from inputs.
 */
import { showMessage, getCredentialsFromInputs } from '../../src/shared/js/utils.js';

describe('showMessage', () => {
  test('no-op for null target', () => {
    // REG-UNIT-004: showMessage
    expect(() => showMessage(null, 'Hello')).not.toThrow();
    expect(() => showMessage(undefined, 'Hello')).not.toThrow();
  });

  test('sets success color and text', () => {
    // REG-UNIT-004: showMessage
    const target = document.createElement('p');
    showMessage(target, 'Success');
    expect(target.textContent).toBe('Success');
    expect(['#047857', 'rgb(4, 120, 87)']).toContain(target.style.color);
  });

  test('sets error color and text', () => {
    // REG-UNIT-004: showMessage
    const target = document.createElement('p');
    showMessage(target, 'Error', true);
    expect(target.textContent).toBe('Error');
    expect(['#b91c1c', 'rgb(185, 28, 28)']).toContain(target.style.color);
  });

  test('keeps HTML as text', () => {
    // REG-UNIT-004: showMessage
    const target = document.createElement('p');
    const message = '<img src=x onerror="alert(1)">';
    showMessage(target, message);
    expect(target.textContent).toBe(message);
    expect(target.querySelector('img')).toBeNull();
  });

  test('empty message clears text', () => {
    // REG-UNIT-004: showMessage
    const target = document.createElement('p');
    target.textContent = 'Existing';
    showMessage(target, '');
    expect(target.textContent).toBe('');
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

