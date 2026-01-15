/*
This module provides utility functions for database operations,
including loading SQL files with caching, implementing sleep 
functionality, and connecting to a database with retry logic.
*/

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const cache = new Map();

export async function loadSql(name) {

    /*
    Load a SQL file from the sql directory and cache the contents.
    */

    if (cache.has(name)) return cache.get(name);
    const baseDir = path.dirname(fileURLToPath(import.meta.url));
    const p = path.join(baseDir, '..', '..', 'sql', name);
    
    const sql = await fs.readFile(p, 'utf8');
    cache.set(name, sql);
    return sql;
}

export function sleep(ms) {

    /*
    Sleep for the specified number of milliseconds.
    */

    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function connectWithRetries(
    config, dbDriver, retries = 3, baseDelay = 500
) {

    /*
    Attempt to connect with exponential backoff and retry logic.
    */

    for (let i = 0; i < retries; i++) {
        try {
            const connection = await dbDriver(config);
            console.log(`Connected to DB as ${config.user}`);
            return connection;

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
