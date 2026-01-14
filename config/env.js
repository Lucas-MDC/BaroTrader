/*
Environment loader that reads .env once and preserves admin overrides.
*/

import fs from 'fs';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import path from 'path';
import { fileURLToPath } from 'url';

let loaded = false;
const ADMIN_KEYS = [
    'BAROTRADER_DB_ADMIN_DBNAME',
    'BAROTRADER_DB_ADMIN_USER',
    'BAROTRADER_DB_ADMIN_PASS'
];
const FILE_ENV_KEYS = [
    'BAROTRADER_DB_ADMIN_PASS',
    'DB_PASS',
    'MIGRATION_PASS',
    'DATABASE_URL',
    'MIGRATIONS_DATABASE_URL',
    'MIGRATION_DATABASE_URL',
    'HASH_PEPPER'
];

export function loadEnv() {
    /*
    Load .env (with variable expansion) a single time and keep admin env overrides.
    */
    if (loaded) return;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const envPath = path.resolve(__dirname, '..', '.env');

    const existingAdmin = {};
    ADMIN_KEYS.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(process.env, key)) {
            existingAdmin[key] = process.env[key];
        }
    });

    const result = dotenv.config({ path: envPath });
    if (typeof dotenvExpand.expand === 'function') {
        dotenvExpand.expand(result);
    } else if (typeof dotenvExpand === 'function') {
        dotenvExpand(result);
    }

    ADMIN_KEYS.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(existingAdmin, key)) {
            process.env[key] = existingAdmin[key];
        } else {
            delete process.env[key];
        }
    });

    FILE_ENV_KEYS.forEach((key) => {
        if (process.env[key]) return;

        const fileKey = `${key}_FILE`;
        const filePath = process.env[fileKey];
        if (!filePath) return;

        try {
            const contents = fs.readFileSync(filePath, 'utf8');
            const value = contents.trim();
            if (!value) {
                throw new Error(`Secret file ${filePath} is empty for ${key}.`);
            }
            process.env[key] = value;
        } catch (error) {
            throw new Error(`Unable to read ${fileKey} at ${filePath}: ${error.message}`);
        }
    });
    loaded = true;
}
