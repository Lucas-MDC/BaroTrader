import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import { closeAll } from './pool.js';
import { cleanup } from './setup/cleanup.js';
import { ensureDatabase, ensureDatabaseUser } from './setup/database.js';
import { applyBasePermissions, ensureBaseRole } from './permissions/permissions.js';
import { ensureDatabaseEntities } from './schema/entities.js';
import { runAsUser } from './seed/runAs.js';
import { sleep } from '../../utils/database_utils.js';

const args = process.argv.slice(2);
const mode = args[0] || 'setup';
const thisFile = fileURLToPath(import.meta.url);

async function setupFlow() {
    console.log('=== Setting up database infrastructure ===');
    await ensureDatabaseUser();
    await ensureDatabase();
    console.log('=== Database infrastructure ready ===');
}

async function databaseEntitiesFlow() {
    console.log('=== Creating database entities ===');
    await ensureDatabaseEntities();
    console.log('=== Database entities ready ===');
}

async function permissionsFlow() {
    console.log('=== Applying base permissions ===');
    await ensureBaseRole();
    await applyBasePermissions();
    console.log('=== Base permissions applied ===');
}

async function seedFlow() {
    console.log('=== Seeding / smoke testing as application user ===');
    await runAsUser();
    console.log('=== Seed/test run as application user complete ===');
}

async function fullFlow() {
    console.log('=== Running full database provisioning ===');
    await setupFlow();
    await sleep(500);
    await databaseEntitiesFlow();
    await sleep(500);
    await permissionsFlow();
    await seedFlow();
    console.log('=== Full database provisioning complete ===');
}

async function cleanupFlow() {
    console.log('=== Cleaning up database ===');
    await cleanup();
    console.log('=== Database cleanup complete ===');
}

async function main() {
    try {
        switch (mode) {
            case 'setup':
                await setupFlow();
                break;
            case 'schema':
                await databaseEntitiesFlow();
                break;
            case 'permissions':
                await permissionsFlow();
                break;
            case 'seed':
            case 'test':
                await seedFlow();
                break;
            case 'full':
                await fullFlow();
                break;
            case 'cleanup':
                await cleanupFlow();
                break;
            default:
                console.log('Usage: node main.js [setup|schema|permissions|seed|cleanup|full|test]');
                console.log('  setup        - Create database user and database (default)');
                console.log('  schema       - Create database entities (tables)');
                console.log('  permissions  - Create base role and apply grants');
                console.log('  seed         - Seed/smoke test as application user');
                console.log('  test         - Alias for seed');
                console.log('  cleanup      - Drop database, user and base role');
                console.log('  full         - Run setup + schema + permissions + seed');
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
