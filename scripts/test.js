/*
Development helper CLI that centralizes Jest execution flags.
Keeps package.json scripts short and forwards extra Jest arguments.
*/

import os from 'os';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from '../config/env.js';
import { getTestAdminDbConfig } from '../config/index.js';

const projectRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..'
);
const testComposeFile = 'compose.test.yaml';
const localTestDbHost = '127.0.0.1';
const localTestDbPort = '55432';
const jestBinPath = path.join(
    projectRoot,
    'node_modules',
    'jest',
    'bin',
    'jest.js'
);

const modeArgsMap = {
    all: ['--runInBand'],
    unit: ['--selectProjects', 'unit'],
    integration: ['--selectProjects', 'integration', '--runInBand'],
    'integration:debug': ['--selectProjects', 'integration', '--runInBand'],
    coverage: ['--coverage', '--runInBand', '--verbose']
};
let dockerCommand;

function printUsage() {

    /*
    Print CLI usage instructions for test execution.
    */

    console.log(
        'Usage: node scripts/test.js <all|unit|integration|integration:debug|coverage> [jest args]'
    );
}

function isWsl() {
    /*
    Detect WSL to support Docker Desktop's docker.exe fallback.
    */
    return process.platform === 'linux' && /microsoft/i.test(os.release());
}

function resolveDockerCommand() {
    /*
    Resolve the Docker CLI executable across Linux, Windows, and WSL.
    */
    if (dockerCommand) {
        return dockerCommand;
    }

    const candidates = ['docker'];
    if (process.platform === 'win32' || isWsl()) {
        candidates.push('docker.exe');
    }

    for (const candidate of candidates) {
        const result = spawnSync(candidate, ['version'], {
            cwd: projectRoot,
            stdio: 'ignore'
        });

        if (!result.error) {
            dockerCommand = candidate;
            return dockerCommand;
        }
    }

    dockerCommand = candidates[0];
    return dockerCommand;
}

function ensureDocker() {
    /*
    Verify that the Docker daemon is available before running Compose.
    */
    const result = spawnSync(resolveDockerCommand(), ['info'], {
        cwd: projectRoot,
        encoding: 'utf8'
    });

    if (result.error?.code === 'ENOENT') {
        throw new Error('Docker CLI was not found in PATH. Install Docker Desktop/Engine and retry.');
    }

    const stderr = String(result.stderr || '').trim();
    const stdout = String(result.stdout || '').trim();
    const details = [stderr, stdout].filter(Boolean).join('\n');

    if (result.status !== 0) {
        if (/permission denied while trying to connect to the docker api/i.test(details)) {
            throw new Error(
                'Docker CLI is installed, but this user cannot access the Docker daemon/socket.'
            );
        }

        throw new Error('Docker is not available. Start Docker Desktop/daemon and retry.');
    }
}

function composeArgs() {
    /*
    Build the Compose arguments for the local test stack.
    */
    return ['compose', '-f', testComposeFile];
}

function runDocker(args) {
    /*
    Run Docker and fail fast on command errors.
    */
    const result = spawnSync(resolveDockerCommand(), args, {
        cwd: projectRoot,
        stdio: 'inherit',
        env: { ...process.env }
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        throw new Error(`Docker command failed with exit code ${result.status || 1}.`);
    }
}

function envFlag(name) {
    loadEnv();
    const value = String(process.env[name] || '').toLowerCase();
    return value === '1' || value === 'true' || value === 'yes';
}

function modeRequiresDbInfra(mode) {
    /*
    Determine whether the selected test mode includes DB-backed integration tests.
    */
    return mode === 'all' || mode === 'integration' || mode === 'integration:debug' || mode === 'coverage';
}

function prepareCiDbEnv() {
    /*
    Normalize DB host/port defaults for GitHub Actions service containers.
    */
    process.env.DB_HOST = process.env.DB_HOST || localTestDbHost;
    process.env.DB_PORT = process.env.DB_PORT || '5432';
    delete process.env.TEST_KEEP_DB;
}

function prepareLocalDbEnv() {
    /*
    Point the test process at the local Dockerized PostgreSQL test base.
    */
    process.env.DB_HOST = localTestDbHost;
    process.env.DB_PORT = localTestDbPort;
}

function ensureLocalTestStack() {
    /*
    Start the local PostgreSQL base used by DB-backed integration tests.
    */
    ensureDocker();
    runDocker([...composeArgs(), 'up', '-d', '--wait', 'db']);
    prepareLocalDbEnv();
}

function teardownLocalTestStack() {
    /*
    Stop and remove the local PostgreSQL base unless debug preservation is enabled.
    */
    if (envFlag('TEST_KEEP_DB')) {
        const testAdminConfig = getTestAdminDbConfig();
        console.log(
            `[test stack] TEST_KEEP_DB=1 enabled. Local test stack preserved at ${localTestDbHost}:${localTestDbPort} (${testAdminConfig.database}).`
        );
        return;
    }

    runDocker([...composeArgs(), 'down', '--volumes', '--remove-orphans']);
}

function validateTestEnv() {
    /*
    Validate the full canonical test contract before running Jest.
    */
    const result = spawnSync(process.execPath, ['scripts/validate-env.js', 'test'], {
        cwd: projectRoot,
        stdio: 'inherit',
        env: { ...process.env }
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        throw new Error(`Environment validation failed with exit code ${result.status || 1}.`);
    }
}

function normalizeCliArgs(args) {

    /*
    Remove npm/direct CLI separators before forwarding to Jest.
    */

    return args.filter((arg) => arg !== '--');
}

const args = process.argv.slice(2);
const mode = args[0] || 'all';
const extraArgs = normalizeCliArgs(args.slice(1));
const modeArgs = modeArgsMap[mode];
let localStackStarted = false;
let exitCode = 0;

if (!modeArgs) {
    printUsage();
    process.exit(1);
}

try {
    if (modeRequiresDbInfra(mode)) {
        loadEnv();
        if (envFlag('GITHUB_ACTIONS')) {
            prepareCiDbEnv();
        } else {
            ensureLocalTestStack();
            localStackStarted = true;
        }
        validateTestEnv();
    }

    const result = spawnSync(
        process.execPath,
        ['--experimental-vm-modules', jestBinPath, ...modeArgs, ...extraArgs],
        {
            cwd: projectRoot,
            stdio: 'inherit',
            env: { ...process.env }
        }
    );

    if (result.error) {
        throw result.error;
    }

    exitCode = result.status || 0;
} catch (error) {
    console.error(error.message);
    exitCode = 1;
} finally {
    if (localStackStarted) {
        try {
            teardownLocalTestStack();
        } catch (error) {
            console.error(error.message);
            exitCode = 1;
        }
    }
}

process.exit(exitCode);
