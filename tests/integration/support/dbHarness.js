import crypto from 'crypto';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from '../../../config/env.js';
import { runMigrations } from '../../../db/engine/migrate.js';
import {
  closeAll as closeEnginePools,
  getAdminDb
} from '../../../db/engine/pool.js';
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
const GITHUB_ACTIONS_POSTGRES_SERVICE_ENV_KEYS = {
  id: 'BAROTRADER_GHA_POSTGRES_SERVICE_ID',
  network: 'BAROTRADER_GHA_POSTGRES_SERVICE_NETWORK',
  port: 'BAROTRADER_GHA_POSTGRES_SERVICE_PORT'
};

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
const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);
const devScriptPath = path.join(projectRoot, 'scripts', 'dev.js');

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function envFlag(name) {
  loadEnv();
  const value = String(process.env[name] || '').toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
}

function readTrimmedEnv(name) {
  return String(process.env[name] || '').trim();
}

function requireGithubActionsPostgresServiceSignature() {
  const missing = Object.values(GITHUB_ACTIONS_POSTGRES_SERVICE_ENV_KEYS).filter(
    (name) => !readTrimmedEnv(name)
  );

  if (missing.length > 0) {
    throw new Error(
      '[db-harness] GITHUB_ACTIONS=true but the PostgreSQL service signature was not exported. ' +
      `Missing env vars: ${missing.join(', ')}. ` +
      'Export BAROTRADER_GHA_POSTGRES_SERVICE_ID from job.services.postgres.id, ' +
      'BAROTRADER_GHA_POSTGRES_SERVICE_NETWORK from job.services.postgres.network, ' +
      'and BAROTRADER_GHA_POSTGRES_SERVICE_PORT from job.services.postgres.ports[5432].'
    );
  }

  const portValue = readTrimmedEnv(GITHUB_ACTIONS_POSTGRES_SERVICE_ENV_KEYS.port);
  const port = Number(portValue);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(
      '[db-harness] GITHUB_ACTIONS=true but BAROTRADER_GHA_POSTGRES_SERVICE_PORT must be ' +
      `a valid port number. Received "${portValue}". ` +
      'Use job.services.postgres.ports[5432] as the source of truth.'
    );
  }

  return {
    id: readTrimmedEnv(GITHUB_ACTIONS_POSTGRES_SERVICE_ENV_KEYS.id),
    network: readTrimmedEnv(GITHUB_ACTIONS_POSTGRES_SERVICE_ENV_KEYS.network),
    port
  };
}

function applyConnectionEnvFromPort(port) {
  const normalizedPort = String(port);

  process.env.HOST = 'localhost';
  process.env.PORT = normalizedPort;
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = normalizedPort;
}

async function canUseConfiguredAdminDb() {
  if (!ADMIN_ENV_KEYS.every((key) => readTrimmedEnv(key))) {
    return false;
  }

  try {
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      try {
        await getAdminDb().query('SELECT 1 AS ok');
        return true;
      } catch {
        if (attempt === 5) {
          return false;
        }

        await sleep(1000);
      }
    }

    return false;
  } finally {
    await closeEnginePools();
  }
}

function describeBootstrapFailure(result) {
  const errorMessage = result.error?.message || '';
  const stderr = String(result.stderr || '').trim();
  const stdout = String(result.stdout || '').trim();
  const combinedOutput = [stderr, stdout].filter(Boolean).join('\n');

  if (result.error?.code === 'ENOENT' || /spawnSync .* ENOENT/i.test(errorMessage)) {
    return 'Docker CLI was not found in PATH. Install Docker Desktop/Engine, ' +
      'or export BAROTRADER_DB_ADMIN_* to a reachable PostgreSQL instance.';
  }

  if (/permission denied while trying to connect to the docker api/i.test(combinedOutput)) {
    return 'Docker CLI is installed, but the current user cannot access the Docker daemon. ' +
      'On Linux, start Docker and/or add your user to the docker group; on Windows/WSL, ' +
      'ensure Docker Desktop is running and WSL integration is enabled.';
  }

  if (/docker is not available/i.test(combinedOutput)) {
    return 'Docker could not be used from this shell. Start Docker Desktop/daemon, ' +
      'or export BAROTRADER_DB_ADMIN_* to a reachable PostgreSQL instance.';
  }

  const lastOutputLine = combinedOutput.split('\n').filter(Boolean).at(-1);
  if (lastOutputLine) {
    return lastOutputLine;
  }

  if (errorMessage) {
    return errorMessage;
  }

  return 'Start Docker Desktop/daemon, or export BAROTRADER_DB_ADMIN_* to a reachable PostgreSQL instance.';
}

