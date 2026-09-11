import { jest } from '@jest/globals';

const { getLoginErrorMessage, loginUser } = await import(
  '../../../src/frontend/shared/sessionClient.js'
);

describe('session client', () => {
  afterEach(() => {
    delete global.fetch;
  });

  test('loginUser sends a JSON POST request and returns the response', async () => {
    // LOGIN-UNIT-002: loginUser request construction
    const response = {
      status: 200,
      ok: true,
      json: jest.fn().mockResolvedValue({ user: { id: 1 } })
    };
    global.fetch = jest.fn().mockResolvedValue(response);

    const result = await loginUser({ username: 'user', password: 'Pass1234!' });

    expect(global.fetch).toHaveBeenCalledWith('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'user', password: 'Pass1234!' })
    });
    expect(result).toEqual({
      response,
      data: { user: { id: 1 } }
    });
  });

  test('loginUser returns an empty object when the response has no JSON body', async () => {
    // LOGIN-UNIT-003: loginUser response parsing
    const response = {
      status: 204,
      ok: true,
      json: jest.fn().mockRejectedValue(new Error('No content'))
    };
    global.fetch = jest.fn().mockResolvedValue(response);

    await expect(loginUser({ username: 'user', password: 'Pass1234!' })).resolves.toEqual({
      response,
      data: {}
    });
  });

  test('getLoginErrorMessage returns the public invalid-credentials message for 401', () => {
    // LOGIN-UNIT-004: getLoginErrorMessage
    expect(getLoginErrorMessage({ status: 401, ok: false }, {})).toBe(
      'Invalid username or password.'
    );
  });

  test('getLoginErrorMessage uses a server error when available', () => {
    // LOGIN-UNIT-004: getLoginErrorMessage
    expect(
      getLoginErrorMessage({ status: 500, ok: false }, { error: 'Service unavailable.' })
    ).toBe('Service unavailable.');
  });

  test('getLoginErrorMessage falls back for an error without a message', () => {
    // LOGIN-UNIT-004: getLoginErrorMessage
    expect(getLoginErrorMessage({ status: 500, ok: false }, {})).toBe('Unable to login.');
  });

  test('getLoginErrorMessage returns no error for an ok response', () => {
    // LOGIN-UNIT-004: getLoginErrorMessage
    expect(getLoginErrorMessage({ status: 200, ok: true }, {})).toBe('');
  });
});
