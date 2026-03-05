import { jest } from '@jest/globals';
import crypto from 'crypto';

/**
 * Esta suite cobre os utilitarios de senha usados pelo cadastro em nivel unitario.
 * Os testes estao juntos porque exercitam o mesmo servico criptografico isolado,
 * validando geracao de salt, hashing, formato de saida e tratamento de erros.
 */
const getHashConfig = jest.fn();

jest.unstable_mockModule('../../config/index.js', () => ({
  getHashConfig
}));

const { createPasswordSalt, hashPassword } = await import(
  '../../src/services/register/passwordService.js'
);

describe('passwordService', () => {
  beforeEach(() => {
    getHashConfig.mockReset();
  });

  test('createPasswordSalt returns 32 hex chars by default', () => {
    // REG-UNIT-013: createPasswordSalt
    const salt = createPasswordSalt();
    expect(salt).toMatch(/^[0-9a-f]+$/i);
    expect(salt).toHaveLength(32);
  });

  test('createPasswordSalt respects byte length', () => {
    // REG-UNIT-013: createPasswordSalt
    const salt = createPasswordSalt(8);
    expect(salt).toHaveLength(16);
  });

  test('createPasswordSalt returns different values', () => {
    // REG-UNIT-013: createPasswordSalt
    const first = createPasswordSalt();
    const second = createPasswordSalt();
    expect(first).not.toBe(second);
  });

  test('createPasswordSalt propagates crypto errors for invalid bytes', () => {
    // REG-UNIT-013: createPasswordSalt
    expect(() => createPasswordSalt(-1)).toThrow();
    expect(() => createPasswordSalt(Number.NaN)).toThrow();
  });

  test('hashPassword rejects empty or whitespace-only passwords', async () => {
    // REG-UNIT-014: hashPassword validation
    getHashConfig.mockReturnValue({ hashPepper: 'pepper' });
    await expect(hashPassword('', 'salt')).rejects.toThrow(
      'Password is required for hashing'
    );
    await expect(hashPassword('   ', 'salt')).rejects.toThrow(
      'Password is required for hashing'
    );
  });

  test('hashPassword rejects missing or non-string salt', async () => {
    // REG-UNIT-014: hashPassword validation
    getHashConfig.mockReturnValue({ hashPepper: 'pepper' });
    await expect(hashPassword('pass123', '')).rejects.toThrow(
      'Password salt is required for hashing'
    );
    await expect(hashPassword('pass123', null)).rejects.toThrow(
      'Password salt is required for hashing'
    );
  });

  test('hashPassword fails when HASH_PEPPER is missing', async () => {
    // REG-UNIT-014: hashPassword validation
    getHashConfig.mockImplementation(() => {
      throw new Error('Hash pepper configuration is missing');
    });

    await expect(hashPassword('pass123', 'salt')).rejects.toThrow(
      'Hash pepper configuration is missing'
    );
  });

  test('hashPassword propagates scrypt errors', async () => {
    // REG-UNIT-016: scrypt error handling
    getHashConfig.mockReturnValue({ hashPepper: 'pepper' });
    const scryptSpy = jest
      .spyOn(crypto, 'scrypt')
      .mockImplementation((data, salt, keylen, callback) => {
        callback(new Error('scrypt failed'));
      });

    await expect(hashPassword('pass123', 'salt')).rejects.toThrow(
      'scrypt failed'
    );

    scryptSpy.mockRestore();
  });

  test('hashPassword returns a 128-char hex string', async () => {
    // REG-UNIT-017: hashPassword output format
    getHashConfig.mockReturnValue({ hashPepper: 'pepper' });
    const hash = await hashPassword('Passw0rd!', 'salt');
    expect(hash).toMatch(/^[0-9a-f]+$/i);
    expect(hash).toHaveLength(128);
    expect(hash).not.toContain('Passw0rd!');
  });

  test('different peppers yield different hashes', async () => {
    // REG-UNIT-017: hashPassword output format
    getHashConfig
      .mockReturnValueOnce({ hashPepper: 'pepper-one' })
      .mockReturnValueOnce({ hashPepper: 'pepper-two' });

    const salt = 'salt';
    const first = await hashPassword('Passw0rd!', salt);
    const second = await hashPassword('Passw0rd!', salt);

    expect(first).not.toBe(second);
  });
});

