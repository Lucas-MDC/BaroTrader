import { createIntegrationDbHarness } from './support/dbHarness.js';

/**
 * Esta suite cobre o servico de cadastro integrado ao banco de dados real.
 * Os testes estao juntos porque validam o comportamento macro de registerUser
 * com persistencia real: criacao do usuario, hashing/salt armazenados, duplicidade e validacao.
 */
const harness = createIntegrationDbHarness({
  suiteName: 'register-service-db-integration'
});

let registerUser;
let RegistrationError;
let getUserModel;

beforeAll(async () => {
  await harness.setup();

  ({ registerUser, RegistrationError } = await import(
    '../../src/services/register/registerService.js'
  ));
  ({ getUserModel } = await import('../../src/models/user/index.js'));
});

afterAll(async () => {
  await harness.teardown();
});

describe('register service DB integration', () => {
  test('persists user data with password hash and salt', async () => {
    // REG-INT-019: register service persistence with real DB
    const username = `svc${Date.now()}`;
    const password = 'Pass1234!';

    const created = await registerUser({
      username: `  ${username}  `,
      password
    });

    expect(created).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        username
      })
    );
    expect(created.passwordHash).toMatch(/^[a-f0-9]{128}$/);
    expect(created.passwordSalt).toMatch(/^[a-f0-9]{32}$/);

    const persisted = await getUserModel().findByUsername(username);
    expect(persisted).toEqual(
      expect.objectContaining({
        id: created.id,
        username,
        passwordHash: created.passwordHash,
        passwordSalt: created.passwordSalt
      })
    );
  });

  test('duplicate usernames return RegistrationError 409', async () => {
    // REG-INT-020: register service duplicate handling with real DB
    const username = `svcdup${Date.now()}`;
    const password = 'Pass1234!';

    await registerUser({ username, password });

    await expect(registerUser({ username, password })).rejects.toEqual(
      expect.objectContaining({
        name: 'RegistrationError',
        statusCode: 409,
        message: 'User already exists.'
      })
    );

    await expect(registerUser({ username, password })).rejects.toBeInstanceOf(
      RegistrationError
    );
  });

  test('invalid payload returns RegistrationError 400', async () => {
    // REG-INT-021: register service validation with real DB
    await expect(
      registerUser({ username: '', password: 'Pass1234!' })
    ).rejects.toEqual(
      expect.objectContaining({
        name: 'RegistrationError',
        statusCode: 400,
        message: 'Username or password is invalid.'
      })
    );
  });
});
