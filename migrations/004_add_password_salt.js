/*
Migration wrapper that adds the password_salt column.
*/

const { loadMigrationSql } = require('../db/migration_sql.cjs');

exports.up = (pgm) => {

    /*
    Apply the password_salt column migration.
    */

    pgm.sql(loadMigrationSql('004_add_password_salt.sql'));
};

exports.down = (pgm) => {

    /*
    Roll back the password_salt column migration.
    */

    pgm.sql(loadMigrationSql('004_add_password_salt.down.sql'));
};
