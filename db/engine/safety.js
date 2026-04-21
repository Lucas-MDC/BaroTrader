/*
Guards for destructive database operations in non-production environments.
*/

import { getAppEnv } from '../../config/index.js';

export function assertDestructiveAllowed({ targetDatabase }) {
    /*
    Ensure destructive actions are explicitly allowed for the target database.
    */
    if (!targetDatabase) {
        throw new Error('Target database name is required for destructive checks.');
    }

    const appEnv = getAppEnv();
    const allowFlag = process.env.DB_ALLOW_DESTRUCTIVE;
    const confirm = process.env.DB_DESTRUCTIVE_CONFIRM;

    console.log(`Destructive target database: ${targetDatabase}`);

    if (appEnv !== 'development' && appEnv !== 'test') {
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
