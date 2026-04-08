/*
Development helper CLI that centralizes Jest execution flags.
Keeps package.json scripts short and forwards extra Jest arguments.
*/

import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const projectRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..'
);
const jestBinPath = path.join(
    projectRoot,
    'node_modules',
    'jest',
    'bin',
    'jest.js'
);

const modeArgsMap = {
    all: [],
    unit: ['--selectProjects', 'unit'],
    integration: ['--selectProjects', 'integration'],
    'integration:debug': ['--selectProjects', 'integration', '--runInBand'],
    coverage: ['--coverage', '--runInBand', '--verbose']
};

function printUsage() {

    /*
    Print CLI usage instructions for test execution.
    */

    console.log(
        'Usage: node scripts/test.js <all|unit|integration|integration:debug|coverage> [jest args]'
    );
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

if (!modeArgs) {
    printUsage();
    process.exit(1);
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
    console.error(result.error.message);
    process.exit(1);
}

process.exit(result.status || 0);
