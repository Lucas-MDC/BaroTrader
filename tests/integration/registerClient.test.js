/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import { readFileSync } from 'fs';

const html = readFileSync(
  new URL('../../src/public/pages/noSession/register.html', import.meta.url),
  'utf8'
);

const registerScriptPath = '../../src/public/assets/js/register.js';

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

  stubLocation();
}

function stubLocation(initialHref = 'http://localhost/') {
  let href = initialHref;
  const location = {};
  Object.defineProperty(location, 'href', {
    get: () => href,
    set: (value) => {
      href = value;
    }
  });

  try {
    delete window.location;
  } catch (error) {
    // ignore and fall back to defineProperty/assignment
  }

  try {
    Object.defineProperty(window, 'location', {
      value: location,
      configurable: true,
      writable: true
    });
  } catch (error) {
    window.location = location;
  }

  return location;
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

describe('register client integration', () => {
  beforeEach(() => {
    jest.resetModules();
    global.fetch = jest.fn();
  });

  test('invalid inputs block submission and do not call fetch', async () => {
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
    loadPage({ includeFeedback: false });
    const form = document.querySelector('#register-form');

    form.checkValidity = () => false;
    form.reportValidity = jest.fn();

    await import(registerScriptPath);

    form.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('successful submit posts JSON and redirects after delay', async () => {
    jest.useFakeTimers();
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
    expect(window.location.href).toBe('http://localhost/');

    jest.advanceTimersByTime(1);
    expect(window.location.href).toBe(
      '/private/static/pages/homeInternal.html'
    );

    jest.useRealTimers();
  });

  test('success redirects even without feedback element', async () => {
    jest.useFakeTimers();
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
    expect(window.location.href).toBe(
      '/private/static/pages/homeInternal.html'
    );

    jest.useRealTimers();
  });

  test('409 responses show duplicate message and no redirect', async () => {
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
    expect(window.location.href).toBe('http://localhost/');
  });

  test('400 responses show invalid message and no redirect', async () => {
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
    expect(window.location.href).toBe('http://localhost/');
  });

  test('non-ok responses show server error when provided', async () => {
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
    loadPage();

    const usernameInput = document.querySelector('#username-email');
    const passwordInput = document.querySelector('#password-register');
    const feedback = document.querySelector('#register-feedback');
    const form = document.querySelector('#register-form');

    usernameInput.value = 'user';
    passwordInput.value = 'Pass1234!';

    global.fetch.mockRejectedValue(new Error('Network down'));

    form.checkValidity = () => true;
    await import(registerScriptPath);
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    await flushPromises();

    expect(feedback.textContent).toBe(
      'Network error while attempting to register.'
    );
    expect(['#b91c1c', 'rgb(185, 28, 28)']).toContain(feedback.style.color);
    expect(window.location.href).toBe('http://localhost/');
  });

  test('non-201 success responses are treated as success', async () => {
    jest.useFakeTimers();
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
    expect(window.location.href).toBe(
      '/private/static/pages/homeInternal.html'
    );

    jest.useRealTimers();
  });

  test('whitespace-only passwords fail validation and do not call fetch', async () => {
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

