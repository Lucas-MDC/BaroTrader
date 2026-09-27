import { jest } from '@jest/globals';

const getAuthConfig = jest.fn();
const getUserModel = jest.fn();
const hashPassword = jest.fn();
const sleep = jest.fn(() => Promise.resolve());

jest.unstable_mockModule('../../../config/index.js', () => ({
  getAuthConfig
}));

jest.unstable_mockModule('../../../src/models/user/index.js', () => ({
  getUserModel
}));

jest.unstable_mockModule('../../../src/services/register/passwordService.js', () => ({
  hashPassword
}));

jest.unstable_mockModule('../../../src/services/register/sleep.js', () => ({
  sleep
}));

const {
  INVALID_CREDENTIALS_MESSAGE,
  SessionError,
  login
} = await import('../../../src/services/session/sessionService.js');

const authConfig = { loginResponseDeadlineMs: 0 };
const persistedUser = {
  id: 7,
  username: 'user',
  passwordHash: 'a'.repeat(128),
  passwordSalt: 'persisted-salt',
  createdAt: '2024-01-01T00:00:00.000Z'
};

let userModel;

beforeEach(() => {
  getAuthConfig.mockReset();
  getAuthConfig.mockReturnValue({ ...authConfig });
  getUserModel.mockReset();
  hashPassword.mockReset();
  sleep.mockReset();
  sleep.mockImplementation(() => Promise.resolve());

  userModel = {
    findByUsername: jest.fn().mockResolvedValue({ ...persistedUser })
  };
  getUserModel.mockReturnValue(userModel);
  hashPassword.mockResolvedValue('a'.repeat(128));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('SessionError', () => {
  test('has the expected shape', () => {
    // LOGIN-UNIT-009: SessionError shape
    const error = new SessionError('Authentication failed.');

    expect(error.name).toBe('SessionError');
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Authentication failed.');
  });
});

describe('login service normalization and validation', () => {
  test('trims the username before lookup and the password before hashing', async () => {
    // LOGIN-UNIT-005 and LOGIN-UNIT-006: normalization and password verification
    await expect(
      login({ username: '  user  ', password: '  Pass1234!  ' })
    ).resolves.toEqual({
      id: 7,
      username: 'user',
      createdAt: '2024-01-01T00:00:00.000Z'
    });

    expect(userModel.findByUsername).toHaveBeenCalledWith('user');
    expect(hashPassword).toHaveBeenCalledWith('Pass1234!', 'persisted-salt');
  });

  test('rejects non-string or empty credentials as invalid credentials', async () => {
    // LOGIN-UNIT-005: login service normalization and validation
    await expect(login({ username: 123, password: 'Pass1234!' })).rejects.toMatchObject({
      name: 'SessionError',
      statusCode: 401,
      message: INVALID_CREDENTIALS_MESSAGE
    });
    await expect(login({ username: 'user', password: '   ' })).rejects.toMatchObject({
      name: 'SessionError',
      statusCode: 401,
      message: INVALID_CREDENTIALS_MESSAGE
    });

    expect(userModel.findByUsername).not.toHaveBeenCalled();
    expect(hashPassword).not.toHaveBeenCalled();
  });
});

describe('login service password verification', () => {
  test('returns only public fields when the password matches', async () => {
    // LOGIN-UNIT-006: login service password verification
    await expect(login({ username: 'user', password: 'Pass1234!' })).resolves.toEqual({
      id: 7,
      username: 'user',
      createdAt: '2024-01-01T00:00:00.000Z'
    });
  });

  test('rejects a non-matching password with public invalid credentials', async () => {
    // LOGIN-UNIT-006: login service password verification
    hashPassword.mockResolvedValue('b'.repeat(128));

    await expect(login({ username: 'user', password: 'Wrong1234!' })).rejects.toMatchObject({
      name: 'SessionError',
      statusCode: 401,
      message: INVALID_CREDENTIALS_MESSAGE
    });
  });
});

describe('login service unknown-user handling', () => {
  test('uses the dummy password path and returns the same public error', async () => {
    // LOGIN-UNIT-007: login service unknown-user handling
    userModel.findByUsername.mockResolvedValue(null);

    await expect(login({ username: 'unknown', password: 'Wrong1234!' })).rejects.toMatchObject({
      name: 'SessionError',
      statusCode: 401,
      message: INVALID_CREDENTIALS_MESSAGE
    });

    expect(hashPassword).toHaveBeenCalledWith(
      'invalid-password',
      '00000000000000000000000000000000'
    );
  });
});

describe('login service error propagation', () => {
  test('findByUsername errors bubble up', async () => {
    // LOGIN-UNIT-008: login service error propagation
    const error = new Error('lookup failed');
    userModel.findByUsername.mockRejectedValue(error);

    await expect(login({ username: 'user', password: 'Pass1234!' })).rejects.toBe(error);
  });

  test('hashPassword errors bubble up', async () => {
    // LOGIN-UNIT-008: login service error propagation
    const error = new Error('hash failed');
    hashPassword.mockRejectedValue(error);

    await expect(login({ username: 'user', password: 'Pass1234!' })).rejects.toBe(error);
  });
});

describe('login service response deadline', () => {
  test('does not resolve before the deadline on a successful login', async () => {
    // LOGIN-UNIT-008: login service response deadline
    jest.useFakeTimers();
    sleep.mockImplementation((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    getAuthConfig.mockReturnValue({ loginResponseDeadlineMs: 500 });

    let completed = false;
    const promise = login({ username: 'user', password: 'Pass1234!' }).then(() => {
      completed = true;
    });

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(sleep).toHaveBeenCalledWith(500);
    expect(completed).toBe(false);

    await jest.advanceTimersByTimeAsync(499);
    expect(completed).toBe(false);

    await jest.advanceTimersByTimeAsync(1);
    await promise;
    expect(completed).toBe(true);
  });

  test('does not reject before the deadline on an unsuccessful login', async () => {
    // LOGIN-UNIT-008: login service response deadline
    jest.useFakeTimers();
    sleep.mockImplementation((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    getAuthConfig.mockReturnValue({ loginResponseDeadlineMs: 300 });
    hashPassword.mockResolvedValue('different-hash');

    let completed = false;
    const promise = login({ username: 'user', password: 'Wrong1234!' }).catch(() => {
      completed = true;
    });

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(sleep).toHaveBeenCalledWith(300);
    expect(completed).toBe(false);

    await jest.advanceTimersByTimeAsync(300);
    await promise;
    expect(completed).toBe(true);
  });

  test('a zero deadline does not call sleep', async () => {
    // LOGIN-UNIT-008: zero loginResponseDeadlineMs
    await login({ username: 'user', password: 'Pass1234!' });

    expect(sleep).not.toHaveBeenCalled();
  });
});
