/** @jest-environment jsdom */

import { jest } from '@jest/globals';
import { TextDecoder, TextEncoder } from 'node:util';

global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

let root;
let act;
let currentPath;
let currentSearch;
let currentHash;
let currentState;

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

function mockResponse({ status = 200, ok = true, data = {} } = {}) {
  return {
    status,
    ok,
    json: jest.fn().mockResolvedValue(data)
  };
}

async function renderAt(path) {
  const react = await import('react');
  const reactDom = await import('react-dom/client');
  const { MemoryRouter, useLocation } = await import('react-router-dom');
  const { default: App } = await import('../../../src/frontend/App.jsx');
  const { AuthProvider } = await import('../../../src/frontend/shared/authContext.jsx');

  act = react.act;
  const container = document.createElement('div');
  document.body.append(container);
  root = reactDom.createRoot(container);

  function RouterObserver() {
    const location = useLocation();
    currentPath = location.pathname;
    currentSearch = location.search;
    currentHash = location.hash;
    currentState = location.state;
    return null;
  }

  await act(async () => {
    root.render(
      react.createElement(
        MemoryRouter,
        { initialEntries: [path] },
        react.createElement(
          AuthProvider,
          null,
          react.createElement(App),
          react.createElement(RouterObserver)
        )
      )
    );
    await flushPromises();
  });
}

async function submitLogin() {
  const form = document.querySelector('#login-form');
  document.querySelector('#username-login').value = 'user';
  document.querySelector('#password-login').value = 'Pass1234!';
  form.checkValidity = () => true;

  await act(async () => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushPromises();
  });
}

describe('authenticated SPA routes', () => {
  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    global.fetch = jest.fn();
  });

  afterEach(async () => {
    if (root && act) {
      await act(async () => root.unmount());
    }

    root = undefined;
    act = undefined;
    currentPath = undefined;
    currentSearch = undefined;
    currentHash = undefined;
    currentState = undefined;
    jest.restoreAllMocks();
    delete global.fetch;
    delete global.IS_REACT_ACT_ENVIRONMENT;
    document.body.innerHTML = '';
  });

  test('redirects an unauthenticated account visit to login and returns after login', async () => {
    global.fetch
      .mockResolvedValueOnce(mockResponse({
        status: 401,
        ok: false,
        data: { error: 'Authentication required.' }
      }))
      .mockResolvedValueOnce(mockResponse({
        data: { user: { id: 1, username: 'user' } }
      }));

    await renderAt('/account?sort=volume#overview');

    expect(currentPath).toBe('/login');
    expect(currentState.from).toMatchObject({
      pathname: '/account',
      search: '?sort=volume',
      hash: '#overview'
    });
    expect(document.querySelector('#login-form')).not.toBeNull();
    expect(document.querySelector('#logout-button')).toBeNull();

    await submitLogin();

    expect(currentPath).toBe('/account');
    expect(currentSearch).toBe('?sort=volume');
    expect(currentHash).toBe('#overview');
    expect(document.querySelector('#logout-button')).not.toBeNull();
  });

  test('redirects an authenticated visit to login to account', async () => {
    global.fetch.mockResolvedValueOnce(mockResponse({
      data: { user: { id: 1, username: 'user' } }
    }));

    await renderAt('/login');

    expect(currentPath).toBe('/account');
    expect(document.querySelector('#logout-button')).not.toBeNull();
    expect(document.querySelector('#login-form')).toBeNull();
  });

  test('does not render account when the session check fails', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network down'));

    await renderAt('/account');

    expect(currentPath).toBe('/account');
    expect(document.querySelector('#logout-button')).toBeNull();
    expect(document.querySelector('#login-form')).toBeNull();
    expect(document.body.textContent).toContain('Unable to check your session.');
  });

  test('returns to login when a protected API rejects the active session', async () => {
    global.fetch
      .mockResolvedValueOnce(mockResponse({
        data: { user: { id: 1, username: 'user' } }
      }))
      .mockResolvedValueOnce(mockResponse({
        status: 401,
        ok: false,
        data: { error: 'Authentication required.' }
      }));

    await renderAt('/account');
    expect(currentPath).toBe('/account');

    const { fetchAuthenticated } = await import(
      '../../../src/frontend/shared/sessionClient.js'
    );
    await act(async () => {
      await fetchAuthenticated('/api/private-data');
      await flushPromises();
    });

    expect(currentPath).toBe('/login');
    expect(document.querySelector('#login-form')).not.toBeNull();
    expect(document.querySelector('#logout-button')).toBeNull();
  });
});
