import { dbConfigUser } from '../../../config/db.js';
import sql from '../../../sql/index.js';
import { adminDb } from '../pool.js';

async function ensureDatabaseUser() {
    console.log('||| Ensuring database user exists... |||');

    const roleCheck = await adminDb.query(
        sql.infra.users.checkExists,
        { user: dbConfigUser.user }
    );

    if (roleCheck && roleCheck.length > 0) {
        console.log(`ROLE ${dbConfigUser.user} ja existe`);
        return;
    }

    await adminDb.execute(
        sql.infra.users.create,
        { user: dbConfigUser.user, password: dbConfigUser.password }
    );
    console.log(`ROLE ${dbConfigUser.user} criado`);
}

async function ensureDatabase() {
    console.log('||| Ensuring application database exists... |||');

    const dbCheck = await adminDb.query(
        sql.infra.database.checkExists,
        { database: dbConfigUser.database }
    );

    if (dbCheck && dbCheck.length > 0) {
        console.log(`DATABASE ${dbConfigUser.database} ja existe`);
        return;
    }

    await adminDb.execute(
        sql.infra.database.create,
        {
            user: dbConfigUser.user,
            database: dbConfigUser.database
        }
    );
    console.log(`DATABASE ${dbConfigUser.database} criado`);
}

export {
    ensureDatabase,
    ensureDatabaseUser
};
