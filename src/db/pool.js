/*
Runtime-only pg-promise pool for the application user.
*/

import pgPromise from 'pg-promise';
import { getRuntimeDbConfig } from '../../config/index.js';

const pgp = pgPromise({ capSQL: true });
let runtimeDb = null;

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

function getRuntimeDb() {

    /*
    Lazily create and return the runtime database connection.
    */

    if (!runtimeDb) {
        runtimeDb = wrapConnection(pgp(getRuntimeDbConfig()));
    }

    return runtimeDb;
}

async function closeRuntimeDb() {

    /*
    Close the runtime database connection and clear the cache.
    */

    if (!runtimeDb) {
        return;
    }

    await runtimeDb.close();
    runtimeDb = null;
}

export {
    closeRuntimeDb,
    getRuntimeDb
};
