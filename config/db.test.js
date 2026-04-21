/*
Test admin database configuration helpers.
*/

import { loadEnv } from './env.js';
import {
    assertRequired,
    getBaseConnectionConfig,
    validateDbConfig
} from './db.shared.js';

export function getTestAdminDbConfig() {
    /*
    Resolve the test admin connection used by DB-backed integration tests.
    */
    loadEnv();

    return validateDbConfig(
        {
            ...getBaseConnectionConfig(),
            database: assertRequired(process.env.TEST_DB, 'TEST_DB'),
            user: assertRequired(process.env.TEST_USER, 'TEST_USER'),
            password: assertRequired(process.env.TEST_PASSWORD, 'TEST_PASSWORD')
        },
        'Test admin database config'
    );
}
