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
    Loads an SQL file from the 'sql' directory with caching.
    
    Args:
        name (string): The name of the SQL file to load.
    Returns:
        string: The contents of the SQL file.
    */

    if (cache.has(name)) return cache.get(name);
    const baseDir = path.dirname(fileURLToPath(import.meta.url));
    const p = path.join(baseDir, '..', 'sql', name);
    
    const sql = await fs.readFile(p, 'utf8');
    cache.set(name, sql);
    return sql;
}

/*
Sleeps for a specified number of milliseconds.
Args:
    ms (number): Number of milliseconds to sleep.
*/
export function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export async function connectWithRetries(
    config, dbDriver, retries = 3, baseDelay = 500
) {

    /*
    Tries to connect to a database with exponential backoff 
    retry logic.
    
    Args:
        config (object): Database connection configuration.
        dbDriver (function): Function that attempts to connect 
            to the database.
        retries (number): Number of retry attempts.
        baseDelay (number): Base delay in milliseconds for 
            exponential backoff.
    Returns:
        object: Database connection object.

    */

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