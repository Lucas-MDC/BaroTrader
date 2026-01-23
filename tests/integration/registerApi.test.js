import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const registerUser = jest.fn();

class RegistrationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'RegistrationError';
    this.statusCode = statusCode;
  }
}

jest.unstable_mockModule('../../src/services/register/registerService.js', () => ({
  registerUser,
  RegistrationError
}));

const registerRouter = (await import('../../src/services/register/register.js'))
  .default;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use('/api', registerRouter);
  return app;
}

describe('register API integration', () => {
  beforeEach(() => {
    registerUser.mockReset();
  });

  test('returns 201 with id, username, createdAt only', async () => {
    const app = buildApp();
    registerUser.mockResolvedValue({
      id: 42,
      username: 'user',
      createdAt: '2024-01-01T00:00:00.000Z',
      passwordHash: 'hash',
      passwordSalt: 'salt'
    });

    const response = await request(app)
      .post('/api/register')
      .send({ username: 'user', password: 'Pass1234!' });

    expect(response.status).toBe(201);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body).toEqual({
      id: 42,
      username: 'user',
      createdAt: '2024-01-01T00:00:00.000Z'
    });
    expect(response.body.passwordHash).toBeUndefined();
    expect(response.body.passwordSalt).toBeUndefined();
  });

  test('empty body returns 400 with invalid message', async () => {
    const app = buildApp();
    registerUser.mockRejectedValue(
      new RegistrationError('Username or password is invalid.', 400)
    );

    const response = await request(app).post('/api/register').send({});

    expect(response.status).toBe(400);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body).toEqual({
      error: 'Username or password is invalid.'
    });
  });

  test('empty username returns 400 with invalid message', async () => {
    const app = buildApp();
    registerUser.mockRejectedValue(
      new RegistrationError('Username or password is invalid.', 400)
    );

    const response = await request(app)
      .post('/api/register')
      .send({ username: '', password: 'Pass1234!' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Username or password is invalid.'
    });
  });

  test('empty password returns 400 with invalid message', async () => {
    const app = buildApp();
    registerUser.mockRejectedValue(
      new RegistrationError('Username or password is invalid.', 400)
    );

    const response = await request(app)
      .post('/api/register')
      .send({ username: 'user', password: '' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Username or password is invalid.'
    });
  });

  test('duplicate user returns 409 with duplicate message', async () => {
    const app = buildApp();
    registerUser.mockRejectedValue(
      new RegistrationError('User already exists.', 409)
    );

    const response = await request(app)
      .post('/api/register')
      .send({ username: 'user', password: 'Pass1234!' });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'User already exists.' });
  });

  test('unknown errors return 500 and log the failure', async () => {
    const app = buildApp();
    const error = new Error('unexpected');
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    registerUser.mockRejectedValue(error);

    const response = await request(app)
      .post('/api/register')
      .send({ username: 'user', password: 'Pass1234!' });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to register user.' });
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test('parses JSON bodies correctly', async () => {
    const app = buildApp();
    registerUser.mockResolvedValue({ id: 1, username: 'user', createdAt: 'now' });

    await request(app)
      .post('/api/register')
      .send({ username: 'user', password: 'Pass1234!' });

    expect(registerUser).toHaveBeenCalledWith({
      username: 'user',
      password: 'Pass1234!'
    });
  });

  test('parses urlencoded bodies correctly', async () => {
    const app = buildApp();
    registerUser.mockResolvedValue({ id: 1, username: 'user', createdAt: 'now' });

    await request(app)
      .post('/api/register')
      .type('form')
      .send({ username: 'user', password: 'Pass1234!' });

    expect(registerUser).toHaveBeenCalledWith({
      username: 'user',
      password: 'Pass1234!'
    });
  });

  test('invalid JSON returns 400 before reaching the route', async () => {
    const app = buildApp();

    const response = await request(app)
      .post('/api/register')
      .set('Content-Type', 'application/json')
      .send('{"username":');

    expect(response.status).toBe(400);
    expect(registerUser).not.toHaveBeenCalled();
  });

  test('extra fields are ignored by the route', async () => {
    const app = buildApp();
    registerUser.mockResolvedValue({ id: 1, username: 'user', createdAt: 'now' });

    await request(app)
      .post('/api/register')
      .send({
        username: 'user',
        password: 'Pass1234!',
        extra: 'ignore-me'
      });

    expect(registerUser).toHaveBeenCalledWith({
      username: 'user',
      password: 'Pass1234!'
    });
  });

  test('RegistrationError without statusCode returns 400', async () => {
    const app = buildApp();
    const error = new RegistrationError('Missing code');
    delete error.statusCode;
    registerUser.mockRejectedValue(error);

    const response = await request(app)
      .post('/api/register')
      .send({ username: 'user', password: 'Pass1234!' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Missing code' });
  });
});

