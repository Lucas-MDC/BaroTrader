import crypto from 'crypto';
import { loadEnv } from '../../../config/env.js';
import { runMigrations } from '../../../db/engine/migrate.js';
import { closeAll as closeEnginePools } from '../../../db/engine/pool.js';
import {
  ensureDatabase,
  ensureDatabaseUser,
  ensureMigratorUser
} from '../../../db/engine/setup/database.js';
import { cleanup } from '../../../db/engine/setup/cleanup.js';

const ADMIN_ENV_KEYS = [
  'BAROTRADER_DB_ADMIN_DBNAME',
  'BAROTRADER_DB_ADMIN_USER',
  'BAROTRADER_DB_ADMIN_PASS'
];

const TRACKED_ENV_KEYS = [
  'APP_ENV',
  'NODE_ENV',
  'DB_DBNAME',
  'DB_USER',
  'DB_PASS',
  'DATABASE_URL',
  'MIGRATION_DB',
  'MIGRATION_USER',
  'MIGRATION_PASS',
  'MIGRATIONS_DATABASE_URL',
  'DB_ALLOW_DESTRUCTIVE',
  'DB_DESTRUCTIVE_CONFIRM',
  'DB_BASE_ROLE',
  'HASH_PEPPER',
  'REGISTER_MIN_DELAY_MS'
];

const LEGACY_SUFFIX_LENGTH = 22;
function envFlag(name) {
  loadEnv();
  const value = String(process.env[name] || '').toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
}

function createToken(prefix) {
  const normalizedPrefix = String(prefix || 'it')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');
  const shortPrefix = normalizedPrefix.slice(0, 8) || 'it';
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(3).toString('hex');
  return `${shortPrefix}_${timestamp}_${random}`.slice(0, 30);
}

function createLegacySuffix(suiteName) {
  const normalizedSuite = String(suiteName || 'integration')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');

  return normalizedSuite.slice(0, LEGACY_SUFFIX_LENGTH) || 'integration';
}

function buildLegacyResourceNames(suiteName) {
  const legacySuffix = createLegacySuffix(suiteName);

  return {
    databaseName: `barotrader_test_${legacySuffix}`.slice(0, 63),
    runtimeUser: `rt_${legacySuffix}`.slice(0, 30),
    runtimePass: `${legacySuffix}_runtime_pw`,
    migratorUser: `mg_${legacySuffix}`.slice(0, 30),
    migratorPass: `${legacySuffix}_migrator_pw`,
    baseRole: `base_${legacySuffix}`.slice(0, 63)
  };
}

function buildDatabaseUrl({ host, port, database, user, password }) {
  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);
  return `postgres://${encodedUser}:${encodedPassword}@${host}:${port}/${database}`;
}

