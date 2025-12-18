/*
This module is responsible for ensuring that all necessary 
database entities (such as tables, indexes, and constraints) 
are created and properly configured.

Each model entity has a method `ensureTable` that checks for 
the existence of the table and creates it if it does not exist. 
This function calls these methods for all required entities 
in the correct order to satisfy dependencies.

All entities of the project should be called here in 
"ensureDatabaseEntities()".
*/

import { ownerDb } from '../pool.js';
import { createUserModel } from '../../../models/user/userModel.js';

async function ensureDatabaseEntities() {

    /*
    Ensure that all necessary database entities are created.
    All entities should have their own `ensureTable` method 
    that handles their creation here.
    */

    console.log('||| [Schema] Step 3 - Ensuring database entities exist |||');
    
    const userModel = createUserModel(ownerDb);
    await userModel.ensureTable();

    console.log('Database entities models created');
}

export {
    ensureDatabaseEntities
};
