/*
Admin database configuration helpers for setup/cleanup tooling.
Builds connection settings from environment variables and exposes the base role name.
*/

import { loadEnv } from './env.js';
import { assertRequired, getBaseConnectionConfig } from './db.shared.js';

export function getAdminDbConfig() {
    /*
    Load env and build the admin connection config from BAROTRADER_DB_ADMIN_* values.
    */
    loadEnv();

    const base = getBaseConnectionConfig();
    const database = assertRequired(
        process.env.BAROTRADER_DB_ADMIN_DBNAME,
        'Admin database name (BAROTRADER_DB_ADMIN_DBNAME) must be set in the environment'
    );
    const user = assertRequired(
        process.env.BAROTRADER_DB_ADMIN_USER,
        'Admin user (BAROTRADER_DB_ADMIN_USER) must be set in the environment'
    );
    const password = process.env.BAROTRADER_DB_ADMIN_PASS || '';

    return {
        ...base,
        database,
        user,
        password
    };
}

export function getBaseRole() {
    /*
    Resolve the base role name used for database infrastructure setup.
    */
    loadEnv();
    return process.env.DB_BASE_ROLE || 'base_role_op';
}