function runLocalBootstrap() {
  console.log(
    '[integration setup] No reachable admin DB was found. Bootstrapping the local Docker Postgres stack.'
  );

  const result = spawnSync(process.execPath, [devScriptPath, 'bootstrap'], {
    cwd: projectRoot,
    encoding: 'utf8'
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.error) {
    throw new Error(
      `Unable to bootstrap the local integration database: ${result.error.message}`
    );
  }

  if (result.status !== 0) {
    throw new Error(
      `Unable to bootstrap the local integration database. ${describeBootstrapFailure(result)}`
    );
  }

  process.env.BAROTRADER_DB_ADMIN_DBNAME = 'postgres';
  process.env.BAROTRADER_DB_ADMIN_USER = 'postgres';
  process.env.BAROTRADER_DB_ADMIN_PASS = 'postgres';
  applyConnectionEnvFromPort(5432);
}

async function ensureAdminDbReady() {
  loadEnv();

  if (envFlag('GITHUB_ACTIONS')) {
    const ghaService = requireGithubActionsPostgresServiceSignature();
    applyConnectionEnvFromPort(ghaService.port);

    const canReuseConfiguredDb = await canUseConfiguredAdminDb();
    if (!canReuseConfiguredDb) {
      throw new Error(
        '[db-harness] GITHUB_ACTIONS=true but the PostgreSQL service declared in job.services.postgres ' +
        `was not reachable at localhost:${ghaService.port}. ` +
        'Ensure BAROTRADER_GHA_POSTGRES_SERVICE_ID, BAROTRADER_GHA_POSTGRES_SERVICE_NETWORK, ' +
        'and BAROTRADER_GHA_POSTGRES_SERVICE_PORT are exported from job.services.postgres.id, ' +
        'job.services.postgres.network, and job.services.postgres.ports[5432].'
      );
    }

    return;
  }

  const canReuseConfiguredDb = await canUseConfiguredAdminDb();
  if (canReuseConfiguredDb) {
    return;
  }

  runLocalBootstrap();
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
  const host = process.env.DB_HOST || process.env.HOST || 'localhost';
  const port = Number(process.env.DB_PORT || process.env.PORT || 5432);

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
  const resources = {
    databaseName: `barotrader_test_${suffix}`.slice(0, 63),
    runtimeUser: `rt_${suffix}`.slice(0, 30),
    runtimePass: `${suffix}_runtime_pw`,
    migratorUser: `mg_${suffix}`.slice(0, 30),
    migratorPass: `${suffix}_migrator_pw`,
    baseRole: `base_${suffix}`.slice(0, 63)
  };
  const state = {
    configured: false,
    snapshot: null
  };

  function configureProvisionedEnvironment() {
    configureTestEnvironment(resources);
  }

  async function setup() {
    try {
      loadEnv();
      await ensureAdminDbReady();
      assertAdminEnv();

      state.snapshot = captureEnvironment();
      configureProvisionedEnvironment();

      await ensureDatabaseUser();
      await ensureMigratorUser();
      await ensureDatabase();
      await runMigrations('up');

      state.configured = true;

      console.log(
        `[db-harness] ${suiteName}: database ready (${resources.databaseName})`
      );

      return {
        databaseName: resources.databaseName,
        runtimeUser: resources.runtimeUser,
        migratorUser: resources.migratorUser
      };
    } catch (error) {
      if (state.snapshot && !envFlag('KEEP_DB')) {
        try {
          configureProvisionedEnvironment();
          await cleanup();
        } catch (cleanupError) {
          console.warn(
            `[db-harness] ${suiteName}: failed to cleanup partially-provisioned database ${resources.databaseName}: ${describeError(cleanupError)}`
          );
        }
      }

      await closeEnginePools();
      if (state.snapshot) {
        restoreEnvironment(state.snapshot);
      }
      throw new Error(
        `[db-harness] ${suiteName}: failed to provision test database (${resources.databaseName}). ${describeError(error)}`,
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
          `[db-harness] ${suiteName}: KEEP_DB=1 enabled, skipping cleanup for ${resources.databaseName}.`
        );
      } else {
        configureProvisionedEnvironment();
        await cleanup();
        await cleanupLegacyResources({
          suiteName,
          activeDatabaseName: resources.databaseName
        });
        console.log(`[db-harness] ${suiteName}: cleanup completed (${resources.databaseName})`);
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
