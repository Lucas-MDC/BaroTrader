/*
Validates canonical environment contracts for runtime and test workflows.
*/

import {
    getAppConfig,
    getBaseRole,
    getHashConfig,
    getMigrationsDbConfig,
    getRegisterConfig,
    getRuntimeDbConfig,
    getTestAdminDbConfig
} from '../config/index.js';

function printUsage() {
    console.log('Usage: node scripts/validate-env.js <test|runtime>');
}

function validateRuntimeContract() {
    getAppConfig();
    getBaseRole();
    getHashConfig();
    getRegisterConfig();
    getRuntimeDbConfig();
    getMigrationsDbConfig();
}

function validateTestContract() {
    validateRuntimeContract();
    getTestAdminDbConfig();
}

const mode = process.argv[2];

try {
    switch (mode) {
        case 'runtime':
            validateRuntimeContract();
            break;
        case 'test':
            validateTestContract();
            break;
        default:
            printUsage();
            process.exit(1);
    }
} catch (error) {
    console.error(`Environment validation failed: ${error.message}`);
    process.exit(1);
}
