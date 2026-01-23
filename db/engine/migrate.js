/*
Runs node-pg-migrate against the application database using
MIGRATIONS_DATABASE_URL and the db/migrations folder.
*/

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { getMigrationsDbConfig } from '../../config/index.js';
import { loadMigrationSql } from './migration_sql.cjs';
import { getOwnerDb } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const cliPath = path.join(
    projectRoot,
    'node_modules',
    'node-pg-migrate',
    'bin',
    'node-pg-migrate.js'
);
const migrationsDir = path.join(projectRoot, 'db', 'migrations');
const defaultMigrationsTable = 'pgmigrations';
const defaultMigrationsSchema = 'public';

function stripFlagWithValue(args, name) {
    /*
    Remove a flag and its value from an argument list.
    */
    const cleaned = [];

    for (let i = 0; i < args.length; i += 1) {
        const arg = args[i];
        if (arg === name) {
            i += 1;
            continue;
        }
        if (arg.startsWith(`${name}=`)) {
            continue;
        }
        cleaned.push(arg);
    }

    return cleaned;
}

export async function runMigrations(direction = 'up', extraArgs = []) {
    /*
    Execute node-pg-migrate with sanitized arguments.
    */
    if (!fs.existsSync(cliPath)) {
        throw new Error(
            'node-pg-migrate is not installed. Run: npm install --save-dev node-pg-migrate'
        );
    }

    getMigrationsDbConfig();

    await new Promise((resolve, reject) => {
        const sanitizedArgs = stripFlagWithValue(
            stripFlagWithValue(
                stripFlagWithValue(extraArgs, '--migrations-dir'),
                '--database-url-var'
            ),
            '--envPath'
        );

        const baseArgs = [
            '--migrations-dir',
            'db/migrations',
            '--ignore-pattern',
            'package\\.json',
            '--database-url-var',
            'MIGRATIONS_DATABASE_URL'
        ];
        
        const envPath = path.join(projectRoot, '.env');
        if (fs.existsSync(envPath)) {
            baseArgs.push('--envPath', '.env');
        }

        const child = spawn(
            process.execPath,
            [cliPath, direction, ...baseArgs, ...sanitizedArgs],
            {
                cwd: projectRoot,
                stdio: 'inherit',
                env: {
                    ...process.env
                }
            }
        );

        child.on('error', reject);
        child.on('close', (code) => {
            if (code === 0) return resolve();
            reject(new Error(`node-pg-migrate exited with code ${code}`));
        });
    });
}

function getNumericPrefix(name) {
    /*
    Extract a numeric prefix from a migration filename for sorting.
    */
    const prefix = name.split('_')[0];
    if (prefix && /^\d+$/.test(prefix)) {
        return Number(prefix);
    }
    return null;
}

function compareMigrationNames(a, b) {
    /*
    Compare migration filenames with numeric prefixes first, then lexicographically.
    */
    const aNum = getNumericPrefix(a);
    const bNum = getNumericPrefix(b);
    if (aNum !== null && bNum !== null && aNum !== bNum) {
        return aNum - bNum;
    }
    return a.localeCompare(b, undefined, {
        usage: 'sort',
        numeric: true,
        sensitivity: 'variant',
        ignorePunctuation: true
    });
}

function listMigrationNames() {
    /*
    List migration names from the migrations directory in execution order.
    */
    if (!fs.existsSync(migrationsDir)) {
        throw new Error(`Migrations directory not found: ${migrationsDir}`);
    }

    const entries = fs.readdirSync(migrationsDir, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
        .filter((entry) => entry.name.endsWith('.js'))
        .map((entry) => path.basename(entry.name, path.extname(entry.name)))
        .sort(compareMigrationNames);
}

function formatRunOn(value) {
    /*
    Format a migration run_on value as an ISO string when possible.
    */
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }
    return date.toISOString();
}

async function fetchAppliedMigrations(db) {
    /*
    Fetch applied migrations from the pgmigrations table when present.
    */
    const exists = await db.query(
        'SELECT table_name FROM information_schema.tables WHERE table_schema=$1 AND table_name=$2',
        [defaultMigrationsSchema, defaultMigrationsTable]
    );

    if (!exists || exists.length === 0) {
        return [];
    }

    return db.query(
        `SELECT name, run_on FROM "${defaultMigrationsSchema}"."${defaultMigrationsTable}" ORDER BY run_on`
    );
}

export async function printMigrationStatus() {
    /*
    Print a status report of applied and pending migrations.
    */
    getMigrationsDbConfig();

    const db = getOwnerDb();
    const migrationNames = listMigrationNames();
    const appliedRows = await fetchAppliedMigrations(db);

    const appliedMap = new Map(
        appliedRows.map((row) => [row.name, row.run_on])
    );
    const migrationSet = new Set(migrationNames);

    let appliedCount = 0;
    let pendingCount = 0;

    console.log(`=== Migration status (${defaultMigrationsSchema}.${defaultMigrationsTable}) ===`);
    for (const name of migrationNames) {
        const runOn = appliedMap.get(name);
        if (runOn) {
            appliedCount += 1;
            console.log(`applied  ${name}  ${formatRunOn(runOn)}`);
        } else {
            pendingCount += 1;
            console.log(`pending  ${name}`);
        }
    }

    const missingApplied = appliedRows.filter((row) => !migrationSet.has(row.name));
    if (missingApplied.length > 0) {
        console.log('---');
        console.log('Applied migrations missing from filesystem:');
        missingApplied.forEach((row) => {
            console.log(`missing  ${row.name}  ${formatRunOn(row.run_on)}`);
        });
    }

    console.log(`---`);
    console.log(`Total: ${migrationNames.length} | Applied: ${appliedCount} | Pending: ${pendingCount}`);
}

export { loadMigrationSql };
