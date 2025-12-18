/*
Helpers that provision the foundational pieces of the database layer:
the login the app uses and the database instance owned by that login.
*/

import { dbConfigUser } from '../../../config/db.js';
import sql from '../../../sql/index.js';
import { adminDb } from '../pool.js';

async function ensureDatabaseUser() {

    /*
    Ensure the application login exists inside the DBMS so we can later
    grant permissions and connect as that user.
    */

    console.log('||| [Setup] Step 1 - Ensuring application login exists |||');

    const roleCheck = await adminDb.query(
        sql.infra.users.checkExists,
        { user: dbConfigUser.user }
    );

    if (roleCheck && roleCheck.length > 0) {
        console.log(`USER ${dbConfigUser.user} already exists`);
        return;
    }

    await adminDb.execute(
        sql.infra.users.create,
        { user: dbConfigUser.user, password: dbConfigUser.password }
    );
    console.log(`USER ${dbConfigUser.user} created`);
}

async function ensureDatabase() {

    /*
    Ensure the application database exists, owned by the login created
    previously so subsequent provisioning can run inside it.
    */

    console.log('||| [Setup] Step 2 - Ensuring application database exists |||');

    const dbCheck = await adminDb.query(
        sql.infra.database.checkExists,
        { database: dbConfigUser.database }
    );

    if (dbCheck && dbCheck.length > 0) {
        console.log(`DATABASE ${dbConfigUser.database} already exists`);
        return;
    }

    await adminDb.execute(
        sql.infra.database.create,
        {
            user: dbConfigUser.user,
            database: dbConfigUser.database
        }
    );
    console.log(`DATABASE ${dbConfigUser.database} created`);
}

export {
    ensureDatabase,
    ensureDatabaseUser
};
