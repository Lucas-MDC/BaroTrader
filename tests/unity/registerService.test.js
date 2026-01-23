import { jest } from '@jest/globals';

const getRegisterConfig = jest.fn();
const getUserModel = jest.fn();
const sleep = jest.fn(() => Promise.resolve());
const createPasswordSalt = jest.fn();
const hashPassword = jest.fn();

jest.unstable_mockModule('../../config/index.js', () => ({
  getRegisterConfig
}));

jest.unstable_mockModule('../../src/models/user/index.js', () => ({
  getUserModel
}));

jest.unstable_mockModule('../../src/utils/database_utils.js', () => ({
  sleep
}));

jest.unstable_mockModule('../../src/services/register/passwordService.js', () => ({
  createPasswordSalt,
  hashPassword
}));

const { registerUser, RegistrationError } = await import(
  '../../src/services/register/registerService.js'
);

const baseConfig = {
  registerMinDelayMs: 0,
  usernameRegex: /^[a-z]+$/,
  passwordRegex: /^[a-z0-9]+$/i,
  usernameMinLength: 3,
  usernameMaxLength: 5,
  passwordMinLength: 3,
  passwordMaxLength: 5
};

const flushPromises = () => new Promise((resolve) => process.nextTick(resolve));

let userModel;

beforeEach(() => {
  getRegisterConfig.mockReset();
  getUserModel.mockReset();
  sleep.mockImplementation(() => Promise.resolve());
  createPasswordSalt.mockReset();
  hashPassword.mockReset();

  userModel = {
    findByUsername: jest.fn().mockResolvedValue(null),
    createUser: jest.fn().mockResolvedValue({
      id: 1,
      username: 'user',
      createdAt: '2024-01-01T00:00:00.000Z'
    })
  };

  getUserModel.mockReturnValue(userModel);
  getRegisterConfig.mockReturnValue({ ...baseConfig });
  createPasswordSalt.mockReturnValue('salt');
  hashPassword.mockResolvedValue('hash');
});

describe('RegistrationError', () => {
  test('has the expected shape', () => {
    const error = new RegistrationError('Bad input');
    expect(error.name).toBe('RegistrationError');
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Bad input');
  });
});

describe('registerUser validation and normalization', () => {
  test('trims username before validation', async () => {
    getRegisterConfig.mockReturnValue({
      ...baseConfig,
      usernameMinLength: 3,
      usernameMaxLength: 3,
      usernameRegex: /^[a-z]{3}$/,
      passwordMinLength: 3,
      passwordMaxLength: 3,
      passwordRegex: /^[a-z0-9]{3}$/i
    });

    await registerUser({ username: '  abc  ', password: '1a2' });

    expect(userModel.findByUsername).toHaveBeenCalledWith('abc');
    expect(userModel.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'abc' })
    );
  });

  test('trims password before validation', async () => {
    getRegisterConfig.mockReturnValue({
      ...baseConfig,
      passwordMinLength: 3,
      passwordMaxLength: 3,
      passwordRegex: /^[a-z0-9]{3}$/i
    });

    await registerUser({ username: 'user', password: ' 1a2 ' });

    expect(hashPassword).toHaveBeenCalledWith('1a2', 'salt');
  });

  test('rejects non-string username or password', async () => {
    await expect(
      registerUser({ username: 123, password: {} })
    ).rejects.toBeInstanceOf(RegistrationError);
    expect(userModel.findByUsername).not.toHaveBeenCalled();
  });

  test('enforces min length limits', async () => {
    await expect(
      registerUser({ username: 'ab', password: 'abc' })
    ).rejects.toBeInstanceOf(RegistrationError);
  });

  test('enforces max length limits', async () => {
    await expect(
      registerUser({ username: 'abc', password: 'abcdef' })
    ).rejects.toBeInstanceOf(RegistrationError);
  });

  test('applies username regex validation', async () => {
    await expect(
      registerUser({ username: 'Invalid', password: 'abc1' })
    ).rejects.toBeInstanceOf(RegistrationError);
  });

  test('applies password regex validation', async () => {
    getRegisterConfig.mockReturnValue({
      ...baseConfig,
      passwordRegex: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/,
      passwordMinLength: 3,
      passwordMaxLength: 5
    });

    await expect(
      registerUser({ username: 'user', password: '1111' })
    ).rejects.toBeInstanceOf(RegistrationError);
  });
});

