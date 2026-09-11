/** @jest-environment jsdom */

import { jest } from '@jest/globals';
import { TextDecoder, TextEncoder } from 'node:util';

global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

const HOME_ROUTE = '/';
const ACCOUNT_ROUTE = '/account';

let root;
let act;
let currentPath;
let navigationType;

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

async function loadPage({ includeFeedback = true } = {}) {
  const react = await import('react');
  const reactDom = await import('react-dom/client');
  const {
    MemoryRouter,
    useLocation,
    useNavigationType
  } = await import('react-router-dom');
  const { default: Home } = await import('../../../src/frontend/pages/Home.jsx');

  act = react.act;
  const container = document.createElement('div');
  document.body.append(container);
  root = reactDom.createRoot(container);

  function RouterObserver() {
    currentPath = useLocation().pathname;
    navigationType = useNavigationType();
    return null;
  }

  await act(async () => {
    root.render(
      react.createElement(
        MemoryRouter,
        { initialEntries: [HOME_ROUTE] },
        react.createElement(Home),
        react.createElement(RouterObserver)
      )
    );
  });

  if (!includeFeedback) {
    document.querySelector('#login-feedback')?.remove();
  }
}

async function submitForm(form) {
  await act(async () => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushPromises();
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

describe('login client JSDOM integration', () => {
  beforeEach(() => {
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
    navigationType = undefined;
    jest.restoreAllMocks();
    delete global.fetch;
    delete global.IS_REACT_ACT_ENVIRONMENT;
    document.body.innerHTML = '';
  });

  test('login page renders the expected form fields and attributes', async () => {
    // LOGIN-INT-001: Login component basic rendering
    await loadPage();

    const form = document.querySelector('#login-form');
    const usernameInput = document.querySelector('#username-login');
    const passwordInput = document.querySelector('#password-login');
    const submitButton = document.querySelector('#login-button');
    const feedback = document.querySelector('#login-feedback');

    expect(form).not.toBeNull();
    expect(usernameInput).not.toBeNull();
    expect(passwordInput).not.toBeNull();
    expect(submitButton).not.toBeNull();
    expect(feedback).not.toBeNull();
    expect(feedback.getAttribute('aria-live')).toBe('polite');
    expect(usernameInput.required).toBe(true);
    expect(passwordInput.required).toBe(true);
    expect(usernameInput.autocomplete).toBe('username');
    expect(passwordInput.autocomplete).toBe('current-password');
  });

  test('invalid inputs trigger browser validation and do not call fetch', async () => {
    // LOGIN-INT-002: submit with invalid inputs
    await loadPage();
    const form = document.querySelector('#login-form');
    form.checkValidity = () => false;
    form.reportValidity = jest.fn();

    await submitForm(form);

    expect(form.reportValidity).toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('missing feedback does not break invalid submission handling', async () => {
    // LOGIN-INT-002: submit with invalid inputs
    await loadPage({ includeFeedback: false });
    const form = document.querySelector('#login-form');
    form.checkValidity = () => false;
    form.reportValidity = jest.fn();

    await expect(submitForm(form)).resolves.toBeUndefined();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('successful submit posts JSON and replaces navigation with /account', async () => {
    // LOGIN-INT-003: successful submit
    await loadPage();

    const usernameInput = document.querySelector('#username-login');
    const passwordInput = document.querySelector('#password-login');
    const form = document.querySelector('#login-form');

    usernameInput.value = '  user  ';
    passwordInput.value = 'Pass1234!';
    form.checkValidity = () => true;
    mockFetchResponse({ ok: true, status: 200, json: { user: { id: 1 } } });

    await submitForm(form);

    expect(global.fetch).toHaveBeenCalledWith('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'user', password: 'Pass1234!' })
    });
    expect(currentPath).toBe(ACCOUNT_ROUTE);
    expect(navigationType).toBe('REPLACE');
  });

  test('401 responses show the public invalid-credentials message without navigation', async () => {
    // LOGIN-INT-004: invalid credentials response
    await loadPage();
    const usernameInput = document.querySelector('#username-login');
    const passwordInput = document.querySelector('#password-login');
    const feedback = document.querySelector('#login-feedback');
    const form = document.querySelector('#login-form');

    usernameInput.value = 'user';
    passwordInput.value = 'Wrong1234!';
    form.checkValidity = () => true;
    mockFetchResponse({ ok: false, status: 401, json: { error: 'user exists' } });

    await submitForm(form);

    expect(feedback.textContent).toBe('Invalid username or password.');
    expect(['#b91c1c', 'rgb(185, 28, 28)']).toContain(feedback.style.color);
    expect(currentPath).toBe(HOME_ROUTE);
  });

  test('non-401 API errors use server data or the generic fallback', async () => {
    // LOGIN-INT-005: other API error responses
    await loadPage();
    const usernameInput = document.querySelector('#username-login');
    const passwordInput = document.querySelector('#password-login');
    const feedback = document.querySelector('#login-feedback');
    const form = document.querySelector('#login-form');

    usernameInput.value = 'user';
    passwordInput.value = 'Pass1234!';
    form.checkValidity = () => true;

    mockFetchResponse({
      ok: false,
      status: 500,
      json: { error: 'Authentication service unavailable.' }
    });
    await submitForm(form);
    expect(feedback.textContent).toBe('Authentication service unavailable.');
    expect(currentPath).toBe(HOME_ROUTE);

    mockFetchResponse({ ok: false, status: 500, jsonThrows: true });
    await submitForm(form);
    expect(feedback.textContent).toBe('Unable to login.');
    expect(currentPath).toBe(HOME_ROUTE);
  });

  test('network failures show an error without navigation', async () => {
    // LOGIN-INT-006: network failure
    await loadPage();
    const usernameInput = document.querySelector('#username-login');
    const passwordInput = document.querySelector('#password-login');
    const feedback = document.querySelector('#login-feedback');
    const form = document.querySelector('#login-form');

    usernameInput.value = 'user';
    passwordInput.value = 'Pass1234!';
    form.checkValidity = () => true;
    global.fetch.mockRejectedValue(new Error('Network down'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await submitForm(form);

    expect(feedback.textContent).toBe('Network error while attempting to login.');
    expect(['#b91c1c', 'rgb(185, 28, 28)']).toContain(feedback.style.color);
    expect(currentPath).toBe(HOME_ROUTE);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to login',
      expect.objectContaining({ message: 'Network down' })
    );
  });
});
