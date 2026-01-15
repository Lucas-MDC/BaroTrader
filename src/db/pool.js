/*
Runtime-only pg-promise pool for the application user.
*/

import pgPromise from 'pg-promise';
import { getRuntimeDbConfig } from '../../config/index.js';

const pgp = pgPromise({ capSQL: true });

function wrapConnection(conn) {

    /*
    Normalize pg-promise into a small helper API for runtime queries.
    */

    return {
        query: (sql, params = {}) => conn.any(sql, params),
        execute: (sql, params = {}) => conn.result(sql, params),
        close: async () => conn.$pool && conn.$pool.end(),
        $raw: conn
    };
}

/*
Initialize the runtime connection once for application usage.
*/
const db = wrapConnection(pgp(getRuntimeDbConfig()));

export { db };
