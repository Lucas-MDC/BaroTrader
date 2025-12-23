import crypto from 'crypto';
import { getHashConfig } from '../../config/security.js';

export async function hashPassword(rawPassword = '') {

    /*
    Applies a hash using the configured salt and pepper values.
    The pepper is concatenated before hashing so it never leaves
    the server or the environment configuration.
    */

    const password = rawPassword?.trim?.() ?? '';
    if (!password) {
        throw new Error('Password is required for hashing');
    }

    const { hashSalt, hashPepper } = getHashConfig();
    const peppered = `${hashPepper}${password}`;

    return new Promise((resolve, reject) => {
        crypto.scrypt(peppered, hashSalt, 64, (err, derivedKey) => {
            if (err) return reject(err);
            resolve(derivedKey.toString('hex'));
        });
    });
}
