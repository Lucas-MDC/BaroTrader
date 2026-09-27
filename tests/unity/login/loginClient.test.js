/** @jest-environment jsdom */

import { jest } from '@jest/globals';
import { TextDecoder, TextEncoder } from 'node:util';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';

global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

let root;
let MemoryRouter;
let Home;

beforeAll(async () => {
  ({ MemoryRouter } = await import('react-router-dom'));
  ({ default: Home } = await import('../../../src/frontend/pages/Home.jsx'));
});

async function renderHome() {
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);

  await act(async () => {
    root.render(
      createElement(
        MemoryRouter,
        { initialEntries: ['/'] },
        createElement(Home)
      )
    );
  });
}

describe('login client bindings', () => {
  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    global.fetch = jest.fn();
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root.unmount();
      });
      root = undefined;
    }

    delete global.fetch;
    delete global.IS_REACT_ACT_ENVIRONMENT;
    document.body.innerHTML = '';
  });

  test('rendering without #login-form does not crash the component', async () => {
    // LOGIN-UNIT-001: missing bindings (client-side)
    await expect(renderHome()).resolves.toBeUndefined();
    document.querySelector('#login-form')?.remove();

    expect(document.querySelector('#login-form')).toBeNull();
  });

  test('missing username or password inputs show the unavailable message', async () => {
    // LOGIN-UNIT-001: missing bindings (client-side)
    await renderHome();

    const form = document.querySelector('#login-form');
    document.querySelector('#username-login')?.remove();
    document.querySelector('#password-login')?.remove();

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(document.querySelector('#login-feedback').textContent).toBe(
      'Login form is unavailable.'
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
