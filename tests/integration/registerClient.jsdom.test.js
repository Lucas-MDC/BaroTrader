/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import { TextDecoder, TextEncoder } from 'node:util';

global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

/**
 * This test suite covers the integration between the real registration React
 * page and its client-side dependencies. The tests are grouped together because
 * they exercise the browser's high-level flow in jsdom: page rendering, form
 * validation, HTTP calls, feedback, and SPA navigation.
 */
const REGISTER_ROUTE = '/register';
const ACCOUNT_ROUTE = '/account';

let root;
let act;
let currentPath;

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

async function loadPage({ includeFeedback = true } = {}) {
  const react = await import('react');
  const reactDom = await import('react-dom/client');
  const { MemoryRouter, useLocation } = await import('react-router-dom');
  const { default: Register } = await import(
    '../../src/frontend/pages/Register.jsx'
  );

  act = react.act;

  const container = document.createElement('div');
  document.body.append(container);
  root = reactDom.createRoot(container);

  function LocationObserver() {
    currentPath = useLocation().pathname;
    return null;
  }

  await act(async () => {
    root.render(
      react.createElement(
        MemoryRouter,
        { initialEntries: [REGISTER_ROUTE] },
        react.createElement(Register),
        react.createElement(LocationObserver)
      )
    );
  });

  if (!includeFeedback) {
    document.querySelector('#register-feedback')?.remove();
  }
}

async function submitForm(form) {
  await act(async () => {
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
    await flushPromises();
  });
}

function advanceTimersByTime(ms) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

