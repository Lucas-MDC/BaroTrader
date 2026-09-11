import { getAuthConfig } from '../../../config/index.js';
import { createIntegrationDbHarness } from '../support/dbHarness.js';

const harness = createIntegrationDbHarness({
  suiteName: 'login-service-db-integration'
});
const dbHookTimeoutMs = 60000;

let login;
let registerUser;

beforeAll(async () => {
  await harness.setup();

  ({ login } = await import('../../../src/services/session/sessionService.js'));
  ({ registerUser } = await import('../../../src/services/register/registerService.js'));
}, dbHookTimeoutMs);

afterAll(async () => {
  await harness.teardown();
}, dbHookTimeoutMs);

describe('login service DB integration', () => {
  test('authenticates a user persisted by the registration service', async () => {
    // LOGIN-INT-008: login service with real DB
    const username = `login${Date.now()}`;
    const password = 'Pass1234!';

    await registerUser({ username, password });
    const authenticated = await login({ username, password });

    expect(authenticated).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        username
      })
    );
    expect(authenticated.createdAt).toBeTruthy();
    expect(authenticated.passwordHash).toBeUndefined();
    expect(authenticated.passwordSalt).toBeUndefined();
  });

  test('uses the same public failure for a wrong password and unknown user', async () => {
    // LOGIN-INT-009: wrong password with real DB
    const username = `wrong${Date.now()}`;
    const password = 'Pass1234!';

    await registerUser({ username, password });

    const wrongPasswordError = await login({
      username,
      password: 'Wrong1234!'
    }).catch((error) => error);
    const unknownUserError = await login({
      username: `${username}unknown`,
      password: 'Wrong1234!'
    }).catch((error) => error);

    expect(wrongPasswordError).toMatchObject({
      name: 'SessionError',
      statusCode: 401,
      message: 'Invalid username or password.'
    });
    expect(unknownUserError).toMatchObject({
      name: 'SessionError',
      statusCode: 401,
      message: 'Invalid username or password.'
    });
    expect(wrongPasswordError).not.toHaveProperty('user');
    expect(unknownUserError).not.toHaveProperty('user');
  });

  test('honors the configured response deadline for success and failure', async () => {
    // LOGIN-INT-010: login minimum response deadline
    const { loginResponseDeadlineMs } = getAuthConfig();
    const username = `deadline${Date.now()}`;
    const password = 'Pass1234!';
    await registerUser({ username, password });

    const successStartedAt = Date.now();
    await login({ username, password });
    const successElapsed = Date.now() - successStartedAt;

    const failureStartedAt = Date.now();
    await login({ username, password: 'Wrong1234!' }).catch(() => {});
    const failureElapsed = Date.now() - failureStartedAt;

    const timingToleranceMs = 10;
    expect(successElapsed).toBeGreaterThanOrEqual(
      Math.max(0, loginResponseDeadlineMs - timingToleranceMs)
    );
    expect(failureElapsed).toBeGreaterThanOrEqual(
      Math.max(0, loginResponseDeadlineMs - timingToleranceMs)
    );
  });

  test('completes without an extra wait when the deadline is zero', async () => {
    // LOGIN-INT-010: zero loginResponseDeadlineMs
    const previousDeadline = process.env.BAROTRADER_LOGIN_RESPONSE_DEADLINE_MS;
    process.env.BAROTRADER_LOGIN_RESPONSE_DEADLINE_MS = '0';

    try {
      const username = `zero${Date.now()}`;
      await registerUser({ username, password: 'Pass1234!' });

      const startedAt = Date.now();
      await login({ username, password: 'Pass1234!' });
      const elapsed = Date.now() - startedAt;

      expect(elapsed).toBeLessThan(1000);
    } finally {
      if (previousDeadline === undefined) {
        delete process.env.BAROTRADER_LOGIN_RESPONSE_DEADLINE_MS;
      } else {
        process.env.BAROTRADER_LOGIN_RESPONSE_DEADLINE_MS = previousDeadline;
      }
    }
  });
});
