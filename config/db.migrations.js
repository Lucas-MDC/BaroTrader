/*
Migrations database configuration helpers.
*/

import { loadEnv } from './env.js';
import {
    assertRequired,
    getBaseConnectionConfig,
    validateDbConfig
} from './db.shared.js';

export function getMigrationsDbConfig() {
    /*
    Resolve the migrations DB config from canonical migration env vars.
    */
    loadEnv();

    return validateDbConfig(
        {
            ...getBaseConnectionConfig(),
            database: assertRequired(process.env.MIGRATION_DB, 'MIGRATION_DB'),
            user: assertRequired(process.env.MIGRATION_USER, 'MIGRATION_USER'),
            password: assertRequired(
                process.env.MIGRATION_PASSWORD,
                'MIGRATION_PASSWORD'
            )
        },
        'Migrations database config'
    );
}
