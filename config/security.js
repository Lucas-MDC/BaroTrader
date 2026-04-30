/*
Security-related configuration helpers for hashing and registration policy.
*/

import { loadEnv } from './env.js';
import { assertRequired } from './db.shared.js';

const REGISTER_USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9._-]{1,30}[a-z0-9])?$/;
const REGISTER_PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[\x21-\x7E]{8,64}$/;
const REGISTER_USERNAME_MIN_LENGTH = 1;
const REGISTER_USERNAME_MAX_LENGTH = 32;
const REGISTER_PASSWORD_MIN_LENGTH = 8;
const REGISTER_PASSWORD_MAX_LENGTH = 64;
function parseDelayMs(value) {
    /*
    Parse a required delay value in milliseconds.
    */
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error('REGISTER_MIN_DELAY_MS must be a non-negative integer.');
    }

    return parsed;
}

export function getHashConfig() {
    /*
    Load the hash pepper configuration from the environment.
    */
    loadEnv();

    const hashPepper = assertRequired(process.env.HASH_PEPPER, 'HASH_PEPPER');

    return { hashPepper };
}

export function getRegisterConfig() {
    /*
    Build registration constraints and throttling settings from the environment.
    */
    loadEnv();

    const registerMinDelayMs = parseDelayMs(
        assertRequired(process.env.REGISTER_MIN_DELAY_MS, 'REGISTER_MIN_DELAY_MS')
    );

    return {
        registerMinDelayMs,
        usernameRegex: REGISTER_USERNAME_REGEX,
        passwordRegex: REGISTER_PASSWORD_REGEX,
        usernameMinLength: REGISTER_USERNAME_MIN_LENGTH,
        usernameMaxLength: REGISTER_USERNAME_MAX_LENGTH,
        passwordMinLength: REGISTER_PASSWORD_MIN_LENGTH,
        passwordMaxLength: REGISTER_PASSWORD_MAX_LENGTH
    };
}
