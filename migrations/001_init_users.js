const { loadMigrationSql } = require('../db/migration_sql.cjs');

exports.up = (pgm) => {
    pgm.sql(loadMigrationSql('001_init_users.sql'));
};

exports.down = (pgm) => {
    pgm.sql(loadMigrationSql('001_init_users.down.sql'));
};
