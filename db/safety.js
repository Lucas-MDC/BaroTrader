/*
Guards for destructive database operations in non-production environments.
*/

import { loadEnv } from '../config/env.js';

const ALLOWED_ENVS = new Set(['development', 'test']);

export function assertDestructiveAllowed({ targetDatabase }) {
    /*
    Ensure destructive actions are explicitly allowed for the target database.
    */
    loadEnv();

    if (!targetDatabase) {
        throw new Error('Target database name is required for destructive checks.');
    }

    const appEnv = process.env.APP_ENV || process.env.NODE_ENV;
    const allowFlag = process.env.DB_ALLOW_DESTRUCTIVE;
    const confirm = process.env.DB_DESTRUCTIVE_CONFIRM;

    console.log(`Destructive target database: ${targetDatabase}`);

    if (!appEnv) {
        throw new Error('APP_ENV (or NODE_ENV) must be set to development or test.');
    }

    if (!ALLOWED_ENVS.has(appEnv)) {
        throw new Error(
            `Destructive commands are blocked in APP_ENV=${appEnv}. ` +
            'Allowed values: development, test.'
        );
    }

    if (allowFlag !== 'YES') {
        throw new Error('DB_ALLOW_DESTRUCTIVE=YES is required to run destructive commands.');
    }

    if (!confirm) {
        throw new Error('DB_DESTRUCTIVE_CONFIRM must match the target database name.');
    }

    if (confirm !== targetDatabase) {
        throw new Error(
            `DB_DESTRUCTIVE_CONFIRM must match the target database (${targetDatabase}).`
        );
    }
}
