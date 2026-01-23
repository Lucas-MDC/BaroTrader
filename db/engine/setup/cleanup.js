/*
This module handles the cleanup of the database setup by
preventing accidental destruction and then dropping the
created database, users, and role.
*/

import {
    getBaseRole,
    getMigrationsDbConfig,
    getRuntimeDbConfig
} from '../../../config/index.js';
import sql from '../../sql/index.js';
import { getAdminDb } from '../pool.js';
import { assertDestructiveAllowed } from '../safety.js';

function resolveDatabaseName() {
    /*
    Resolve the single database name shared by runtime and migrator configs.
    */
    const runtimeConfig = getRuntimeDbConfig();
    const migratorConfig = getMigrationsDbConfig({ required: false });

    if (migratorConfig && migratorConfig.database !== runtimeConfig.database) {
        throw new Error(
            'Runtime and migrator configs must point to the same database.'
        );
    }

    return runtimeConfig.database;
}

async function cleanup() {
    /*
    Drop the database, users, and role created during setup.
    */

    const adminDb = getAdminDb();
    const runtimeConfig = getRuntimeDbConfig();
    const migratorConfig = getMigrationsDbConfig({ required: false });
    const databaseName = resolveDatabaseName();

    assertDestructiveAllowed({ targetDatabase: databaseName });

    console.log('Cleaning up: dropping database, users, and roles...');

    await adminDb.execute(
        sql.infra.database.drop,
        { database: databaseName }
    );
    console.log(`Database ${databaseName} dropped.`);

    if (runtimeConfig?.user) {
        await adminDb.execute(
            sql.infra.users.drop,
            { user: runtimeConfig.user }
        );
        console.log(`User ${runtimeConfig.user} dropped.`);
    }

    if (migratorConfig?.user) {
        await adminDb.execute(
            sql.infra.users.drop,
            { user: migratorConfig.user }
        );
        console.log(`User ${migratorConfig.user} dropped.`);
    }

    const baseRole = getBaseRole();
    await adminDb.execute(
        sql.infra.roles.drop,
        { rolname: baseRole }
    );
    console.log(`Role ${baseRole} dropped.`);

    console.log('Cleanup completed: database, users, and roles dropped.');
}

export { cleanup };