function assertAdminEnv() {
  const missing = ADMIN_ENV_KEYS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required admin environment variables for DB integration tests: ${missing.join(', ')}`
    );
  }
}

function describeError(error) {
  if (!error) return 'Unknown error';

  if (error instanceof AggregateError && Array.isArray(error.errors)) {
    const messages = error.errors
      .map((entry) => entry?.message || String(entry))
      .filter(Boolean);
    if (messages.length > 0) {
      return messages.join(' | ');
    }
  }

  return error.message || String(error);
}

function captureEnvironment() {
  return TRACKED_ENV_KEYS.reduce((snapshot, key) => {
    snapshot[key] = process.env[key];
    return snapshot;
  }, {});
}

function restoreEnvironment(snapshot) {
  TRACKED_ENV_KEYS.forEach((key) => {
    const value = snapshot[key];
    if (value === undefined) {
      delete process.env[key];
      return;
    }
    process.env[key] = value;
  });
}

function configureTestEnvironment({
  databaseName,
  runtimeUser,
  runtimePass,
  migratorUser,
  migratorPass,
  baseRole
}) {
  const host = process.env.HOST || 'localhost';
  const port = Number(process.env.PORT || 5432);

  process.env.APP_ENV = 'test';
  process.env.NODE_ENV = 'test';

  process.env.DB_DBNAME = databaseName;
  process.env.DB_USER = runtimeUser;
  process.env.DB_PASS = runtimePass;
  process.env.DATABASE_URL = buildDatabaseUrl({
    host,
    port,
    database: databaseName,
    user: runtimeUser,
    password: runtimePass
  });

  process.env.MIGRATION_DB = databaseName;
  process.env.MIGRATION_USER = migratorUser;
  process.env.MIGRATION_PASS = migratorPass;
  process.env.MIGRATIONS_DATABASE_URL = buildDatabaseUrl({
    host,
    port,
    database: databaseName,
    user: migratorUser,
    password: migratorPass
  });

  process.env.DB_ALLOW_DESTRUCTIVE = 'YES';
  process.env.DB_DESTRUCTIVE_CONFIRM = databaseName;
  process.env.DB_BASE_ROLE = baseRole;
  process.env.HASH_PEPPER = process.env.HASH_PEPPER || 'integration-test-pepper';
  process.env.REGISTER_MIN_DELAY_MS = process.env.REGISTER_MIN_DELAY_MS || '0';
}

async function closeRuntimeModel() {
  const { closeUserModel } = await import('../../../src/models/user/index.js');
  await closeUserModel();
}

async function cleanupLegacyResources({ suiteName, activeDatabaseName }) {
  const legacyResources = buildLegacyResourceNames(suiteName);

  if (legacyResources.databaseName === activeDatabaseName) {
    return;
  }

  const snapshot = captureEnvironment();

  try {
    configureTestEnvironment(legacyResources);
    await cleanup();
    console.log(
      `[db-harness] ${suiteName}: legacy cleanup completed (${legacyResources.databaseName})`
    );
  } catch (error) {
    console.warn(
      `[db-harness] ${suiteName}: legacy cleanup skipped for ${legacyResources.databaseName}: ${describeError(error)}`
    );
  } finally {
    restoreEnvironment(snapshot);
  }
}

function createIntegrationDbHarness({ suiteName }) {
  const safeSuiteName = String(suiteName || 'integration').replace(/[^a-zA-Z0-9_]/g, '');
  const suffix = createToken(safeSuiteName);
  const databaseName = `barotrader_test_${suffix}`.slice(0, 63);
  const runtimeUser = `rt_${suffix}`.slice(0, 30);
  const runtimePass = `${suffix}_runtime_pw`;
  const migratorUser = `mg_${suffix}`.slice(0, 30);
  const migratorPass = `${suffix}_migrator_pw`;
  const baseRole = `base_${suffix}`.slice(0, 63);
  const state = {
    configured: false,
    snapshot: null
  };

  async function setup() {
    try {
      loadEnv();
      assertAdminEnv();

      state.snapshot = captureEnvironment();
      configureTestEnvironment({
        databaseName,
        runtimeUser,
        runtimePass,
        migratorUser,
        migratorPass,
        baseRole
      });

      await ensureDatabaseUser();
      await ensureMigratorUser();
      await ensureDatabase();
      await runMigrations('up');

      state.configured = true;

      console.log(
        `[db-harness] ${suiteName}: database ready (${databaseName})`
      );

      return {
        databaseName,
        runtimeUser,
        migratorUser
      };
    } catch (error) {
      if (state.snapshot && !envFlag('KEEP_DB')) {
        try {
          await cleanup();
        } catch (cleanupError) {
          console.warn(
            `[db-harness] ${suiteName}: failed to cleanup partially-provisioned database ${databaseName}: ${describeError(cleanupError)}`
          );
        }
      }

      await closeEnginePools();
      if (state.snapshot) {
        restoreEnvironment(state.snapshot);
      }
      throw new Error(
        `[db-harness] ${suiteName}: failed to provision test database (${databaseName}). ${describeError(error)}`,
        { cause: error }
      );
    }
  }

  async function teardown() {
    try {
      if (!state.configured) {
        return;
      }

      const keepDatabase = envFlag('KEEP_DB');

      await closeRuntimeModel();

      if (keepDatabase) {
        console.log(
          `[db-harness] ${suiteName}: KEEP_DB=1 enabled, skipping cleanup for ${databaseName}.`
        );
      } else {
        await cleanup();
        await cleanupLegacyResources({
          suiteName,
          activeDatabaseName: databaseName
        });
        console.log(`[db-harness] ${suiteName}: cleanup completed (${databaseName})`);
      }
    } finally {
      await closeEnginePools();
      if (state.snapshot) {
        restoreEnvironment(state.snapshot);
      }
      state.configured = false;
    }
  }

  return {
    setup,
    teardown
  };
}

export { createIntegrationDbHarness };
