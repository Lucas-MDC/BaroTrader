import sql from '../../sql/index.js';

function mapUser(row) {
    if (!row) return null;
    return {
        id: row.id,
        username: row.username,
        passwordHash: row.password_hash,
        createdAt: row.created_at
    };
}

export function createUserModel(db) {
    if (!db || typeof db.query !== 'function' || typeof db.execute !== 'function') {
        throw new Error('A database client with query and execute methods is required to build the user model');
    }

    async function ensureTable() {
        return db.execute(sql.user.createTable);
    }

    async function createUser({ username, passwordHash }) {
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
        if (!username) return null;
        const rows = await db.query(sql.user.selectByUsername, { username });
        return mapUser(rows[0]);
    }

    async function findById(id) {
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
