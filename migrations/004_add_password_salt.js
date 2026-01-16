const { loadMigrationSql } = require('../db/migration_sql.cjs');

exports.up = (pgm) => {
    pgm.sql(loadMigrationSql('004_add_password_salt.sql'));
};

exports.down = (pgm) => {
    pgm.sql(loadMigrationSql('004_add_password_salt.down.sql'));
};
