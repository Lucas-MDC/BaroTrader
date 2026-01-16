import { getRegisterConfig } from '../../../config/index.js';
import { getUserModel } from '../../models/user/index.js';
import { sleep } from '../../utils/database_utils.js';
import { createPasswordSalt, hashPassword } from './passwordService.js';

class RegistrationError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.name = 'RegistrationError';
        this.statusCode = statusCode;
    }
}

function sanitizeUsername(username) {
    return typeof username === 'string' ? username.trim() : '';
}

function isValidUsername(username, config) {
    if (!username) return false;
    if (username.length < config.usernameMinLength) return false;
    if (username.length > config.usernameMaxLength) return false;
    return config.usernameRegex.test(username);
}

function isValidPassword(password, config) {
    if (!password) return false;
    if (password.length < config.passwordMinLength) return false;
    if (password.length > config.passwordMaxLength) return false;
    return config.passwordRegex.test(password);
}

async function ensureMinDelay(startedAt, minDelayMs) {
    const elapsedMs = Date.now() - startedAt;
    const remainingMs = minDelayMs - elapsedMs;
    if (remainingMs > 0) {
        await sleep(remainingMs);
    }
}

export async function registerUser({ username, password }) {

    /*
    Creates a new user using the user model, applying hashing on the
    provided password. It prevents duplicates and returns the created
    user without exposing sensitive data.
    */

    const startedAt = Date.now();
    const config = getRegisterConfig();
    const userModel = getUserModel();
    const normalizedUsername = sanitizeUsername(username);
    const normalizedPassword = typeof password === 'string' ? password.trim() : '';

    try {
        if (
            !isValidUsername(normalizedUsername, config) ||
            !isValidPassword(normalizedPassword, config)
        ) {
            throw new RegistrationError('Usuario ou senha invalidos', 400);
        }

        const alreadyExists = await userModel.findByUsername(normalizedUsername);
        if (alreadyExists) {
            throw new RegistrationError('User already exists', 409);
        }

        const passwordSalt = createPasswordSalt();
        const passwordHash = await hashPassword(normalizedPassword, passwordSalt);

        return userModel.createUser({
            username: normalizedUsername,
            passwordHash,
            passwordSalt
        });
    } finally {
        await ensureMinDelay(startedAt, config.registerMinDelayMs);
    }
}

export { RegistrationError };
