/*
Development helper CLI for test execution.
Locally it runs Jest inside the Compose test runner; in GitHub Actions it keeps
using the workflow-provided PostgreSQL service and the runner's npm install.
*/

import fs from 'fs';
import os from 'os';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const projectRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..'
);
const testComposeFile = 'compose.test.yaml';
const testRunnerService = 'test-runner';
const testContainerFlag = 'BAROTRADER_TEST_CONTAINER';
const localTestDbHost = '127.0.0.1';
const localTestDbPort = '55432';
const composeTestDbHost = 'db';
const composeTestDbPort = '5432';
const jestBinPath = path.join(
    projectRoot,
    'node_modules',
    'jest',
    'bin',
    'jest.js'
);

const modeArgsMap = {
    all: ['--runInBand'],
    report: ['--runInBand', '--verbose'],
    unit: ['--selectProjects', 'unit'],
    'unit:report': ['--selectProjects', 'unit', '--verbose'],
    integration: ['--selectProjects', 'integration', '--runInBand'],
    'integration:debug': ['--selectProjects', 'integration', '--runInBand'],
    'integration:report': ['--selectProjects', 'integration', '--runInBand', '--verbose'],
    coverage: ['--coverage', '--runInBand', '--verbose']
};
const dbBackedModes = new Set([
    'all',
    'report',
    'integration',
    'integration:debug',
    'integration:report',
    'coverage'
]);
let dockerCommand;
let envFileCache;

function printUsage() {
    /*
    Print the accepted test modes and optional Jest passthrough arguments.
    */

    console.log(
        'Usage: node scripts/test.js <all|report|unit|unit:report|integration|integration:debug|integration:report|coverage> [jest args]'
    );
}

function parseEnvFileLine(line) {
    /*
    Parse one simple KEY=value line from .env for host-side launcher decisions.
    */

    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return null;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex <= 0) return null;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return null;

    if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
    ) {
        value = value.slice(1, -1);
    } else {
        const commentIndex = value.search(/\s#/);
        if (commentIndex !== -1) {
            value = value.slice(0, commentIndex).trim();
        }
    }

    return [key, value];
}

function readEnvFile() {
    /*
    Read and cache .env without importing dotenv on the host launcher path.
    */

    if (envFileCache) {
        return envFileCache;
    }

    envFileCache = new Map();
    const envPath = path.join(projectRoot, '.env');
    if (!fs.existsSync(envPath)) {
        return envFileCache;
    }

    const contents = fs.readFileSync(envPath, 'utf8');
    contents.split(/\r?\n/).forEach((line) => {
        const entry = parseEnvFileLine(line);
        if (entry) {
            envFileCache.set(entry[0], entry[1]);
        }
    });

    return envFileCache;
}

function envValue(name) {
    /*
    Resolve an environment value, preferring exported shell variables over .env.
    */

    if (process.env[name] !== undefined) {
        return process.env[name];
    }

    return readEnvFile().get(name);
}

function envFlag(name) {
    /*
    Interpret common truthy flag values from the resolved environment.
    */

    const value = String(envValue(name) || '').toLowerCase();
    return value === '1' || value === 'true' || value === 'yes';
}

function isWsl() {
    /*
    Detect WSL so Docker Desktop's docker.exe fallback can be considered.
    */

    return process.platform === 'linux' && /microsoft/i.test(os.release());
}

function resolveDockerCommand() {
    /*
    Resolve and cache the Docker CLI executable for the current platform.
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
    Verify that Docker is installed and this user can access the daemon.
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
    Build the base Compose command arguments for the isolated test project.
    */

    return ['compose', '-f', testComposeFile];
}

function runDocker(args) {
    /*
    Run Docker and throw when the command exits unsuccessfully.
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

function runDockerStatus(args) {
    /*
    Run Docker and return the process status for commands that own the test exit.
    */

    const result = spawnSync(resolveDockerCommand(), args, {
        cwd: projectRoot,
        stdio: 'inherit',
        env: { ...process.env }
    });

    if (result.error) {
        throw result.error;
    }

    return result.status || 0;
}

function normalizeCliArgs(args) {
    /*
    Remove npm/direct CLI separators before forwarding arguments to Jest.
    */

    return args.filter((arg) => arg !== '--');
}

function modeRequiresDbInfra(mode) {
    /*
    Identify modes that need the local PostgreSQL test base.
    */

    return dbBackedModes.has(mode);
}

