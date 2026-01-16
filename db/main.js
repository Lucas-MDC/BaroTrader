/*
This module serves as the main entry point for managing database setup,
migrations, seeding, and cleanup operations.
It interprets command-line arguments to determine which operation to perform.
*/

import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import { closeAll } from './pool.js';
import { cleanup } from './setup/cleanup.js';
import { ensureDatabase, ensureDatabaseUser, ensureMigratorUser } from './setup/database.js';
import { printMigrationStatus, runMigrations } from './migrate.js';
import { runAsUser } from './seed/runAs.js';

const MIGRATE_SUBCOMMANDS = new Set(['up', 'down', 'redo', 'status']);

const args = process.argv.slice(2);
const mode = args[0];
const modeArgs = args.slice(1);
const thisFile = fileURLToPath(import.meta.url);

function getNpmArgs(scriptName) {
    /*
    Extract arguments passed through npm to a given script name.
    */
    const raw = process.env.npm_config_argv;
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw);
        const original = parsed.original || [];
        const index = original.indexOf(scriptName);

        if (index === -1) return [];

        return original.slice(index + 1).filter((arg) => arg !== '--');
    } catch (error) {
        console.warn('Warning: Unable to parse npm arguments:', error);
        return [];
    }
}

function resolveMigrateArgs() {
    /*
    Resolve migration arguments from CLI input or npm passthrough.
    */
    if (modeArgs.length > 0) return modeArgs;

    const npmArgs = getNpmArgs('db:migrate');
    return npmArgs;
}

async function setupFlow() {
    /*
    This function sets up the database infrastructure by ensuring that
    the necessary database user and database exist.
    */

    console.log('=== Setting up database infrastructure ===');
    await ensureDatabaseUser();
    await ensureMigratorUser();
    await ensureDatabase();
    console.log('=== Database infrastructure ready ===');
}

async function migrateFlow() {
    /*
    This function runs migrations using node-pg-migrate.
    */

    const migrateArgs = resolveMigrateArgs();
    const subcommand = migrateArgs[0] || 'up';
    const extraArgs = migrateArgs.slice(1);

    if (!MIGRATE_SUBCOMMANDS.has(subcommand)) {
        throw new Error(
            `Unknown migrate command "${subcommand}". ` +
            'Use: up, down, redo, status.'
        );
    }

    const actionLabel = {
        up: 'Applying',
        down: 'Rolling back',
        redo: 'Redoing',
        status: 'Checking'
    }[subcommand];

    console.log(`=== ${actionLabel} database migrations ===`);
    if (subcommand === 'status') {
        await printMigrationStatus();
        console.log(`=== Migration status complete ===`);
        return;
    }

    await runMigrations(subcommand, extraArgs);
    console.log(`=== Migration ${subcommand} complete ===`);
}

async function seedFlow() {
    /*
    This function seeds the database and performs smoke testing
    as the application user.
    */

    console.log('=== Seeding / smoke testing as application user ===');
    await runAsUser();
    console.log('=== Seed/test run as application user complete ===');
}

async function cleanupFlow() {
    /*
    This function cleans up the database by dropping the database,
    users, and base role.
    */

    console.log('=== Cleaning up database ===');
    await cleanup();
    console.log('=== Database cleanup complete ===');
}

function printUsage() {
    /*
    Print CLI usage instructions for database tooling.
    */
    console.log('Usage: node db/main.js [setup|migrate|seed|cleanup]');
    console.log('  setup               - Create database user and database');
    console.log('  migrate <cmd> [args] - Run migrations (up|down|redo|status)');
    console.log('  seed                - Seed/smoke test as application user');
    console.log('  cleanup             - Drop database, users, and base role');
}

async function main() {
    /*
    Entry point for the database CLI workflow.
    */
    try {
        switch (mode) {
            case 'setup':
                await setupFlow();
                break;
            case 'migrate':
                await migrateFlow();
                break;
            case 'seed':
                await seedFlow();
                break;
            case 'cleanup':
                await cleanupFlow();
                break;
            default:
                printUsage();
                process.exit(1);
        }
    } catch (error) {
        console.error('Error during database operation:', error.message);
        process.exitCode = 1;
    } finally {
        await closeAll();
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
    main();
}

export { main };
