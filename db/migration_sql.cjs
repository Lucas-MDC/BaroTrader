const fs = require('fs');
const path = require('path');

const migrationsDir = path.resolve(__dirname, '..', 'sql', 'migrations');

function escapeIdentifier(value) {
    if (typeof value !== 'string' || value.length === 0) {
        throw new Error('Identifier value is required for migration SQL');
    }

    return `"${value.replace(/"/g, '""')}"`;
}

function escapeLiteral(value) {
    if (typeof value !== 'string') {
        throw new Error('Literal value is required for migration SQL');
    }

    return `'${value.replace(/'/g, "''")}'`;
}

function applyReplacements(contents, replacements = {}) {
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
    const contents = fs.readFileSync(path.join(migrationsDir, filename), 'utf8');
    return applyReplacements(contents, replacements);
}

module.exports = {
    escapeIdentifier,
    escapeLiteral,
    loadMigrationSql
};
