/*
Admin database configuration helpers for provisioning tooling.
*/

import { loadEnv } from './env.js';
import {
    assertRequired,
    getBaseConnectionConfig,
    validateDbConfig
} from './db.shared.js';

export function getAdminDbConfig() {
    /*
    Resolve the DB admin connection used for runtime/prod provisioning tooling.
    */
    loadEnv();

    return validateDbConfig(
        {
            ...getBaseConnectionConfig(),
            database: assertRequired(
                process.env.BAROTRADER_DB_ADMIN_DB,
                'BAROTRADER_DB_ADMIN_DB'
            ),
            user: assertRequired(
                process.env.BAROTRADER_DB_ADMIN_USER,
                'BAROTRADER_DB_ADMIN_USER'
            ),
            password: assertRequired(
                process.env.BAROTRADER_DB_ADMIN_PASSWORD,
                'BAROTRADER_DB_ADMIN_PASSWORD'
            )
        },
        'Admin database config'
    );
}

export function getBaseRole() {
    /*
    Resolve the base role name used for grants and cleanup.
    */
    loadEnv();
    return assertRequired(process.env.DB_BASE_ROLE, 'DB_BASE_ROLE');
}
