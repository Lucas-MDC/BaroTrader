/*
Development helper CLI that wraps Docker Compose tasks for the project.
Keeps the bring-up flow consistent across environments.
*/

import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const projectRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..'
);
const composeFiles = ['compose.yaml', 'compose.dev.yaml'];

function composeArgs() {

    /*
    Build the Compose file arguments in the correct order.
    */

    return composeFiles.flatMap((file) => ['-f', file]);
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

function ensureDocker() {

    /*
    Verify that the Docker daemon is available before running Compose.
    */

    const result = spawnSync('docker', ['info'], {
        cwd: projectRoot,
        stdio: 'ignore'
    });

    if (result.status !== 0) {
        console.error('Docker is not available. Start Docker Desktop/daemon and retry.');
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
        run('docker', [...baseUpArgs, ...extraArgs.filter((arg) => arg !== '--no-build')]);
        break;
    }
    case 'down':
        ensureDocker();
        run('docker', [...baseArgs, 'down', ...extraArgs]);
        break;
    case 'reset':
        ensureDocker();
        run('docker', [...baseArgs, 'down', '--volumes', ...extraArgs]);
        break;
    case 'bootstrap':
        ensureDocker();
        run('docker', [...baseArgs, 'up', '-d', 'db']);
        run('docker', [
            ...baseArgs,
            'run',
            '--rm',
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
