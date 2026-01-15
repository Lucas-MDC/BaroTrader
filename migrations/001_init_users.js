/*
Migration wrapper that loads the initial users schema SQL.
*/

const { loadMigrationSql } = require('../db/migration_sql.cjs');

exports.up = (pgm) => {

    /*
    Apply the initial users table migration.
    */

    pgm.sql(loadMigrationSql('001_init_users.sql'));
};

exports.down = (pgm) => {

    /*
    Roll back the initial users table migration.
    */

    pgm.sql(loadMigrationSql('001_init_users.down.sql'));
};
