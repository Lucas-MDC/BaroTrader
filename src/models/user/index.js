/*

* User Model Module

* This module provides access to the User model, ensuring 
that only one instance
* of the model is created and reused throughout the application. 
It also provides
* a function to close the database connection when needed.

*/

import { db } from '../../infra/db/pool.js';
import { createUserModel } from './userModel.js';

let cachedModel = null;

export function getUserModel() {

    /*
    This function returns the cached User model instance. 
    If the model has not been created yet, it initializes 
    it using the createUserModel function and caches it 
    for future use.
    */

    if (!cachedModel) {
        cachedModel = createUserModel(db);
    }
    return cachedModel;
}

export async function closeUserModel() {

    /*
    This function closes the database connection associated 
    with the User model and clears the cached model instance.
    */

    await db.close();
    cachedModel = null;
}

export { createUserModel } from './userModel.js';
