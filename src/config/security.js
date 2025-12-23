import dotenv from 'dotenv';

dotenv.config();

export function getHashConfig() {
    const hashSalt = process.env.HASH_SALT;
    const hashPepper = process.env.HASH_PEPPER;

    if (!hashSalt || !hashPepper) {
        throw new Error('Hash salt/pepper configuration is missing');
    }

    return { hashSalt, hashPepper };
}
