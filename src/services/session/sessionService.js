import crypto from 'crypto';
import { getAuthConfig } from '../../../config/index.js';
import { getUserModel } from '../../models/user/index.js';
import { hashPassword } from '../register/passwordService.js';
import { sleep } from '../register/sleep.js';

const INVALID_CREDENTIALS_MESSAGE = 'Invalid username or password.';
const DUMMY_PASSWORD_SALT = '00000000000000000000000000000000';
const DUMMY_PASSWORD = 'invalid-password';

class SessionError extends Error {
  constructor(message, statusCode = 401) {
    super(message);
    this.name = 'SessionError';
    this.statusCode = statusCode;
  }
}

function sanitizeUsername(username) {
  return typeof username === 'string' ? username.trim() : '';
}

function sanitizePassword(password) {
  return typeof password === 'string' ? password.trim() : '';
}

async function waitUntilDeadline(startedAt, deadlineMs) {
  const elapsedMs = Date.now() - startedAt;
  const remainingMs = deadlineMs - elapsedMs;
  if (remainingMs > 0) {
    await sleep(remainingMs);
  }
}

function timingSafeEqualHex(first, second) {
  if (
    typeof first !== 'string' ||
    typeof second !== 'string' ||
    !/^[a-f0-9]+$/i.test(first) ||
    !/^[a-f0-9]+$/i.test(second)
  ) {
    return false;
  }

  const firstBuffer = Buffer.from(first, 'hex');
  const secondBuffer = Buffer.from(second, 'hex');
  if (firstBuffer.length !== secondBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(firstBuffer, secondBuffer);
}

function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt
  };
}

function invalidCredentials() {
  return new SessionError(INVALID_CREDENTIALS_MESSAGE, 401);
}

async function verifyPassword({ user, password }) {
  const salt = user?.passwordSalt || DUMMY_PASSWORD_SALT;
  const passwordForHash = password || DUMMY_PASSWORD;
  const candidateHash = await hashPassword(passwordForHash, salt);

  if (!user) return false;

  return timingSafeEqualHex(candidateHash, user.passwordHash);
}

export async function login({ username, password }) {
  const startedAt = Date.now();
  const { loginResponseDeadlineMs } = getAuthConfig();

  try {
    const normalizedUsername = sanitizeUsername(username);
    const normalizedPassword = sanitizePassword(password);

    if (!normalizedUsername || !normalizedPassword) {
      throw invalidCredentials();
    }

    const user = await getUserModel().findByUsername(normalizedUsername);
    const passwordMatches = await verifyPassword({
      user,
      password: normalizedPassword
    });

    if (!passwordMatches) {
      throw invalidCredentials();
    }

    return toPublicUser(user);
  } finally {
    await waitUntilDeadline(startedAt, loginResponseDeadlineMs);
  }
}

export function logout() {
  return { ok: true };
}

export { INVALID_CREDENTIALS_MESSAGE, SessionError };
