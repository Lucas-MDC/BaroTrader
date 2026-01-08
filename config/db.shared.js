import { loadEnv } from './env.js';

export function parseDatabaseUrl(databaseUrl) {
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
    if (!host || !port || !database || !user) return null;

    const encodedUser = encodeURIComponent(user);
    const hasPassword = password !== undefined && password !== null && password !== '';
    const encodedPassword = hasPassword ? encodeURIComponent(password) : '';
    const auth = hasPassword ? `${encodedUser}:${encodedPassword}` : encodedUser;

    return `postgres://${auth}@${host}:${port}/${database}`;
}

export function getBaseConnectionConfig() {
    loadEnv();

    return {
        host: process.env.HOST || 'localhost',
        port: Number(process.env.PORT || 5432)
    };
}

export function assertRequired(value, label) {
    if (!value) {
        throw new Error(`${label} is required.`);
    }

    return value;
}
