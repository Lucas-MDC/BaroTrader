/*
Runs node-pg-migrate programmatically against the application database.
*/

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import migrate from 'node-pg-migrate';
import { getMigrationsDbConfig } from '../../config/index.js';
import { getOwnerDb } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const migrationsDir = path.join(projectRoot, 'db', 'migrations');
const defaultMigrationsTable = 'pgmigrations';
const defaultMigrationsSchema = 'public';
const SUPPORTED_BOOLEAN_FLAGS = new Map([
    ['--timestamp', 'timestamp'],
    ['--fake', 'fake'],
    ['--verbose', 'verbose'],
    ['--no-lock', 'noLock'],
    ['--create-schema', 'createSchema'],
    ['--create-migrations-schema', 'createMigrationsSchema']
]);
const SUPPORTED_VALUE_FLAGS = new Map([
    ['--count', 'count'],
    ['--file', 'file'],
    ['--schema', 'schema'],
    ['--migrations-table', 'migrationsTable'],
    ['--migrations-schema', 'migrationsSchema']
]);

function consumeFlagValue(args, index, flag) {
    /*
    Read a CLI flag value supporting both `--flag value` and `--flag=value`.
    */
    const arg = args[index];
    if (arg === flag) {
        const value = args[index + 1];
        if (value === undefined || value.startsWith('--')) {
            throw new Error(`${flag} requires a value.`);
        }

        return { value, nextIndex: index + 1 };
    }

    const prefix = `${flag}=`;
    if (arg.startsWith(prefix)) {
        return { value: arg.slice(prefix.length), nextIndex: index };
    }

    return { value: null, nextIndex: index };
}

function parseNumericOption(value, label) {
    const parsed = Number.parseInt(String(value || ''), 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`${label} must be a positive integer.`);
    }

    return parsed;
}

function parseMigrationOptions(direction, extraArgs = []) {
    /*
    Parse a supported subset of node-pg-migrate CLI flags for the programmatic API.
    */
    const options = {
        checkOrder: true,
        createMigrationsSchema: false,
        createSchema: false,
        direction,
        dir: 'db/migrations',
        ignorePattern: 'package\\.json',
        migrationsSchema: defaultMigrationsSchema,
        migrationsTable: defaultMigrationsTable,
        schema: defaultMigrationsSchema,
        singleTransaction: true
    };

    for (let i = 0; i < extraArgs.length; i += 1) {
        const arg = extraArgs[i];

        if (arg === '--') {
            continue;
        }

        if (SUPPORTED_BOOLEAN_FLAGS.has(arg)) {
            options[SUPPORTED_BOOLEAN_FLAGS.get(arg)] = true;
            continue;
        }

        let handled = false;
        for (const [flag, optionName] of SUPPORTED_VALUE_FLAGS.entries()) {
            const { value, nextIndex } = consumeFlagValue(extraArgs, i, flag);
            if (value === null) {
                continue;
            }

            handled = true;
            i = nextIndex;
            options[optionName] =
                optionName === 'count' ? parseNumericOption(value, '--count') : value;
            break;
        }

        if (!handled) {
            throw new Error(
                `Unsupported node-pg-migrate option "${arg}" in programmatic mode.`
            );
        }
    }

    return options;
}

function createMigrationLogger() {
    /*
    Filter known timestamp-prefix noise from node-pg-migrate while keeping real errors.
    */
    return {
        debug: console.debug.bind(console),
        info: console.info.bind(console),
        warn: console.warn.bind(console),
        error: (message, ...args) => {
            if (
                typeof message === 'string' &&
                message.startsWith("Can't determine timestamp for ")
            ) {
                return;
            }

            console.error(message, ...args);
        }
    };
}

async function runDirectionalMigrations(direction, extraArgs = []) {
    /*
    Execute node-pg-migrate for a single direction using object-based DB config.
    */
    const migrationConfig = getMigrationsDbConfig();
    const options = parseMigrationOptions(direction, extraArgs);

    await migrate({
        ...options,
        databaseUrl: migrationConfig,
        logger: createMigrationLogger()
    });
}

export async function runMigrations(direction = 'up', extraArgs = []) {
    /*
    Execute node-pg-migrate with sanitized arguments.
    */
    if (direction === 'redo') {
        await runDirectionalMigrations('down', extraArgs);
        await runDirectionalMigrations('up', extraArgs);
        return;
    }

    await runDirectionalMigrations(direction, extraArgs);
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
