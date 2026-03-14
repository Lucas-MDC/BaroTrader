const { loadMigrationSql } = require('../engine/migration_sql.cjs');

exports.up = (pgm) => {
    pgm.sql(loadMigrationSql('001_init_users.sql'));
};

exports.down = (pgm) => {
    pgm.sql(loadMigrationSql('001_init_users.down.sql'));
};
