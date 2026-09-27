import { jest } from '@jest/globals';
import request from 'supertest';

const login = jest.fn();
const logout = jest.fn();

class SessionError extends Error {
  constructor(message, statusCode = 401) {
    super(message);
    this.name = 'SessionError';
    this.statusCode = statusCode;
  }
}

jest.unstable_mockModule('../../../src/services/session/sessionService.js', () => ({
  INVALID_CREDENTIALS_MESSAGE: 'Invalid username or password.',
  SessionError,
  login,
  logout
}));

const { createApp } = await import('../../../src/app.js');
const { getAuthConfig } = await import('../../../config/index.js');

describe('login API HTTP contract', () => {
  beforeEach(() => {
    login.mockReset();
    logout.mockReset();
  });

  test('returns 200 with a public user and a secure session cookie', async () => {
    // LOGIN-INT-007: login API HTTP contract
    login.mockResolvedValue({
      id: 42,
      username: 'user',
      createdAt: '2024-01-01T00:00:00.000Z',
      passwordHash: 'private-hash',
      passwordSalt: 'private-salt'
    });

    const response = await request(createApp())
      .post('/api/login')
      .send({ username: 'user', password: 'Pass1234!' });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body).toEqual({
      user: {
        id: 42,
        username: 'user',
        createdAt: '2024-01-01T00:00:00.000Z'
      }
    });
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(response.body.user.passwordSalt).toBeUndefined();

    const { jwtCookieName } = getAuthConfig();
    const [sessionCookie] = response.headers['set-cookie'];
    expect(sessionCookie).toContain(`${jwtCookieName}=`);
    expect(sessionCookie).toContain('HttpOnly');
    expect(sessionCookie).toContain('Secure');
    expect(sessionCookie).toContain('SameSite=Strict');
  });

  test('returns 401 with the public invalid-credentials response', async () => {
    // LOGIN-INT-007: login API HTTP contract
    login.mockRejectedValue(new SessionError('Invalid username or password.', 401));

    const response = await request(createApp())
      .post('/api/login')
      .send({ username: 'user', password: 'Wrong1234!' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid username or password.' });
    expect(response.body).not.toHaveProperty('user');
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  test('malformed or incomplete payloads cannot reach successful authentication', async () => {
    // LOGIN-INT-007: login API HTTP contract
    login.mockResolvedValue({ id: 1, username: 'unexpected', createdAt: 'now' });

    const incompleteResponse = await request(createApp())
      .post('/api/login')
      .send({ username: 'user' });
    expect(incompleteResponse.status).toBe(401);
    expect(incompleteResponse.body.user).toBeUndefined();
    expect(login).not.toHaveBeenCalled();

    const malformedResponse = await request(createApp())
      .post('/api/login')
      .set('Content-Type', 'application/json')
      .send('{"username":');
    expect(malformedResponse.status).toBe(400);
    expect(malformedResponse.body.user).toBeUndefined();
    expect(login).not.toHaveBeenCalled();
  });

  test('unexpected service errors return 500 without exposing details', async () => {
    // LOGIN-INT-007: login API HTTP contract
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    login.mockRejectedValue(new Error('database unavailable'));

    const response = await request(createApp())
      .post('/api/login')
      .send({ username: 'user', password: 'Pass1234!' });

    expect(response.status).toBe(500);
    expect(response.text).toBe('Internal server error');
    expect(response.text).not.toContain('database unavailable');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
