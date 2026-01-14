/*
Shared database configuration helpers for parsing URLs and defaults.
*/

import { loadEnv } from './env.js';

export function parseDatabaseUrl(databaseUrl) {
    /*
    Parse a Postgres connection URL into a config object.
    */
    if (!databaseUrl) return null;

    const parsed = new URL(databaseUrl);
    const database = parsed.pathname ? parsed.pathname.replace(/^\//, '') : '';

    return {
        host: parsed.hostname,
        port: Number(parsed.port || 5432),
        database,
        user: decodeURIComponent(parsed.username || ''),
        password: decodeURIComponent(parsed.password || '')
    };
}

export function buildDatabaseUrl({ host, port, database, user, password }) {
    /*
    Build a Postgres connection URL from a config object.
    */
    if (!host || !port || !database || !user) return null;

    const encodedUser = encodeURIComponent(user);
    const hasPassword = password !== undefined && password !== null && password !== '';
    const encodedPassword = hasPassword ? encodeURIComponent(password) : '';
    const auth = hasPassword ? `${encodedUser}:${encodedPassword}` : encodedUser;

    return `postgres://${auth}@${host}:${port}/${database}`;
}

export function getBaseConnectionConfig() {
    /*
    Resolve the base connection settings shared across DB configs.
    */
    loadEnv();

    const host = process.env.DB_HOST || process.env.HOST || 'localhost';
    const portValue = process.env.DB_PORT || process.env.PGPORT || process.env.PORT;

    return {
        host,
        port: Number(portValue || 5432)
    };
}

export function assertRequired(value, label) {
    /*
    Require a value and throw a labeled error when missing.
    */
    if (!value) {
        throw new Error(`${label} is required.`);
    }

    return value;
}
