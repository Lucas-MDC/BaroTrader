import crypto from 'crypto';
import { getHashConfig } from '../../../config/index.js';

const DEFAULT_SALT_BYTES = 16;

export function createPasswordSalt(bytes = DEFAULT_SALT_BYTES) {

    /*
    Generates a per-user password salt for hashing.
    */

    return crypto.randomBytes(bytes).toString('hex');
}

export async function hashPassword(rawPassword = '', salt) {

    /*
    Applies a hash using the provided per-user salt and configured
    pepper value. The pepper is concatenated before hashing so it
    never leaves the server or the environment configuration.
    */

    const password = rawPassword?.trim?.() ?? '';
    if (!password) {
        throw new Error('Password is required for hashing');
    }

    if (typeof salt !== 'string' || !salt) {
        throw new Error('Password salt is required for hashing');
    }

    const { hashPepper } = getHashConfig();
    const peppered = `${hashPepper}${password}`;

    return new Promise((resolve, reject) => {
        crypto.scrypt(peppered, salt, 64, (err, derivedKey) => {
            if (err) return reject(err);
            resolve(derivedKey.toString('hex'));
        });
    });
}
