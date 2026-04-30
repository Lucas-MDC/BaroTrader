/*
Tooling-only pg-promise pools for admin, migrator, and runtime users.
Connections are created lazily to avoid requiring unused env vars.
*/

import pgPromise from 'pg-promise';
import {
    getAdminDbConfig,
    getMigrationsDbConfig,
    getRuntimeDbConfig,
    getTestAdminDbConfig
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
let testAdminDb;

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

function getTestAdminDb() {
    /*
    Lazily create and return the test admin database connection.
    */
    if (!testAdminDb) {
        testAdminDb = wrapConnection(pgp(getTestAdminDbConfig()));
    }

    return testAdminDb;
}

const closeAll = async () => {
    /*
    Close all pg-promise pools safely.
    */
    try {
        pgp.end();
        adminDb = undefined;
        runtimeDb = undefined;
        ownerDb = undefined;
        testAdminDb = undefined;
    } catch (err) {
        console.warn('Error closing pg-promise pools', err);
    }
};

export {
    closeAll,
    getAdminDb,
    getOwnerDb,
    getRuntimeDb,
    getTestAdminDb
};
