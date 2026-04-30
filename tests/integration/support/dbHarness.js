import { loadEnv } from '../../../config/env.js';
import {
  getRuntimeDbConfig,
  getTestAdminDbConfig
} from '../../../config/index.js';
import { runMigrations } from '../../../db/engine/migrate.js';
import {
  closeAll as closeEnginePools,
  getTestAdminDb
} from '../../../db/engine/pool.js';
import {
  ensureDatabase,
  ensureDatabaseUser,
  ensureMigratorUser
} from '../../../db/engine/setup/database.js';
import { cleanup } from '../../../db/engine/setup/cleanup.js';

const TRACKED_ENV_KEYS = [
  'APP_ENV',
  'NODE_ENV',
  'DB_ALLOW_DESTRUCTIVE',
  'DB_DESTRUCTIVE_CONFIRM'
];

function envFlag(name) {
  loadEnv();
  const value = String(process.env[name] || '').toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
}

function shouldKeepDatabase() {
  return !envFlag('GITHUB_ACTIONS') && envFlag('TEST_KEEP_DB');
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

function configureTestEnvironment() {
  loadEnv();

  const runtimeConfig = getRuntimeDbConfig();

  process.env.APP_ENV = 'test';
  process.env.NODE_ENV = 'test';
  process.env.DB_ALLOW_DESTRUCTIVE = 'YES';
  process.env.DB_DESTRUCTIVE_CONFIRM = runtimeConfig.database;
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

async function closeRuntimeModel() {
  const { closeUserModel } = await import('../../../src/models/user/index.js');
  await closeUserModel();
}

async function cleanupProvisionedEnvironment() {
  configureTestEnvironment();
  await cleanup({ adminDb: getTestAdminDb() });
}

function printPreservedEnvironmentDetails() {
  const runtimeConfig = getRuntimeDbConfig();
  const testAdminConfig = getTestAdminDbConfig();

  console.log('[db-harness] TEST_KEEP_DB=1 enabled. Preserving local test infrastructure.');
  console.log(`[db-harness] Test admin: ${testAdminConfig.user}@${testAdminConfig.host}:${testAdminConfig.port}/${testAdminConfig.database}`);
  console.log(`[db-harness] Runtime DB preserved: ${runtimeConfig.database}`);
  console.log(`[db-harness] Runtime user: ${runtimeConfig.user}`);
}

function createIntegrationDbHarness({ suiteName }) {
  const state = {
    configured: false,
    snapshot: null
  };

  async function setup() {
    try {
      loadEnv();
      state.snapshot = captureEnvironment();
      configureTestEnvironment();

      const testAdminConfig = getTestAdminDbConfig();

      await cleanupProvisionedEnvironment();
      await ensureDatabaseUser({ adminDb: getTestAdminDb() });
      await ensureMigratorUser({
        adminDb: getTestAdminDb(),
        adminUser: testAdminConfig.user
      });
      await ensureDatabase({ adminDb: getTestAdminDb() });
      await runMigrations('up');

      state.configured = true;

      console.log(
        `[db-harness] ${suiteName}: database ready (${getRuntimeDbConfig().database})`
      );
    } catch (error) {
      if (state.snapshot && !shouldKeepDatabase()) {
        try {
          await cleanupProvisionedEnvironment();
        } catch (cleanupError) {
          console.warn(
            `[db-harness] ${suiteName}: failed to cleanup partially-provisioned database: ${describeError(cleanupError)}`
          );
        }
      }

      await closeEnginePools();
      if (state.snapshot) {
        restoreEnvironment(state.snapshot);
      }

      throw new Error(
        `[db-harness] ${suiteName}: failed to provision test database. ${describeError(error)}`,
        { cause: error }
      );
    }
  }

  async function teardown() {
    try {
      if (!state.configured) {
        return;
      }

      await closeRuntimeModel();

      if (shouldKeepDatabase()) {
        printPreservedEnvironmentDetails();
      } else {
        await cleanupProvisionedEnvironment();
        console.log(
          `[db-harness] ${suiteName}: cleanup completed (${getRuntimeDbConfig().database})`
        );
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
