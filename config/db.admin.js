import { loadEnv } from './env.js';
import { assertRequired, getBaseConnectionConfig } from './db.shared.js';

export function getAdminDbConfig() {
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
    loadEnv();
    return process.env.DB_BASE_ROLE || 'base_role_op';
}
