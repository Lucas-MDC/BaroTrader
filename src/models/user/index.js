/*
User model accessors backed by the runtime database connection.
Caches a single model instance and exposes a close helper.
*/

import { db } from '../../db/pool.js';
import { createUserModel } from './userModel.js';

let cachedModel = null;

export function getUserModel() {

    /*
    Return the cached user model instance, creating it on demand.
    */

    if (!cachedModel) {
        cachedModel = createUserModel(db);
    }
    return cachedModel;
}

export async function closeUserModel() {

    /*
    Close the runtime database connection and clear the cache.
    */

    await db.close();
    cachedModel = null;
}

export { createUserModel } from './userModel.js';
