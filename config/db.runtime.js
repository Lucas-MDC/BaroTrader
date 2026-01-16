/*
Runtime database configuration helpers.
Resolves DATABASE_URL or builds it from DB_* env vars.
*/

import { loadEnv } from './env.js';
import {
    assertRequired,
    buildDatabaseUrl,
    getBaseConnectionConfig,
    parseDatabaseUrl
} from './db.shared.js';

function validateConfig(config, label) {
    /*
    Ensure the config has required fields and report missing values.
    */
    if (!config) {
        throw new Error(`${label} is required.`);
    }

    assertRequired(config.database, `${label} database`);
    assertRequired(config.user, `${label} user`);

    return config;
}

export function getRuntimeDbConfig() {
    /*
    Resolve the runtime DB config from environment variables.
    */
    loadEnv();

    const base = getBaseConnectionConfig();
    const database = process.env.DB_DBNAME;
    const user = process.env.DB_USER;
    const password = process.env.DB_PASS;
    const derivedUrl = buildDatabaseUrl({
        ...base,
        database,
        user,
        password
    });
    const databaseUrl = process.env.DATABASE_URL || derivedUrl;

    if (!process.env.DATABASE_URL && derivedUrl) {
        process.env.DATABASE_URL = derivedUrl;
    }

    const fromUrl = parseDatabaseUrl(databaseUrl);
    if (fromUrl) {
        return validateConfig(fromUrl, 'Runtime database config (DATABASE_URL/DB_*)');
    }

    return validateConfig(
        {
            ...base,
            database: assertRequired(database, 'Runtime database name (DB_DBNAME)'),
            user: assertRequired(user, 'Runtime user (DB_USER)'),
            password
        },
        'Runtime database config (DB_DBNAME/DB_USER)'
    );
}
