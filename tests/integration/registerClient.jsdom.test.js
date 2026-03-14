/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import { readFileSync } from 'fs';

/**
 * This test suite covers the integration between the real registration page and 
 * the client script. The tests are grouped together because they exercise the 
 * browser's high-level flow in jsdom: page rendering, form validation, HTTP 
 * calls, feedback, and redirection.
 */
const html = readFileSync(
  new URL('../../src/public/pages/noSession/register.html', import.meta.url),
  'utf8'
);

const registerScriptPath = '../../src/public/assets/js/register.js';
const redirectToMock = jest.fn();

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

function loadPage({ includeFeedback = true } = {}) {
  document.open();
  document.write(html);
  document.close();

  if (!includeFeedback) {
    document.querySelector('#register-feedback')?.remove();
  }
}

function mockFetchResponse({ ok = true, status = 200, json, jsonThrows } = {}) {
  const response = {
    ok,
    status,
    json: jsonThrows
      ? jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      : jest.fn().mockResolvedValue(json ?? {})
  };

  global.fetch.mockResolvedValue(response);
  return response;
}

describe('register client jsdom integration', () => {
  beforeEach(() => {
    jest.resetModules();
    redirectToMock.mockReset();
    jest.unstable_mockModule('../../src/public/assets/js/navigation.js', () => ({
      redirectTo: redirectToMock
    }));
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    delete global.fetch;
    document.body.innerHTML = '';
  });

  test('register page has required elements and attributes', () => {
    // REG-INT-001: register.html basic rendering
    loadPage();

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

  test('invalid inputs block submission and do not call fetch', async () => {
    // REG-INT-002: submit with invalid inputs
    loadPage();
    const form = document.querySelector('#register-form');

    form.checkValidity = () => false;
    form.reportValidity = jest.fn();

    await import(registerScriptPath);

    form.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(form.reportValidity).toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('missing feedback does not break invalid submission flow', async () => {
    // REG-INT-002: submit with invalid inputs
    loadPage({ includeFeedback: false });
    const form = document.querySelector('#register-form');

    form.checkValidity = () => false;
    form.reportValidity = jest.fn();

    await import(registerScriptPath);

    form.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('successful submit posts JSON and redirects after delay', async () => {
    // REG-INT-003: successful submit
    jest.useFakeTimers();
    try {
      loadPage();

      const usernameInput = document.querySelector('#username-email');
      const passwordInput = document.querySelector('#password-register');
      const feedback = document.querySelector('#register-feedback');
      const form = document.querySelector('#register-form');

      usernameInput.value = '  user  ';
      passwordInput.value = 'Pass1234!';

      mockFetchResponse({ ok: true, status: 201, json: {} });

      form.checkValidity = () => true;
      await import(registerScriptPath);
      form.dispatchEvent(new Event('submit', { cancelable: true }));

      await flushPromises();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe('/api/register');
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual({ 'Content-Type': 'application/json' });

      const payload = JSON.parse(options.body);
      expect(payload).toEqual({ username: 'user', password: 'Pass1234!' });

      expect(feedback.textContent).toBe('Registration complete! Redirecting...');
      expect(['#047857', 'rgb(4, 120, 87)']).toContain(feedback.style.color);

      jest.advanceTimersByTime(599);
      expect(redirectToMock).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(redirectToMock).toHaveBeenCalledWith(
        '/private/static/pages/homeInternal.html'
      );
    } finally {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    }
  });

  test('success redirects even without feedback element', async () => {
    // REG-INT-003: successful submit
    jest.useFakeTimers();
    try {
      loadPage({ includeFeedback: false });

      const usernameInput = document.querySelector('#username-email');
      const passwordInput = document.querySelector('#password-register');
      const form = document.querySelector('#register-form');

      usernameInput.value = 'user';
      passwordInput.value = 'Pass1234!';

      mockFetchResponse({ ok: true, status: 201, json: {} });

      form.checkValidity = () => true;
      await import(registerScriptPath);
      form.dispatchEvent(new Event('submit', { cancelable: true }));

      await flushPromises();

      jest.advanceTimersByTime(600);
      expect(redirectToMock).toHaveBeenCalledWith(
        '/private/static/pages/homeInternal.html'
      );
    } finally {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    }
  });

  test('409 responses show duplicate message and no redirect', async () => {
    // REG-INT-004: API error responses (client-side handling)
    loadPage();

    const usernameInput = document.querySelector('#username-email');
    const passwordInput = document.querySelector('#password-register');
    const feedback = document.querySelector('#register-feedback');
    const form = document.querySelector('#register-form');

    usernameInput.value = 'user';
    passwordInput.value = 'Pass1234!';

    mockFetchResponse({ ok: false, status: 409, json: {} });

    form.checkValidity = () => true;
    await import(registerScriptPath);
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    await flushPromises();

    expect(feedback.textContent).toBe('User already exists.');
    expect(['#b91c1c', 'rgb(185, 28, 28)']).toContain(feedback.style.color);
    expect(redirectToMock).not.toHaveBeenCalled();
  });

  test('400 responses show invalid message and no redirect', async () => {
    // REG-INT-004: API error responses (client-side handling)
    loadPage();

    const usernameInput = document.querySelector('#username-email');
    const passwordInput = document.querySelector('#password-register');
    const feedback = document.querySelector('#register-feedback');
    const form = document.querySelector('#register-form');

    usernameInput.value = 'user';
    passwordInput.value = 'Pass1234!';

    mockFetchResponse({ ok: false, status: 400, json: {} });

    form.checkValidity = () => true;
    await import(registerScriptPath);
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    await flushPromises();

    expect(feedback.textContent).toBe('Username or password is invalid.');
    expect(['#b91c1c', 'rgb(185, 28, 28)']).toContain(feedback.style.color);
    expect(redirectToMock).not.toHaveBeenCalled();
  });

  test('non-ok responses show server error when provided', async () => {
    // REG-INT-004: API error responses (client-side handling)
    loadPage();

    const usernameInput = document.querySelector('#username-email');
    const passwordInput = document.querySelector('#password-register');
    const feedback = document.querySelector('#register-feedback');
    const form = document.querySelector('#register-form');

    usernameInput.value = 'user';
    passwordInput.value = 'Pass1234!';

    mockFetchResponse({
      ok: false,
      status: 500,
      json: { error: 'Server exploded.' }
    });

    form.checkValidity = () => true;
    await import(registerScriptPath);
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    await flushPromises();

    expect(feedback.textContent).toBe('Server exploded.');
    expect(['#b91c1c', 'rgb(185, 28, 28)']).toContain(feedback.style.color);
  });

  test('non-ok responses without JSON show a generic message', async () => {
    // REG-INT-004: API error responses (client-side handling)
    loadPage();

    const usernameInput = document.querySelector('#username-email');
    const passwordInput = document.querySelector('#password-register');
    const feedback = document.querySelector('#register-feedback');
    const form = document.querySelector('#register-form');

    usernameInput.value = 'user';
    passwordInput.value = 'Pass1234!';

    mockFetchResponse({ ok: false, status: 500, jsonThrows: true });

    form.checkValidity = () => true;
    await import(registerScriptPath);
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    await flushPromises();

    expect(feedback.textContent).toBe('Unable to create your account.');
    expect(['#b91c1c', 'rgb(185, 28, 28)']).toContain(feedback.style.color);
  });

  test('network failures show a network error message', async () => {
    // REG-INT-005: network failure (client-side handling)
    loadPage();

    const usernameInput = document.querySelector('#username-email');
    const passwordInput = document.querySelector('#password-register');
    const feedback = document.querySelector('#register-feedback');
    const form = document.querySelector('#register-form');

    usernameInput.value = 'user';
    passwordInput.value = 'Pass1234!';

    global.fetch.mockRejectedValue(new Error('Network down'));

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      form.checkValidity = () => true;
      await import(registerScriptPath);
      form.dispatchEvent(new Event('submit', { cancelable: true }));

      await flushPromises();

      expect(feedback.textContent).toBe(
        'Network error while attempting to register.'
      );
      expect(['#b91c1c', 'rgb(185, 28, 28)']).toContain(feedback.style.color);
      expect(redirectToMock).not.toHaveBeenCalled();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to register user',
        expect.objectContaining({ message: 'Network down' })
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  test('non-201 success responses are treated as success', async () => {
    // REG-INT-006: non-201 success responses
    jest.useFakeTimers();
    try {
      loadPage();

      const usernameInput = document.querySelector('#username-email');
      const passwordInput = document.querySelector('#password-register');
      const feedback = document.querySelector('#register-feedback');
      const form = document.querySelector('#register-form');

      usernameInput.value = 'user';
      passwordInput.value = 'Pass1234!';

      mockFetchResponse({ ok: true, status: 200, json: {} });

      form.checkValidity = () => true;
      await import(registerScriptPath);
      form.dispatchEvent(new Event('submit', { cancelable: true }));

      await flushPromises();

      expect(feedback.textContent).toBe('Registration complete! Redirecting...');
      jest.advanceTimersByTime(600);
      expect(redirectToMock).toHaveBeenCalledWith(
        '/private/static/pages/homeInternal.html'
      );
    } finally {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    }
  });

  test('whitespace-only passwords fail validation and do not call fetch', async () => {
    // REG-INT-007: whitespace-only password path
    loadPage();

    const usernameInput = document.querySelector('#username-email');
    const passwordInput = document.querySelector('#password-register');
    const form = document.querySelector('#register-form');

    usernameInput.value = 'user';
    passwordInput.value = '        ';

    const passwordPattern = new RegExp(passwordInput.getAttribute('pattern'));
    expect(passwordPattern.test(passwordInput.value)).toBe(false);

    form.checkValidity = () => false;
    form.reportValidity = jest.fn();

    await import(registerScriptPath);

    form.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
