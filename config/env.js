/*
Environment loader that reads .env once using canonical env names.
*/

import fs from 'fs';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import path from 'path';
import { fileURLToPath } from 'url';

let loaded = false;
const ENV_FILE_FORBIDDEN_KEYS = [
    'BAROTRADER_JWT_SECRET',
    'BAROTRADER_JWT_SECRET_FILE'
];
const FILE_ENV_KEYS = [
    'BAROTRADER_DB_ADMIN_PASSWORD',
    'MIGRATION_PASSWORD',
    'RUNTIME_PASSWORD',
    'TEST_PASSWORD',
    'HASH_PEPPER',
    'BAROTRADER_JWT_SECRET'
];

function assertForbiddenEnvFileKeys(envPath) {
    /*
    Some secrets must come from the process environment, secret files, or a
    future vault, never from the local .env defaults file.
    */
    if (!fs.existsSync(envPath)) return;

    const parsed = dotenv.parse(fs.readFileSync(envPath, 'utf8'));
    const forbiddenKeys = ENV_FILE_FORBIDDEN_KEYS.filter((key) =>
        Object.prototype.hasOwnProperty.call(parsed, key)
    );

    if (forbiddenKeys.length > 0) {
        throw new Error(
            `${forbiddenKeys.join(', ')} must not be defined in .env. Use system environment variables or *_FILE secrets.`
        );
    }
}

export function loadEnv() {
    /*
    Load .env (with variable expansion) once without overriding exported vars.
    */
    if (loaded) return;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const envPath = path.resolve(__dirname, '..', '.env');

    assertForbiddenEnvFileKeys(envPath);

    const result = dotenv.config({ path: envPath, quiet: true });
    if (typeof dotenvExpand.expand === 'function') {
        dotenvExpand.expand(result);
    } else if (typeof dotenvExpand === 'function') {
        dotenvExpand(result);
    }

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
