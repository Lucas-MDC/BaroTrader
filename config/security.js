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
const JWT_ALGORITHM = 'HS256';
const MIN_JWT_SECRET_LENGTH = 32;

function parseNonNegativeInteger(value, label) {
    /*
    Parse a required non-negative integer value.
    */
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error(`${label} must be a non-negative integer.`);
    }

    return parsed;
}

function parsePositiveInteger(value, label) {
    /*
    Parse a required positive integer value.
    */
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`${label} must be a positive integer.`);
    }

    return parsed;
}

function validateJwtSecret(secret) {
    /*
    Require enough material for HS256. This checks length, not true entropy.
    */
    if (secret.length < MIN_JWT_SECRET_LENGTH) {
        throw new Error(
            `BAROTRADER_JWT_SECRET must contain at least ${MIN_JWT_SECRET_LENGTH} characters.`
        );
    }

    return secret;
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

    const registerMinDelayMs = parseNonNegativeInteger(
        assertRequired(process.env.REGISTER_MIN_DELAY_MS, 'REGISTER_MIN_DELAY_MS'),
        'REGISTER_MIN_DELAY_MS'
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

export function getAuthConfig() {
    /*
    Build stateless session/JWT policy from canonical environment variables.
    */
    loadEnv();

    const jwtSecret = validateJwtSecret(
        assertRequired(process.env.BAROTRADER_JWT_SECRET, 'BAROTRADER_JWT_SECRET')
    );
    const jwtExpiresInSeconds = parsePositiveInteger(
        assertRequired(
            process.env.BAROTRADER_JWT_EXPIRES_IN_SECONDS,
            'BAROTRADER_JWT_EXPIRES_IN_SECONDS'
        ),
        'BAROTRADER_JWT_EXPIRES_IN_SECONDS'
    );
    const loginResponseDeadlineMs = parseNonNegativeInteger(
        assertRequired(
            process.env.BAROTRADER_LOGIN_RESPONSE_DEADLINE_MS,
            'BAROTRADER_LOGIN_RESPONSE_DEADLINE_MS'
        ),
        'BAROTRADER_LOGIN_RESPONSE_DEADLINE_MS'
    );
    const jwtCookieName = assertRequired(
        process.env.BAROTRADER_JWT_COOKIE_NAME,
        'BAROTRADER_JWT_COOKIE_NAME'
    );

    return {
        jwtSecret,
        jwtAlgorithm: JWT_ALGORITHM,
        jwtExpiresInSeconds,
        jwtCookieName,
        loginResponseDeadlineMs,
        cookieHttpOnly: true,
        cookieSecure: true,
        cookieSameSite: 'strict'
    };
}
