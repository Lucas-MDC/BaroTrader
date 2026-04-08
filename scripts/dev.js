/*
Development helper CLI that wraps Docker Compose tasks for the project.
Keeps the bring-up flow consistent across environments.
*/

import os from 'os';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const projectRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..'
);
const composeFiles = ['compose.yaml', 'compose.dev.yaml'];
let dockerCommand;

function composeArgs() {

    /*
    Build the Compose file arguments in the correct order.
    */

    return composeFiles.flatMap((file) => ['-f', file]);
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

function run(command, args, options = {}) {

    /*
    Run a child process and fail fast on errors or non-zero exits.
    */

    const result = spawnSync(command, args, {
        cwd: projectRoot,
        stdio: 'inherit',
        ...options
    });

    if (result.error) {
        console.error(result.error.message);
        process.exit(1);
    }

    if (result.status !== 0) {
        process.exit(result.status || 1);
    }
}

function runDocker(args, options = {}) {

    /*
    Run Docker using the resolved CLI name for the current platform.
    */

    run(resolveDockerCommand(), args, options);
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
        console.error(
            'Docker CLI was not found in PATH. Install Docker Desktop/Engine and retry.'
        );
        process.exit(1);
    }

    const stderr = String(result.stderr || '').trim();
    const stdout = String(result.stdout || '').trim();
    const details = [stderr, stdout].filter(Boolean).join('\n');

    if (result.status !== 0) {
        if (/permission denied while trying to connect to the docker api/i.test(details)) {
            console.error(
                'Docker CLI is installed, but this user cannot access the Docker daemon/socket.'
            );
            console.error(
                'On Linux, start Docker and/or add your user to the docker group. ' +
                'On Windows/WSL, ensure Docker Desktop is running and WSL integration is enabled.'
            );
            process.exit(1);
        }

        const lastDetailLine = details.split('\n').filter(Boolean).at(-1);

        console.error('Docker is not available. Start Docker Desktop/daemon and retry.');
        if (lastDetailLine) {
            console.error(lastDetailLine);
        }
        process.exit(1);
    }
}

function openBrowser(url) {

    /*
    Open a URL in the default browser on the current platform.
    */

    if (process.platform === 'win32') {
        run('cmd', ['/c', 'start', '', url], { stdio: 'ignore' });
        return;
    }

    if (process.platform === 'darwin') {
        run('open', [url], { stdio: 'ignore' });
        return;
    }

    run('xdg-open', [url], { stdio: 'ignore' });
}

function printUsage() {

    /*
    Print CLI usage for the helper script.
    */

    console.log('Usage: node scripts/dev.js <up|down|reset|bootstrap|open> [extra args]');
}

const args = process.argv.slice(2);
const action = args[0] || 'up';
const extraArgs = args.slice(1).filter((arg) => arg !== '--');
const baseArgs = ['compose', ...composeArgs()];

switch (action) {
    case 'up': {
        ensureDocker();
        const wantsNoBuild = extraArgs.includes('--no-build');
        const baseUpArgs = [...baseArgs, 'up'];
        if (!wantsNoBuild) {
            baseUpArgs.push('--build');
        }
        runDocker([...baseUpArgs, ...extraArgs.filter((arg) => arg !== '--no-build')]);
        break;
    }
    case 'down':
        ensureDocker();
        runDocker([...baseArgs, 'down', ...extraArgs]);
        break;
    case 'reset':
        ensureDocker();
        runDocker([...baseArgs, 'down', '--volumes', ...extraArgs]);
        break;
    case 'bootstrap':
        ensureDocker();
        runDocker([...baseArgs, 'up', '-d', '--wait', 'db']);
        runDocker([
            ...baseArgs,
            'run',
            '--rm',
            '-e',
            'DB_HOST=db',
            '-e',
            'DB_PORT=5432',
            'migrate',
            'npm',
            'run',
            'db:setup'
        ]);
        break;
    case 'open': {
        const port = process.env.APP_PORT || '3000';
        openBrowser(`http://localhost:${port}`);
        break;
    }
    default:
        printUsage();
        process.exit(1);
}
