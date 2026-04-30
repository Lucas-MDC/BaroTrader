/*
Shared database configuration helpers for canonical env contracts.
*/

import { loadEnv } from './env.js';

export function assertRequired(value, label) {
    /*
    Require a value and throw a labeled error when missing.
    */
    if (!value) {
        throw new Error(`${label} is required.`);
    }

    return value;
}

export function parsePort(value, label = 'DB_PORT') {
    /*
    Parse and validate a database port from the environment.
    */
    const port = Number.parseInt(String(value || ''), 10);
    if (!Number.isInteger(port) || port <= 0) {
        throw new Error(`${label} must be a positive integer.`);
    }

    return port;
}

export function getBaseConnectionConfig() {
    /*
    Resolve the shared database host and port used by all DB clients.
    */
    loadEnv();

    return {
        host: assertRequired(process.env.DB_HOST, 'DB_HOST'),
        port: parsePort(process.env.DB_PORT, 'DB_PORT')
    };
}

export function buildConnectionString({ host, port, database, user, password }) {
    /*
    Build an internal PostgreSQL connection string when a library requires it.
    */
    const encodedUser = encodeURIComponent(assertRequired(user, 'Database user'));
    const encodedPassword = encodeURIComponent(
        assertRequired(password, 'Database password')
    );
    const encodedDatabase = encodeURIComponent(
        assertRequired(database, 'Database name')
    );

    return `postgres://${encodedUser}:${encodedPassword}@${assertRequired(host, 'DB_HOST')}:${parsePort(
        port,
        'DB_PORT'
    )}/${encodedDatabase}`;
}

export function validateDbConfig(config, label) {
    /*
    Ensure a DB config object exposes the minimum fields needed by clients.
    */
    if (!config) {
        throw new Error(`${label} is required.`);
    }

    assertRequired(config.host, `${label} host`);
    parsePort(config.port, `${label} port`);
    assertRequired(config.database, `${label} database`);
    assertRequired(config.user, `${label} user`);
    assertRequired(config.password, `${label} password`);

    return config;
}
