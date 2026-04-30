/*
Runtime database configuration helpers.
*/

import { loadEnv } from './env.js';
import {
    assertRequired,
    getBaseConnectionConfig,
    validateDbConfig
} from './db.shared.js';

export function getRuntimeDbConfig() {
    /*
    Resolve the runtime DB config from canonical runtime env vars.
    */
    loadEnv();

    return validateDbConfig(
        {
            ...getBaseConnectionConfig(),
            database: assertRequired(process.env.RUNTIME_DB, 'RUNTIME_DB'),
            user: assertRequired(process.env.RUNTIME_USER, 'RUNTIME_USER'),
            password: assertRequired(process.env.RUNTIME_PASSWORD, 'RUNTIME_PASSWORD')
        },
        'Runtime database config'
    );
}
