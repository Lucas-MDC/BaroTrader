import { getUserModel } from '../../models/user/index.js';
import { hashPassword } from './passwordService.js';

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

export async function registerUser({ username, password }) {

    /*
    Creates a new user using the user model, applying hashing on the
    provided password. It prevents duplicates and returns the created
    user without exposing sensitive data.
    */

    const userModel = getUserModel();
    const normalizedUsername = sanitizeUsername(username);
    const normalizedPassword = typeof password === 'string' ? password.trim() : '';

    if (!normalizedUsername) {
        throw new RegistrationError('Username is required', 400);
    }

    if (!normalizedPassword) {
        throw new RegistrationError('Password is required', 400);
    }

    const alreadyExists = await userModel.findByUsername(normalizedUsername);
    if (alreadyExists) {
        throw new RegistrationError('User already exists', 409);
    }

    const passwordHash = await hashPassword(normalizedPassword);

    return userModel.createUser({
        username: normalizedUsername,
        passwordHash
    });
}

export { RegistrationError };
