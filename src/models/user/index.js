import { db } from '../../infra/db/pool.js';
import { createUserModel } from './userModel.js';

let cachedModel = null;

export function getUserModel() {
    if (!cachedModel) {
        cachedModel = createUserModel(db);
    }
    return cachedModel;
}

export async function closeUserModel() {
    await db.close();
    cachedModel = null;
}

export { createUserModel } from './userModel.js';
