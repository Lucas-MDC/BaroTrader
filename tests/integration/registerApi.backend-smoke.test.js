import request from 'supertest';
import { createIntegrationDbHarness } from './support/dbHarness.js';

/**
 * This test suite covers a smoke test for the registration endpoint with a real 
 * backend and database. The tests are grouped here because they validate the API's
 * minimal integrated path, including persistence, duplicate handling, and rejection 
 * of invalid payloads.
 */
const harness = createIntegrationDbHarness({
  suiteName: 'register-api-backend-smoke'
});

let createApp;
let getUserModel;

beforeAll(async () => {
  await harness.setup();

  ({ createApp } = await import('../../src/app.js'));
  ({ getUserModel } = await import('../../src/models/user/index.js'));
});

afterAll(async () => {
  await harness.teardown();
});

describe('register API backend smoke', () => {
  test('POST /api/register returns 201 and persists user', async () => {
    // REG-INT-017: register API backend smoke with real DB
    const app = createApp();
    const username = `api${Date.now()}`;
    const password = 'Pass1234!';

    const response = await request(app)
      .post('/api/register')
      .send({ username, password });

    expect(response.status).toBe(201);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        username,
        createdAt: expect.any(String)
      })
    );
    expect(response.body.passwordHash).toBeUndefined();
    expect(response.body.passwordSalt).toBeUndefined();

    const persisted = await getUserModel().findByUsername(username);
    expect(persisted).toEqual(
      expect.objectContaining({
        id: response.body.id,
        username,
        passwordHash: expect.any(String),
        passwordSalt: expect.any(String)
      })
    );
  });

  test('duplicate registration returns 409', async () => {
    // REG-INT-017: register API backend smoke with real DB
    const app = createApp();
    const username = `dup${Date.now()}`;
    const password = 'Pass1234!';

    const first = await request(app)
      .post('/api/register')
      .send({ username, password });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/register')
      .send({ username, password });

    expect(second.status).toBe(409);
    expect(second.body).toEqual({ error: 'User already exists.' });
  });

  test('invalid payload returns 400', async () => {
    // REG-INT-018: register API invalid payload on real backend
    const app = createApp();

    const response = await request(app)
      .post('/api/register')
      .send({ username: '', password: 'Pass1234!' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Username or password is invalid.'
    });
  });
});
