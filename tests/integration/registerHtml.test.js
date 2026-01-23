/** @jest-environment jsdom */
import { readFileSync } from 'fs';

const html = readFileSync(
  new URL('../../src/public/pages/noSession/register.html', import.meta.url),
  'utf8'
);

describe('register.html rendering', () => {
  beforeEach(() => {
    document.open();
    document.write(html);
    document.close();
  });

  test('basic elements and attributes exist', () => {
    const form = document.querySelector('#register-form');
    const usernameInput = document.querySelector('#username-email');
    const passwordInput = document.querySelector('#password-register');
    const submitButton = document.querySelector('#register-button');
    const feedback = document.querySelector('#register-feedback');

    expect(form).not.toBeNull();
    expect(usernameInput).not.toBeNull();
    expect(passwordInput).not.toBeNull();
    expect(submitButton).not.toBeNull();
    expect(feedback).not.toBeNull();
    expect(feedback.getAttribute('aria-live')).toBe('polite');

    [usernameInput, passwordInput].forEach((input) => {
      expect(input.hasAttribute('required')).toBe(true);
      expect(input.getAttribute('pattern')).toBeTruthy();
      expect(input.getAttribute('minlength')).toBeTruthy();
      expect(input.getAttribute('maxlength')).toBeTruthy();
    });
  });
});