describe('registerUser duplicate prevention', () => {
  test('throws RegistrationError 409 when user already exists', async () => {
    userModel.findByUsername.mockResolvedValue({ id: 99 });

    await expect(
      registerUser({ username: 'user', password: 'abc1' })
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(userModel.createUser).not.toHaveBeenCalled();
  });
});

describe('registerUser hashing and persistence', () => {
  test('creates salt, hashes password, and persists user', async () => {
    await registerUser({ username: ' user ', password: ' pass1 ' });

    expect(createPasswordSalt).toHaveBeenCalledTimes(1);
    expect(hashPassword).toHaveBeenCalledWith('pass1', 'salt');
    expect(userModel.createUser).toHaveBeenCalledWith({
      username: 'user',
      passwordHash: 'hash',
      passwordSalt: 'salt'
    });
  });
});

describe('registerUser error propagation', () => {
  test('findByUsername errors bubble up', async () => {
    const error = new Error('lookup failed');
    userModel.findByUsername.mockRejectedValue(error);

    await expect(
      registerUser({ username: 'user', password: 'abc1' })
    ).rejects.toBe(error);
  });

  test('hashPassword errors bubble up', async () => {
    const error = new Error('hash failed');
    hashPassword.mockRejectedValue(error);

    await expect(
      registerUser({ username: 'user', password: 'abc1' })
    ).rejects.toBe(error);
  });

  test('unique constraint errors become RegistrationError 409', async () => {
    userModel.createUser.mockRejectedValue({ code: '23505' });

    await expect(
      registerUser({ username: 'user', password: 'abc1' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  test('non-unique createUser errors bubble up', async () => {
    const error = new Error('insert failed');
    userModel.createUser.mockRejectedValue(error);

    await expect(
      registerUser({ username: 'user', password: 'abc1' })
    ).rejects.toBe(error);
  });
});

describe('registerUser minimum delay', () => {
  test('does not resolve before registerMinDelayMs', async () => {
    jest.useFakeTimers();
    sleep.mockImplementation((ms) => new Promise((resolve) => setTimeout(resolve, ms)));

    getRegisterConfig.mockReturnValue({
      ...baseConfig,
      registerMinDelayMs: 500
    });

    let resolved = false;
    const promise = registerUser({ username: 'user', password: 'abc1' }).then(
      () => {
        resolved = true;
      }
    );

    await flushPromises();
    expect(resolved).toBe(false);

    jest.advanceTimersByTime(499);
    await flushPromises();
    expect(resolved).toBe(false);

    jest.advanceTimersByTime(1);
    await promise;
    expect(resolved).toBe(true);

    jest.useRealTimers();
  });

  test('errors still respect the minimum delay', async () => {
    jest.useFakeTimers();
    sleep.mockImplementation((ms) => new Promise((resolve) => setTimeout(resolve, ms)));

    getRegisterConfig.mockReturnValue({
      ...baseConfig,
      registerMinDelayMs: 300
    });

    let rejected = false;
    const promise = registerUser({ username: 'ab', password: 'abc1' })
      .catch(() => {
        rejected = true;
      });

    await flushPromises();
    expect(rejected).toBe(false);

    jest.advanceTimersByTime(300);
    await promise;
    expect(rejected).toBe(true);

    jest.useRealTimers();
  });

  test('zero delay does not wait', async () => {
    getRegisterConfig.mockReturnValue({
      ...baseConfig,
      registerMinDelayMs: 0
    });

    await registerUser({ username: 'user', password: 'abc1' });

    expect(sleep).not.toHaveBeenCalled();
  });
});

