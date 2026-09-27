/*
Run browser E2E tests against an isolated, migrated PostgreSQL test database.
*/

import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { createIntegrationDbHarness } from '../tests/integration/support/dbHarness.js';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const composeFile = 'compose.test.yaml';
const localDbHost = '127.0.0.1';
const localDbPort = '55432';
const ciDbPort = '5432';
const e2ePort = process.env.E2E_PORT || '4173';
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const playwrightCli = path.join(
  projectRoot,
  'node_modules',
  '@playwright',
  'test',
  'cli.js'
);

function envFlag(name) {
  const value = String(process.env[name] || '').toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
}

function isCi() {
  return envFlag('GITHUB_ACTIONS') || envFlag('CI');
}

function run(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env }
  });

  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status || 1}.`);
  }
}

function runStatus(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env }
  });

  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }

  return result.status || 0;
}

function startLocalDatabase() {
  run('docker', ['compose', '-f', composeFile, 'up', '-d', '--wait', 'db'], 'Starting the E2E database');
}

function stopLocalDatabase() {
  if (envFlag('TEST_KEEP_DB')) {
    console.log('[e2e] TEST_KEEP_DB=1 enabled. Preserving the local E2E database.');
    return;
  }

  run(
    'docker',
    ['compose', '-f', composeFile, 'down', '--volumes', '--remove-orphans'],
    'Stopping the E2E database'
  );
}

async function main() {
  const localDatabaseStarted = !isCi();
  let harness;
  let exitCode = 1;

  try {
    if (localDatabaseStarted) {
      process.env.DB_HOST = localDbHost;
      process.env.DB_PORT = localDbPort;
      process.env.APP_HOST = '127.0.0.1';
      process.env.APP_PORT = e2ePort;
      startLocalDatabase();
    } else {
      process.env.DB_HOST ||= localDbHost;
      process.env.DB_PORT ||= ciDbPort;
      process.env.APP_PORT ||= e2ePort;
    }

    process.env.PLAYWRIGHT_BASE_URL ||= `http://127.0.0.1:${process.env.APP_PORT}`;
    run(process.execPath, ['scripts/validate-env.js', 'test'], 'Validating the E2E environment');

    harness = createIntegrationDbHarness({ suiteName: 'e2e' });
    await harness.setup();

    run(npmCommand, ['run', 'build:frontend'], 'Building the frontend');
    exitCode = runStatus(
      process.execPath,
      [playwrightCli, 'test', ...process.argv.slice(2)],
      'Running Playwright tests'
    );
  } catch (error) {
    console.error(`[e2e] ${error.message}`);
  } finally {
    if (harness) {
      try {
        await harness.teardown();
      } catch (error) {
        console.error(`[e2e] Database teardown failed: ${error.message}`);
        exitCode = 1;
      }
    }

    if (localDatabaseStarted) {
      try {
        stopLocalDatabase();
      } catch (error) {
        console.error(`[e2e] Local database cleanup failed: ${error.message}`);
        exitCode = 1;
      }
    }
  }

  process.exitCode = exitCode;
}

await main();
