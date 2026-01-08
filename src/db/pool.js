/*
Runtime-only pg-promise pool for the application user.
*/

import pgPromise from 'pg-promise';
import { getRuntimeDbConfig } from '../../config/index.js';

const pgp = pgPromise({ capSQL: true });

function wrapConnection(conn) {
    return {
        query: (sql, params = {}) => conn.any(sql, params),
        execute: (sql, params = {}) => conn.result(sql, params),
        close: async () => conn.$pool && conn.$pool.end(),
        $raw: conn
    };
}

const db = wrapConnection(pgp(getRuntimeDbConfig()));

export { db };