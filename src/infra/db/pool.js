import pgPromise from 'pg-promise';
import { dbConfigOwner, dbConfigUser, ownerOnAppDb } from '../../config/db.js';

const pgp = pgPromise({ capSQL: true });

function wrapConnection(conn) {
    return {
        query: (sql, params = {}) => conn.any(sql, params),
        execute: (sql, params = {}) => conn.result(sql, params),
        close: async () => conn.$pool && conn.$pool.end(),
        $raw: conn
    };
}

const adminDb = wrapConnection(pgp(dbConfigOwner));
const ownerDb = wrapConnection(pgp(ownerOnAppDb));
const db = wrapConnection(pgp(dbConfigUser));

const getDb = (role = 'user') => {
    switch (role) {
        case 'owner':
            return ownerDb;
        case 'admin':
            return adminDb;
        default:
            return db;
    }
};

const closeAll = async () => {
    try {
        pgp.end();
    } catch (err) {
        console.warn('Error closing pg-promise pools', err);
    }
};

export {
    adminDb,
    closeAll,
    db,
    getDb,
    ownerDb
};
