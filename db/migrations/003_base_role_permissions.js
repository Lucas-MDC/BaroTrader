/*
Migration wrapper that manages base role permissions.
*/

const {
    escapeIdentifier,
    escapeLiteral,
    loadMigrationSql
} = require('../engine/migration_sql.cjs');

function resolveRuntimeUser() {

    /*
    Resolve the runtime user from environment configuration.
    */

    if (!process.env.RUNTIME_USER) {
        throw new Error('RUNTIME_USER must be set for runtime grants.');
    }

    return process.env.RUNTIME_USER;
}

function getReplacements() {

    /*
    Build the template replacements for the migration SQL.
    */

    const baseRole = process.env.DB_BASE_ROLE;
    if (!baseRole) {
        throw new Error('DB_BASE_ROLE must be set for base role grants.');
    }
    const runtimeUser = resolveRuntimeUser();

    return {
        baseRole: escapeIdentifier(baseRole),
        baseRoleLiteral: escapeLiteral(baseRole),
        runtimeUser: escapeIdentifier(runtimeUser),
        runtimeUserLiteral: escapeLiteral(runtimeUser)
    };
}

exports.up = (pgm) => {

    /*
    Apply base role permission grants.
    */

    pgm.sql(loadMigrationSql('003_base_role_permissions.sql', getReplacements()));
};

exports.down = (pgm) => {

    /*
    Roll back base role permission grants.
    */

    pgm.sql(loadMigrationSql('003_base_role_permissions.down.sql', getReplacements()));
};
