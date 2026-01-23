const {
    escapeIdentifier,
    escapeLiteral,
    loadMigrationSql
} = require('../engine/migration_sql.cjs');

function resolveRuntimeUser() {
    if (process.env.DATABASE_URL) {
        const parsed = new URL(process.env.DATABASE_URL);
        if (parsed.username) {
            return decodeURIComponent(parsed.username);
        }
    }

    if (process.env.DB_USER) {
        return process.env.DB_USER;
    }

    throw new Error('DATABASE_URL or DB_USER must be set for runtime grants.');
}

function getReplacements() {
    const baseRole = process.env.DB_BASE_ROLE || 'base_role_op';
    const runtimeUser = resolveRuntimeUser();

    return {
        baseRole: escapeIdentifier(baseRole),
        baseRoleLiteral: escapeLiteral(baseRole),
        runtimeUser: escapeIdentifier(runtimeUser),
        runtimeUserLiteral: escapeLiteral(runtimeUser)
    };
}

exports.up = (pgm) => {
    pgm.sql(loadMigrationSql('003_base_role_permissions.sql', getReplacements()));
};

exports.down = (pgm) => {
    pgm.sql(loadMigrationSql('003_base_role_permissions.down.sql', getReplacements()));
};
