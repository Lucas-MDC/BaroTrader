import { jest } from '@jest/globals';
import request from 'supertest';

/**
 * Esta suite cobre o contrato HTTP da API de cadastro sem depender do backend real.
 * Os testes ficam juntos porque verificam como a rota traduz respostas e erros do
 * servico em status, headers e payloads JSON observaveis pelo cliente.
 */
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

const { createApp } = await import('../../src/app.js');

describe('register API HTTP contract', () => {
  beforeEach(() => {
    registerUser.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns 201 with id, username, createdAt only', async () => {
    // REG-INT-016: register API HTTP contract
    const app = createApp();
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
    // REG-INT-016: register API HTTP contract
    const app = createApp();
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
    // REG-INT-016: register API HTTP contract
    const app = createApp();
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
    // REG-INT-016: register API HTTP contract
    const app = createApp();
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
    // REG-INT-016: register API HTTP contract
    const app = createApp();
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
    // REG-INT-016: register API HTTP contract
    const app = createApp();
    const error = new Error('unexpected');
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      registerUser.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/register')
        .send({ username: 'user', password: 'Pass1234!' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to register user.' });
      expect(consoleSpy).toHaveBeenCalled();
    } finally {
      consoleSpy.mockRestore();
    }
  });

  test('parses JSON bodies correctly', async () => {
    // REG-INT-016: register API HTTP contract
    const app = createApp();
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
    // REG-INT-016: register API HTTP contract
    const app = createApp();
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
    // REG-INT-016: register API HTTP contract
    const app = createApp();

    const response = await request(app)
      .post('/api/register')
      .set('Content-Type', 'application/json')
      .send('{"username":');

    expect(response.status).toBe(400);
    expect(registerUser).not.toHaveBeenCalled();
  });

  test('extra fields are ignored by the route', async () => {
    // REG-INT-016: register API HTTP contract
    const app = createApp();
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
    // REG-INT-016: register API HTTP contract
    const app = createApp();
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
