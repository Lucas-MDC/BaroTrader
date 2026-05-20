/** @jest-environment jsdom */
/**
 * This test suite covers the React registration component in minimal scenarios.
 * The tests are grouped together because they verify resilience when required
 * form elements are unavailable.
 */
import { jest } from '@jest/globals';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import Register from '../../src/frontend/pages/Register.jsx';

let root;

async function renderRegister() {
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);

  await act(async () => {
    root.render(createElement(Register));
  });
}

describe('register client bindings', () => {
  beforeEach(() => {
    jest.resetModules();
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

  test('missing #register-form does not crash the component', async () => {
    // REG-UNIT-003: missing bindings (client-side)
    document.body.innerHTML = '';

    await expect(renderRegister()).resolves.toBeUndefined();
    expect(document.querySelector('#register-form')).not.toBeNull();
  });

  test('missing username/password inputs show unavailable message', async () => {
    // REG-UNIT-003: missing bindings (client-side)
    await renderRegister();

    const form = document.querySelector('#register-form');
    document.querySelector('#username-email')?.remove();
    document.querySelector('#password-register')?.remove();

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    const feedback = document.querySelector('#register-feedback');
    expect(feedback.textContent).toBe('Registration form is unavailable.');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
