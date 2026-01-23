/*
Tooling-only pg-promise pools for admin, migrator, and runtime users.
Connections are created lazily to avoid requiring unused env vars.
*/

import pgPromise from 'pg-promise';
import {
    getAdminDbConfig,
    getMigrationsDbConfig,
    getRuntimeDbConfig
} from '../../config/index.js';

const pgp = pgPromise({ capSQL: true });

function wrapConnection(conn) {
    /*
    Wrap a pg-promise connection with helper methods used by tooling.
    */
    return {
        query: (sql, params = {}) => conn.any(sql, params),
        execute: (sql, params = {}) => conn.result(sql, params),
        close: async () => conn.$pool && conn.$pool.end(),
        $raw: conn
    };
}

let adminDb;
let runtimeDb;
let ownerDb;

function getAdminDb() {
    /*
    Lazily create and return an admin database connection.
    */
    if (!adminDb) {
        adminDb = wrapConnection(pgp(getAdminDbConfig()));
    }

    return adminDb;
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

function getOwnerDb() {
    /*
    Lazily create and return the migrator/owner database connection.
    */
    if (!ownerDb) {
        ownerDb = wrapConnection(pgp(getMigrationsDbConfig()));
    }

    return ownerDb;
}

const closeAll = async () => {
    /*
    Close all pg-promise pools safely.
    */
    try {
        pgp.end();
    } catch (err) {
        console.warn('Error closing pg-promise pools', err);
    }
};

export {
    closeAll,
    getAdminDb,
    getOwnerDb,
    getRuntimeDb
};
