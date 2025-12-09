import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const cache = new Map();

export async function loadSql(name) {
    if (cache.has(name)) return cache.get(name);
    const baseDir = path.dirname(fileURLToPath(import.meta.url));
    const p = path.join(baseDir, '..', 'sql', name);
    
    const sql = await fs.readFile(p, 'utf8');
    cache.set(name, sql);
    return sql;
}

export function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export async function connectWithRetries(
    config, dbDriver, retries = 3, baseDelay = 500
) {
    for (let i = 0; i < retries; i++) {
        try {
            let p = await dbDriver(config);
            console.log(`Connected to DB as ${config.user}`);
            return p;

        } catch (err) {
            if (i === retries - 1) throw err;
            console.warn(
                `Connection attempt ${i + 1} failed. ` +
                `Retrying in ${baseDelay * (2 ** i)} ms...`
            );
            await sleep(baseDelay * (2 ** i));

        }
    }
}