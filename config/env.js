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

export function loadEnv() {
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
    loaded = true;
}
