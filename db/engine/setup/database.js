/*
Helpers that provision the foundational pieces of the database layer:
the runtime login, the migrator login, and the database owned by the migrator.
*/

import {
    getMigrationsDbConfig,
    getRuntimeDbConfig
} from '../../../config/index.js';
import sql from '../../sql/index.js';
import { getAdminDb } from '../pool.js';

function resolveDatabaseName() {
    /*
    Resolve the common database name shared by runtime and migrator configs.
    */
    const runtimeConfig = getRuntimeDbConfig();
    const migratorConfig = getMigrationsDbConfig();

    if (runtimeConfig.database !== migratorConfig.database) {
        throw new Error(
            'Runtime and migrator configs must point to the same database.'
        );
    }

    return migratorConfig.database;
}

function requireUserConfig(config, label) {
    /*
    Ensure a config object includes a user name before proceeding.
    */
    if (!config || !config.user) {
        throw new Error(`${label} is missing a user name.`);
    }

    return config;
}

async function ensureDatabaseUser({ adminDb = getAdminDb() } = {}) {
    /*
    Ensure the application login exists so runtime connections can be created.
    */

    console.log('||| [Setup] Step 1 - Ensuring application login exists |||');

    const userConfig = requireUserConfig(getRuntimeDbConfig(), 'Application user config');
    const roleCheck = await adminDb.query(
        sql.infra.users.checkExists,
        { user: userConfig.user }
    );

    if (userConfig.password == null) {
        throw new Error('Application user password is required to create the login.');
    }

    if (roleCheck && roleCheck.length > 0) {
        await adminDb.execute(
            sql.infra.users.alterPassword,
            { user: userConfig.user, password: userConfig.password }
        );
        console.log(`USER ${userConfig.user} password reconciled`);
        return;
    }

    await adminDb.execute(
        sql.infra.users.create,
        { user: userConfig.user, password: userConfig.password }
    );
    console.log(`USER ${userConfig.user} created`);
}

async function ensureMigratorUser({
    adminDb = getAdminDb(),
    adminUser = process.env.BAROTRADER_DB_ADMIN_USER || null
} = {}) {
    /*
    Ensure the migrator login exists; this role owns the schema and
    is used by migrations to apply DDL.
    */

    console.log('||| [Setup] Step 2 - Ensuring migrator login exists |||');

    const migratorConfig = requireUserConfig(
        getMigrationsDbConfig(),
        'Migrator config (MIGRATION_*)'
    );
    const runtimeConfig = requireUserConfig(
        getRuntimeDbConfig(),
        'Runtime config (RUNTIME_*)'
    );

    if (adminUser && migratorConfig.user === adminUser) {
        throw new Error(
            'Migrator user must be distinct from the admin user.'
        );
    }

    if (runtimeConfig.user === migratorConfig.user) {
        throw new Error('Migrator user must be distinct from runtime user (RUNTIME_USER).');
    }
    const roleCheck = await adminDb.query(
        sql.infra.users.checkExists,
        { user: migratorConfig.user }
    );

    if (migratorConfig.password == null) {
        throw new Error('Migrator password is required to create the login.');
    }

    if (roleCheck && roleCheck.length > 0) {
        await adminDb.execute(
            sql.infra.users.alterPassword,
            { user: migratorConfig.user, password: migratorConfig.password }
        );
        console.log(`USER ${migratorConfig.user} password reconciled`);
    } else {
        await adminDb.execute(
            sql.infra.users.create,
            { user: migratorConfig.user, password: migratorConfig.password }
        );
        console.log(`USER ${migratorConfig.user} created`);
    }

    const roleStatus = await adminDb.query(
        sql.infra.users.checkCreateRole,
        { user: migratorConfig.user }
    );
    const canCreateRole = roleStatus && roleStatus[0]?.rolcreaterole;
    if (!canCreateRole) {
        await adminDb.execute(
            sql.infra.users.grantCreateRole,
            { user: migratorConfig.user }
        );
        console.log(`USER ${migratorConfig.user} granted CREATEROLE`);
    }
}

async function ensureDatabase({ adminDb = getAdminDb() } = {}) {
    /*
    Ensure the application database exists, owned by the login created
    previously so subsequent provisioning can run inside it.
    */

    console.log('||| [Setup] Step 3 - Ensuring application database exists |||');

    const databaseName = resolveDatabaseName();
    const migratorConfig = getMigrationsDbConfig();

    const dbCheck = await adminDb.query(
        sql.infra.database.checkExists,
        { database: databaseName }
    );

    if (dbCheck && dbCheck.length > 0) {
        await adminDb.execute(
            sql.infra.database.alterOwner,
            {
                owner: migratorConfig.user,
                database: databaseName
            }
        );
        console.log(`DATABASE ${databaseName} owner reconciled`);
        return;
    }

    await adminDb.execute(
        sql.infra.database.create,
        {
            owner: migratorConfig.user,
            database: databaseName
        }
    );
    console.log(`DATABASE ${databaseName} created`);
}

export {
    ensureDatabase,
    ensureDatabaseUser,
    ensureMigratorUser
};
