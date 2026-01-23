/** @jest-environment jsdom */
import { jest } from '@jest/globals';

const registerScriptPath = '../../src/public/assets/js/register.js';

function buildForm({ includeUsername = true, includePassword = true, includeFeedback = true } = {}) {
  const usernameInput = includeUsername
    ? '<input id="username-email" />'
    : '';
  const passwordInput = includePassword
    ? '<input id="password-register" />'
    : '';
  const feedback = includeFeedback
    ? '<p id="register-feedback"></p>'
    : '';

  document.body.innerHTML = `
    <form id="register-form">
      ${usernameInput}
      ${passwordInput}
      <button id="register-button" type="submit">Register</button>
      ${feedback}
    </form>
  `;
}

describe('register client bindings', () => {
  beforeEach(() => {
    jest.resetModules();
    global.fetch = jest.fn();
  });

  test('missing #register-form does not crash the script', async () => {
    document.body.innerHTML = '';
    await expect(import(registerScriptPath)).resolves.toBeDefined();
  });

  test('missing username/password inputs show unavailable message', async () => {
    buildForm({ includeUsername: false, includePassword: false });

    await import(registerScriptPath);

    const form = document.querySelector('#register-form');
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    const feedback = document.querySelector('#register-feedback');
    expect(feedback.textContent).toBe('Registration form is unavailable.');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

