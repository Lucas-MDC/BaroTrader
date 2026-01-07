/*
Tooling-only pg-promise pools for admin, migrator, and runtime users.
Connections are created lazily to avoid requiring unused env vars.
*/

import pgPromise from 'pg-promise';
import {
    getAdminDbConfig,
    getMigrationsDbConfig,
    getRuntimeDbConfig
} from '../config/index.js';

const pgp = pgPromise({ capSQL: true });

function wrapConnection(conn) {
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
    if (!adminDb) {
        adminDb = wrapConnection(pgp(getAdminDbConfig()));
    }

    return adminDb;
}

function getRuntimeDb() {
    if (!runtimeDb) {
        runtimeDb = wrapConnection(pgp(getRuntimeDbConfig()));
    }

    return runtimeDb;
}

function getOwnerDb() {
    if (!ownerDb) {
        ownerDb = wrapConnection(pgp(getMigrationsDbConfig()));
    }

    return ownerDb;
}

const closeAll = async () => {
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