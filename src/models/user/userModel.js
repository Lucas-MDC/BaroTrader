/*
This module defines a user model entity for interacting 
with the users table in the database.

It provides methods to create the table, insert new users,
and retrieve users by username or ID.
*/

import sql from '../../sql/index.js';

function mapUser(row) {

    /*
    This function maps a database row to a user model object.
    */

    if (!row) return null;
    return {
        id: row.id,
        username: row.username,
        passwordHash: row.password_hash,
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

        And should be called during application initialization in
        the setup phase. ("/src/infra/db/schema/entities.js")
        */

        return db.execute(sql.user.createTable);
    }

    async function createUser({ username, passwordHash }) {

        /*
        This method inserts a new user into the users table.
        It requires a username and a password hash.
        */

        if (!username || !passwordHash) {
            throw new Error('username and passwordHash are required');
        }

        const rows = await db.query(sql.user.insert, {
            username,
            password_hash: passwordHash
        });

        return mapUser(rows[0]);
    }

    async function findByUsername(username) {

        /*
        This method retrieves a user from the users table
        by their username.
        */

        if (!username) return null;
        const rows = await db.query(sql.user.selectByUsername, { username });
        return mapUser(rows[0]);
    }

    async function findById(id) {

        /*
        This method retrieves a user from the users table
        by their ID.
        */

        if (!id) return null;
        const rows = await db.query(sql.user.selectById, { id });
        return mapUser(rows[0]);
    }

    return {
        ensureTable,
        createUser,
        findByUsername,
        findById
    };
}
