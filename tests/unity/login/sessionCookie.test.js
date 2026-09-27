import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

const getAuthConfig = jest.fn();

jest.unstable_mockModule('../../../config/index.js', () => ({
  getAuthConfig
}));

const {
  clearSessionCookie,
  issueSessionCookie
} = await import('../../../src/services/session/sessionCookie.js');

const authConfig = {
  jwtSecret: 'a-secret-that-is-long-enough-for-tests-123',
  jwtAlgorithm: 'HS256',
  jwtExpiresInSeconds: 1800,
  jwtCookieName: '__Host-test-session',
  cookieHttpOnly: true,
  cookieSecure: true,
  cookieSameSite: 'strict'
};

beforeEach(() => {
  getAuthConfig.mockReset();
  getAuthConfig.mockReturnValue({ ...authConfig });
});

describe('session cookie', () => {
  test('issues a signed cookie with public JWT claims and secure options', () => {
    // LOGIN-UNIT-010: session cookie issuance
    const response = { cookie: jest.fn() };
    const user = {
      id: 42,
      username: 'user',
      createdAt: '2024-01-01T00:00:00.000Z',
      passwordHash: 'hash-must-not-leak',
      passwordSalt: 'salt-must-not-leak'
    };

    issueSessionCookie(response, user);

    const [cookieName, token, options] = response.cookie.mock.calls[0];
    const claims = jwt.verify(token, authConfig.jwtSecret, {
      algorithms: [authConfig.jwtAlgorithm]
    });

    expect(cookieName).toBe(authConfig.jwtCookieName);
    expect(claims).toEqual(
      expect.objectContaining({ username: 'user', sub: '42' })
    );
    expect(claims.passwordHash).toBeUndefined();
    expect(claims.passwordSalt).toBeUndefined();
    expect(options).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 1800000,
      path: '/'
    });
  });

  test('clears the configured cookie while preserving security attributes', () => {
    // LOGIN-UNIT-011: session cookie clearing
    const response = { clearCookie: jest.fn() };

    clearSessionCookie(response);

    expect(response.clearCookie).toHaveBeenCalledWith(authConfig.jwtCookieName, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });
  });
});
