const { spawnSync } = require('child_process');
const path = require('path');
const { pathToFileURL } = require('url');

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

const projectRoot = path.resolve(__dirname, '../../..');
const envModuleUrl = pathToFileURL(path.join(projectRoot, 'config', 'env.js')).href;
const poolModuleUrl = pathToFileURL(path.join(projectRoot, 'db', 'engine', 'pool.js')).href;
const devScriptPath = path.join(projectRoot, 'scripts', 'dev.js');

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function envFlag(name) {
    const value = String(process.env[name] || '').trim().toLowerCase();
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

async function loadProjectEnv() {
    const { loadEnv } = await import(envModuleUrl);
    loadEnv();
}

async function canUseConfiguredAdminDb() {
    if (!ADMIN_ENV_KEYS.every((key) => process.env[key])) {
        return false;
    }

    const { closeAll, getAdminDb } = await import(poolModuleUrl);

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
        await closeAll();
    }
}

function runLocalBootstrap() {
    console.log(
        '[integration setup] No reachable admin DB was found. Bootstrapping the local Docker Postgres stack.'
    );

    const result = spawnSync(process.execPath, [devScriptPath, 'bootstrap'], {
        cwd: projectRoot,
        stdio: 'inherit'
    });

    if (result.error) {
        throw new Error(
            `Unable to bootstrap the local integration database: ${result.error.message}`
        );
    }

    if (result.status !== 0) {
        throw new Error(
            'Unable to bootstrap the local integration database. ' +
            'Start Docker Desktop/daemon, or export BAROTRADER_DB_ADMIN_* to a reachable PostgreSQL instance.'
        );
    }

    process.env.BAROTRADER_DB_ADMIN_DBNAME = 'postgres';
    process.env.BAROTRADER_DB_ADMIN_USER = 'postgres';
    process.env.BAROTRADER_DB_ADMIN_PASS = 'postgres';
    process.env.HOST = 'localhost';
    process.env.PORT = '5432';
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5432';
}

module.exports = async () => {
    await loadProjectEnv();

    process.env.APP_ENV = 'test';
    process.env.NODE_ENV = 'test';

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
};
