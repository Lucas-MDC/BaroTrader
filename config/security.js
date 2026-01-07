import { loadEnv } from './env.js';

export function getHashConfig() {
    loadEnv();

    const hashSalt = process.env.HASH_SALT;
    const hashPepper = process.env.HASH_PEPPER;

    if (!hashSalt || !hashPepper) {
        throw new Error('Hash salt/pepper configuration is missing');
    }

    return { hashSalt, hashPepper };
}