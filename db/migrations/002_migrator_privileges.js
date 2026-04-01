/*
Migration wrapper that grants migrator privileges.
*/

const {
    escapeIdentifier,
    escapeLiteral,
    loadMigrationSql
} = require('../engine/migration_sql.cjs');

function resolveMigratorUser() {

    /*
    Resolve the migrator user from environment configuration.
    */

    const databaseUrl = process.env.MIGRATIONS_DATABASE_URL || process.env.MIGRATION_DATABASE_URL;
    if (databaseUrl) {
        const parsed = new URL(databaseUrl);
        if (parsed.username) {
            return decodeURIComponent(parsed.username);
        }
    }

    if (process.env.MIGRATION_USER) {
        return process.env.MIGRATION_USER;
    }

    throw new Error('MIGRATIONS_DATABASE_URL or MIGRATION_USER must be set for migrator grants.');
}

function getReplacements() {

    /*
    Build the template replacements for the migration SQL.
    */

    const migratorUser = resolveMigratorUser();

    return {
        migratorUser: escapeIdentifier(migratorUser),
        migratorUserLiteral: escapeLiteral(migratorUser)
    };
}

exports.up = (pgm) => {

    /*
    Apply migrator privilege grants.
    */

    pgm.sql(loadMigrationSql('002_migrator_privileges.sql', getReplacements()));
};

exports.down = (pgm) => {

    /*
    Roll back migrator privilege grants.
    */

    pgm.sql(loadMigrationSql('002_migrator_privileges.down.sql', getReplacements()));
};
