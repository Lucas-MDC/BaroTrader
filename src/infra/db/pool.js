
/*
This module sets up and manages PostgreSQL database 
connections using pg-promise. It provides wrapped connection 
objects for different user roles (admin, owner, user) and 
includes methods for querying, executing commands, and 
closing connections.
*/

import pgPromise from 'pg-promise';
import { dbConfigOwner, dbConfigUser, ownerOnAppDb } from '../../config/db.js';

const pgp = pgPromise({ capSQL: true });

function wrapConnection(conn) {

    /* 
    Wraps a pg-promise connection to provide a simplified 
    interface for querying, executing commands, and closing 
    the connection.
    */
    
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

    /*
    Returns the appropriate database connection based on the 
    user role.
    */

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

    /*
    Closes all pg-promise connection pools.
    */
    
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
