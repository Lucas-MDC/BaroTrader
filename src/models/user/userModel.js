/*
This module defines a user model entity for interacting 
with the users table in the database.

It provides methods to create the table, insert new users,
and retrieve users by username or ID.
*/

import sql from '../../../db/sql/index.js';

function mapUser(row) {

    /*
    This function maps a database row to a user model object.
    */

    if (!row) return null;
    return {
        id: row.id,
        username: row.username,
        passwordHash: row.password_hash,
        passwordSalt: row.password_salt,
        createdAt: row.created_at
    };
}

export function createUserModel(db) {

    /*
    This function creates a user model with methods to interact
    with the users table in the database.
    */

    if (!db || typeof db.query !== 'function' || typeof db.execute !== 'function') {
        throw new Error('A database client with query and execute methods is required to build the user model');
    }

    async function ensureTable() {

        /*
        This method ensures that the users table exists in 
        the database. If it does not exist, it creates the table.

        Legacy path for creating the table in code. Prefer
        applying schema changes via migrations.
        */

        throw new Error(
            'ensureTable is deprecated. Apply schema changes via migrations.'
        );
    }

    async function createUser({ username, passwordHash, passwordSalt }) {

        /*
        This method inserts a new user into the users table.
        It requires a username and a password hash.
        */

        if (!username || !passwordHash || !passwordSalt) {
            throw new Error('username, passwordHash, and passwordSalt are required');
        }

        const rows = await db.query(sql.runtime.user.insert, {
            username,
            password_hash: passwordHash,
            password_salt: passwordSalt
        });

        return mapUser(rows[0]);
    }

    async function findByUsername(username) {

        /*
        This method retrieves a user from the users table
        by their username.
        */

        if (!username) return null;
        const rows = await db.query(sql.runtime.user.selectByUsername, { username });
        return mapUser(rows[0]);
    }

    async function findById(id) {

        /*
        This method retrieves a user from the users table
        by their ID.
        */

        if (!id) return null;
        const rows = await db.query(sql.runtime.user.selectById, { id });
        return mapUser(rows[0]);
    }

    return {
        ensureTable,
        createUser,
        findByUsername,
        findById
    };
}