function runOnlyPendingTimers() {
  act(() => {
    jest.runOnlyPendingTimers();
  });
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
    global.IS_REACT_ACT_ENVIRONMENT = true;
    global.fetch = jest.fn();
  });

  afterEach(async () => {
    if (root && act) {
      await act(async () => {
        root.unmount();
      });
    }

    root = undefined;
    act = undefined;
    currentPath = undefined;
    jest.useRealTimers();
    jest.restoreAllMocks();
    delete global.fetch;
    delete global.IS_REACT_ACT_ENVIRONMENT;
    document.body.innerHTML = '';
  });

  test('register page has required elements and attributes', async () => {
    // REG-INT-001: register page basic rendering
    await loadPage();

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
    await loadPage();
    const form = document.querySelector('#register-form');

    form.checkValidity = () => false;
    form.reportValidity = jest.fn();

    await submitForm(form);

    expect(form.reportValidity).toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('missing feedback does not break invalid submission flow', async () => {
    // REG-INT-002: submit with invalid inputs
    await loadPage({ includeFeedback: false });
    const form = document.querySelector('#register-form');

    form.checkValidity = () => false;
    form.reportValidity = jest.fn();

    await submitForm(form);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('successful submit posts JSON and redirects after delay', async () => {
    // REG-INT-003: successful submit
    jest.useFakeTimers();
    try {
      await loadPage();

      const usernameInput = document.querySelector('#username-email');
      const passwordInput = document.querySelector('#password-register');
      const feedback = document.querySelector('#register-feedback');
      const form = document.querySelector('#register-form');

      usernameInput.value = '  user  ';
      passwordInput.value = 'Pass1234!';

      mockFetchResponse({ ok: true, status: 201, json: {} });

      form.checkValidity = () => true;
      await submitForm(form);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe('/api/register');
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual({ 'Content-Type': 'application/json' });

      const payload = JSON.parse(options.body);
      expect(payload).toEqual({ username: 'user', password: 'Pass1234!' });

      expect(feedback.textContent).toBe('Registration complete! Redirecting...');
      expect(['#047857', 'rgb(4, 120, 87)']).toContain(feedback.style.color);

      advanceTimersByTime(599);
      expect(currentPath).toBe(REGISTER_ROUTE);

      advanceTimersByTime(1);
      expect(currentPath).toBe(ACCOUNT_ROUTE);
    } finally {
      runOnlyPendingTimers();
      jest.useRealTimers();
    }
  });

  test('success redirects even without feedback element', async () => {
    // REG-INT-003: successful submit
    jest.useFakeTimers();
    try {
      await loadPage({ includeFeedback: false });

      const usernameInput = document.querySelector('#username-email');
      const passwordInput = document.querySelector('#password-register');
      const form = document.querySelector('#register-form');

      usernameInput.value = 'user';
      passwordInput.value = 'Pass1234!';

      mockFetchResponse({ ok: true, status: 201, json: {} });

      form.checkValidity = () => true;
      await submitForm(form);

      advanceTimersByTime(600);
      expect(currentPath).toBe(ACCOUNT_ROUTE);
    } finally {
      runOnlyPendingTimers();
      jest.useRealTimers();
    }
  });

  test('409 responses show duplicate message and no redirect', async () => {
    // REG-INT-004: API error responses (client-side handling)
    await loadPage();

    const usernameInput = document.querySelector('#username-email');
    const passwordInput = document.querySelector('#password-register');
    const feedback = document.querySelector('#register-feedback');
    const form = document.querySelector('#register-form');

    usernameInput.value = 'user';
    passwordInput.value = 'Pass1234!';

    mockFetchResponse({ ok: false, status: 409, json: {} });

    form.checkValidity = () => true;
    await submitForm(form);

    expect(feedback.textContent).toBe('User already exists.');
    expect(['#b91c1c', 'rgb(185, 28, 28)']).toContain(feedback.style.color);
    expect(currentPath).toBe(REGISTER_ROUTE);
  });

  test('400 responses show invalid message and no redirect', async () => {
    // REG-INT-004: API error responses (client-side handling)
    await loadPage();

    const usernameInput = document.querySelector('#username-email');
    const passwordInput = document.querySelector('#password-register');
    const feedback = document.querySelector('#register-feedback');
    const form = document.querySelector('#register-form');

    usernameInput.value = 'user';
    passwordInput.value = 'Pass1234!';

    mockFetchResponse({ ok: false, status: 400, json: {} });

    form.checkValidity = () => true;
    await submitForm(form);

    expect(feedback.textContent).toBe('Username or password is invalid.');
    expect(['#b91c1c', 'rgb(185, 28, 28)']).toContain(feedback.style.color);
    expect(currentPath).toBe(REGISTER_ROUTE);
  });

  test('non-ok responses show server error when provided', async () => {
    // REG-INT-004: API error responses (client-side handling)
    await loadPage();

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
    await submitForm(form);

    expect(feedback.textContent).toBe('Server exploded.');
    expect(['#b91c1c', 'rgb(185, 28, 28)']).toContain(feedback.style.color);
  });

  test('non-ok responses without JSON show a generic message', async () => {
    // REG-INT-004: API error responses (client-side handling)
    await loadPage();

    const usernameInput = document.querySelector('#username-email');
    const passwordInput = document.querySelector('#password-register');
    const feedback = document.querySelector('#register-feedback');
    const form = document.querySelector('#register-form');

    usernameInput.value = 'user';
    passwordInput.value = 'Pass1234!';

    mockFetchResponse({ ok: false, status: 500, jsonThrows: true });

    form.checkValidity = () => true;
    await submitForm(form);

    expect(feedback.textContent).toBe('Unable to create your account.');
    expect(['#b91c1c', 'rgb(185, 28, 28)']).toContain(feedback.style.color);
  });

  test('network failures show a network error message', async () => {
    // REG-INT-005: network failure (client-side handling)
    await loadPage();

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
      await submitForm(form);

      expect(feedback.textContent).toBe(
        'Network error while attempting to register.'
      );
      expect(['#b91c1c', 'rgb(185, 28, 28)']).toContain(feedback.style.color);
      expect(currentPath).toBe(REGISTER_ROUTE);

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
      await loadPage();

      const usernameInput = document.querySelector('#username-email');
      const passwordInput = document.querySelector('#password-register');
      const feedback = document.querySelector('#register-feedback');
      const form = document.querySelector('#register-form');

      usernameInput.value = 'user';
      passwordInput.value = 'Pass1234!';

      mockFetchResponse({ ok: true, status: 200, json: {} });

      form.checkValidity = () => true;
      await submitForm(form);

      expect(feedback.textContent).toBe('Registration complete! Redirecting...');
      advanceTimersByTime(600);
      expect(currentPath).toBe(ACCOUNT_ROUTE);
    } finally {
      runOnlyPendingTimers();
      jest.useRealTimers();
    }
  });

  test('whitespace-only passwords fail validation and do not call fetch', async () => {
    // REG-INT-007: whitespace-only password path
    await loadPage();

    const usernameInput = document.querySelector('#username-email');
    const passwordInput = document.querySelector('#password-register');
    const form = document.querySelector('#register-form');

    usernameInput.value = 'user';
    passwordInput.value = '        ';

    const passwordPattern = new RegExp(passwordInput.getAttribute('pattern'));
    expect(passwordPattern.test(passwordInput.value)).toBe(false);

    form.checkValidity = () => false;
    form.reportValidity = jest.fn();

    await submitForm(form);

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
