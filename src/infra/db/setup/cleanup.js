import { baseRole, dbConfigUser } from '../../../config/db.js';
import sql from '../../../sql/index.js';
import { adminDb } from '../pool.js';

async function cleanup() {
    console.log('Cleaning up: dropping database and roles...');

    await adminDb.execute(
        sql.infra.database.drop,
        { database: dbConfigUser.database }
    );
    console.log(`Database ${dbConfigUser.database} dropped.`);

    await adminDb.execute(
        sql.infra.users.drop,
        { user: dbConfigUser.user }
    );
    console.log(`User ${dbConfigUser.user} dropped.`);

    await adminDb.execute(
        sql.infra.roles.drop,
        { rolname: baseRole }
    );
    console.log(`Role ${baseRole} dropped.`);

    console.log('Cleanup completed: database and roles dropped.');
}

export { cleanup };
