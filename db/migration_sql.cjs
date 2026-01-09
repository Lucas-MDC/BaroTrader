/*
Helpers for loading SQL migration files with safe identifier/literal escaping.
*/

const fs = require('fs');
const path = require('path');

const migrationsDir = path.resolve(__dirname, '..', 'sql', 'migrations');

function escapeIdentifier(value) {
    /*
    Escape a SQL identifier for use in migration templates.
    */
    if (typeof value !== 'string' || value.length === 0) {
        throw new Error('Identifier value is required for migration SQL');
    }

    return `"${value.replace(/"/g, '""')}"`;
}

function escapeLiteral(value) {
    /*
    Escape a SQL literal value for use in migration templates.
    */
    if (typeof value !== 'string') {
        throw new Error('Literal value is required for migration SQL');
    }

    return `'${value.replace(/'/g, "''")}'`;
}

function applyReplacements(contents, replacements = {}) {
    /*
    Replace template tokens with provided values and ensure none remain.
    */
    let sql = contents;

    Object.entries(replacements).forEach(([key, value]) => {
        const token = `{{${key}}}`;
        sql = sql.split(token).join(value);
    });

    const leftover = sql.match(/\{\{[^}]+\}\}/g);
    if (leftover) {
        throw new Error(`Missing replacements for: ${leftover.join(', ')}`);
    }

    return sql;
}

function loadMigrationSql(filename, replacements = {}) {
    /*
    Load a migration SQL file and apply template replacements.
    */
    const contents = fs.readFileSync(path.join(migrationsDir, filename), 'utf8');
    return applyReplacements(contents, replacements);
}

module.exports = {
    escapeIdentifier,
    escapeLiteral,
    loadMigrationSql
};