function isCi() {
    /*
    Detect GitHub Actions so the workflow-provided services remain authoritative.
    */

    return envFlag('GITHUB_ACTIONS');
}

function isTestContainer() {
    /*
    Detect the Compose test-runner container to avoid recursive Docker orchestration.
    */

    return envFlag(testContainerFlag);
}

async function loadProjectEnv() {
    /*
    Load the project env contract inside Node environments that have dependencies.
    */

    const { loadEnv } = await import('../config/env.js');
    loadEnv();
}

function prepareCiDbEnv() {
    /*
    Normalize DB connection defaults for GitHub Actions PostgreSQL services.
    */

    process.env.DB_HOST = process.env.DB_HOST || localTestDbHost;
    process.env.DB_PORT = process.env.DB_PORT || '5432';
    delete process.env.TEST_KEEP_DB;
}

function prepareContainerDbEnv() {
    /*
    Point in-container tests at the Compose PostgreSQL service.
    */

    process.env.DB_HOST = process.env.DB_HOST || composeTestDbHost;
    process.env.DB_PORT = process.env.DB_PORT || composeTestDbPort;
}

async function validateTestEnv() {
    /*
    Validate the canonical test environment before DB-backed Jest runs.
    */

    const result = spawnSync(
        process.execPath, 
        ['scripts/validate-env.js', 'test'], 
    {
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

function printPreservedLocalStack() {
    /*
    Print the preserved local test DB details when TEST_KEEP_DB is enabled.
    */

    const database = envValue('TEST_DB') || 'unknown';
    console.log(
        `[test stack] TEST_KEEP_DB=1 enabled. Local test stack preserved at ${localTestDbHost}:${localTestDbPort} (${database}).`
    );
}

function ensureLocalTestStack() {
    /*
    Start the local PostgreSQL test base and wait for its healthcheck.
    */

    ensureDocker();
    runDocker([...composeArgs(), 'up', '-d', '--wait', 'db']);
}

function teardownLocalTestStack() {
    /*
    Stop the local test stack unless the caller requested preservation.
    */

    if (envFlag('TEST_KEEP_DB')) {
        printPreservedLocalStack();
        return;
    }

    runDocker([...composeArgs(), 'down', '--volumes', '--remove-orphans']);
}

function runLocalContainerizedTests(mode, extraArgs) {
    /*
    Host-side launcher: run the requested mode in the Compose test-runner.
    */

    const needsDb = modeRequiresDbInfra(mode);
    let composeTouched = false;
    let exitCode = 0;

    try {
        ensureDocker();
        if (needsDb) {
            ensureLocalTestStack();
            composeTouched = true;
        }

        const runArgs = [
            ...composeArgs(),
            'run',
            '--rm',
            '--build'
        ];
        if (!needsDb) {
            runArgs.push('--no-deps');
        }

        exitCode = runDockerStatus([
            ...runArgs,
            testRunnerService,
            'node',
            'scripts/test.js',
            mode,
            ...extraArgs
        ]);
        composeTouched = true;
    } catch (error) {
        console.error(error.message);
        exitCode = 1;
    } finally {
        if (composeTouched) {
            try {
                if (needsDb) {
                    teardownLocalTestStack();
                } else {
                    runDocker([...composeArgs(), 'down', '--volumes', '--remove-orphans']);
                }
            } catch (error) {
                console.error(error.message);
                exitCode = 1;
            }
        }
    }

    return exitCode;
}

async function runJest(mode, modeArgs, extraArgs) {
    /*
    Inner runner: execute Jest either inside the test container or in CI.
    */

    if (modeRequiresDbInfra(mode)) {
        await loadProjectEnv();
        if (isCi()) {
            prepareCiDbEnv();
        } else {
            prepareContainerDbEnv();
        }
        await validateTestEnv();
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

    return result.status || 0;
}

const args = process.argv.slice(2);
const mode = args[0] || 'all';
const extraArgs = normalizeCliArgs(args.slice(1));
const modeArgs = modeArgsMap[mode];
let exitCode = 0;

if (!modeArgs) {
    printUsage();
    process.exit(1);
}

if (!isCi() && !isTestContainer()) {
    exitCode = runLocalContainerizedTests(mode, extraArgs);
    process.exit(exitCode);
}

try {
    exitCode = await runJest(mode, modeArgs, extraArgs);
} catch (error) {
    console.error(error.message);
    exitCode = 1;
}

process.exit(exitCode);
