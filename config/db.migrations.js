/*
Migrations database configuration helpers.
Resolves MIGRATIONS_DATABASE_URL or builds it from MIGRATION_* env vars.
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

export function getMigrationsDbConfig({ required = true } = {}) {
    /*
    Resolve the migrations DB config, optionally returning null when not required.
    */
    loadEnv();

    const base = getBaseConnectionConfig();
    const database = process.env.MIGRATION_DB || process.env.DB_DBNAME;
    const user = process.env.MIGRATION_USER;
    const password = process.env.MIGRATION_PASS;
    const derivedUrl = buildDatabaseUrl({
        ...base,
        database,
        user,
        password
    });
    const existingUrl = process.env.MIGRATIONS_DATABASE_URL || process.env.MIGRATION_DATABASE_URL;
    const databaseUrl = existingUrl || derivedUrl;

    if (!existingUrl && derivedUrl) {
        process.env.MIGRATIONS_DATABASE_URL = derivedUrl;
    }

    const fromUrl = parseDatabaseUrl(databaseUrl);
    if (fromUrl) {
        return validateConfig(fromUrl, 'Migrations database config');
    }

    if (!required) {
        return null;
    }

    return validateConfig(
        {
            ...base,
            database: assertRequired(
                database,
                'Migrator database name (MIGRATION_DB or DB_DBNAME)'
            ),
            user: assertRequired(user, 'Migrator user (MIGRATION_USER)'),
            password
        },
        'Migrations database config (MIGRATION_*)'
    );
}
