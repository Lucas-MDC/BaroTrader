import { ownerDb } from '../pool.js';
import { createUserModel } from '../../../models/user/userModel.js';

async function ensureDatabaseEntities() {
    console.log('||| Ensuring database entities exist... |||');

    const userModel = createUserModel(ownerDb);
    await userModel.ensureTable();

    console.log('Entidades do banco asseguradas');
}

export {
    ensureDatabaseEntities
};
