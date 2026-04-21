/*
Application-level runtime configuration helpers.
*/

import { loadEnv } from './env.js';
import { assertRequired } from './db.shared.js';

const ALLOWED_APP_ENVS = new Set(['development', 'test', 'production']);

function parsePort(value, label) {
    const port = Number.parseInt(String(value || ''), 10);
    if (!Number.isInteger(port) || port <= 0) {
        throw new Error(`${label} must be a positive integer.`);
    }

    return port;
}

export function getAppEnv() {
    /*
    Resolve and validate the canonical application environment.
    */
    loadEnv();

    const appEnv = assertRequired(process.env.APP_ENV, 'APP_ENV');
    if (!ALLOWED_APP_ENVS.has(appEnv)) {
        throw new Error(
            `APP_ENV must be one of: ${Array.from(ALLOWED_APP_ENVS).join(', ')}.`
        );
    }

    return appEnv;
}

export function getAppConfig() {
    /*
    Resolve the host/port tuple used by the HTTP server.
    */
    return {
        env: getAppEnv(),
        host: assertRequired(process.env.APP_HOST, 'APP_HOST'),
        port: parsePort(process.env.APP_PORT, 'APP_PORT')
    };
}
