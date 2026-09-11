import { jest } from '@jest/globals';

const getAuthConfig = jest.fn();
const getUserModel = jest.fn();
const login = jest.fn();

class SessionError extends Error {
  constructor(message, statusCode = 401) {
    super(message);
    this.name = 'SessionError';
    this.statusCode = statusCode;
  }
}

jest.unstable_mockModule('../../../config/index.js', () => ({
  getAuthConfig
}));

jest.unstable_mockModule('../../../src/models/user/index.js', () => ({
  getUserModel
}));

jest.unstable_mockModule('../../../src/services/session/sessionService.js', () => ({
  INVALID_CREDENTIALS_MESSAGE: 'Invalid username or password.',
  SessionError,
  login
}));

const passport = (await import('passport')).default;
const { configurePassport } = await import('../../../src/auth/passport.js');

const authConfig = {
  jwtSecret: 'a-secret-that-is-long-enough-for-tests-123',
  jwtAlgorithm: 'HS256',
  jwtCookieName: 'test-session'
};

let localStrategy;
let jwtStrategy;

beforeAll(() => {
  getAuthConfig.mockReturnValue(authConfig);
  configurePassport();
  localStrategy = passport._strategies.local;
  jwtStrategy = passport._strategies.jwt;
});

beforeEach(() => {
  login.mockReset();
  getUserModel.mockReset();
});

describe('Passport local strategy', () => {
  test('delegates credentials to login and returns the authenticated user', async () => {
    // LOGIN-UNIT-012: local strategy delegation
    const user = { id: 1, username: 'user', createdAt: 'now' };
    const done = jest.fn();
    login.mockResolvedValue(user);

    await localStrategy._verify('user', 'Pass1234!', done);

    expect(login).toHaveBeenCalledWith({ username: 'user', password: 'Pass1234!' });
    expect(done).toHaveBeenCalledWith(null, user);
  });

  test('maps SessionError to authentication info', async () => {
    // LOGIN-UNIT-012: local strategy error info
    const done = jest.fn();
    login.mockRejectedValue(new SessionError('Invalid username or password.', 401));

    await localStrategy._verify('user', 'Wrong1234!', done);

    expect(done).toHaveBeenCalledWith(null, false, {
      message: 'Invalid username or password.',
      statusCode: 401
    });
  });

  test('passes dependency errors to Passport', async () => {
    // LOGIN-UNIT-012: local strategy error propagation
    const done = jest.fn();
    const error = new Error('database unavailable');
    login.mockRejectedValue(error);

    await localStrategy._verify('user', 'Pass1234!', done);

    expect(done).toHaveBeenCalledWith(error);
  });
});

describe('Passport JWT strategy', () => {
  test('rejects invalid user ids and unknown users', async () => {
    // LOGIN-UNIT-012: JWT rejection and lookup
    const invalidIdDone = jest.fn();
    await jwtStrategy._verify({ sub: 'not-an-id' }, invalidIdDone);
    expect(invalidIdDone).toHaveBeenCalledWith(null, false);

    const unknownUserDone = jest.fn();
    getUserModel.mockReturnValue({ findById: jest.fn().mockResolvedValue(null) });
    await jwtStrategy._verify({ sub: '99' }, unknownUserDone);
    expect(unknownUserDone).toHaveBeenCalledWith(null, false);
  });

  test('looks up valid ids and maps the user to public fields', async () => {
    // LOGIN-UNIT-012: JWT lookup and public-user mapping
    const done = jest.fn();
    const user = {
      id: 7,
      username: 'user',
      createdAt: 'now',
      passwordHash: 'private-hash',
      passwordSalt: 'private-salt'
    };
    const findById = jest.fn().mockResolvedValue(user);
    getUserModel.mockReturnValue({ findById });

    await jwtStrategy._verify({ sub: '7' }, done);

    expect(findById).toHaveBeenCalledWith(7);
    expect(done).toHaveBeenCalledWith(null, {
      id: 7,
      username: 'user',
      createdAt: 'now'
    });
  });

  test('passes JWT lookup errors to Passport', async () => {
    // LOGIN-UNIT-012: JWT error propagation
    const done = jest.fn();
    const error = new Error('database unavailable');
    getUserModel.mockReturnValue({ findById: jest.fn().mockRejectedValue(error) });

    await jwtStrategy._verify({ sub: '7' }, done);

    expect(done).toHaveBeenCalledWith(error);
  });
});
