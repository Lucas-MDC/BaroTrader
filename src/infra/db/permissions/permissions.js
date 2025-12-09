import { baseRole, dbConfigUser } from '../../../config/db.js';
import sql from '../../../sql/index.js';
import { ownerDb } from '../pool.js';
import { createUserModel } from '../../../models/user/userModel.js';

async function ensureBaseRole() {
    console.log('||| Ensuring base role exists... |||');

    const roleCheck = await ownerDb.query(
        sql.infra.roles.checkExists,
        { rolname: baseRole }
    );

    if (roleCheck && roleCheck.length > 0) {
        console.log(`ROLE ${baseRole} ja existe`);
        return;
    }

    await ownerDb.execute(
        sql.infra.roles.create,
        { rolname: baseRole }
    );
    console.log(`ROLE ${baseRole} criado`);
}

async function applyBasePermissions() {
    console.log('||| Applying base permissions and schema... |||');

    await ownerDb.execute(
        sql.infra.roles.grantPermissions,
        {
            rolname: baseRole,
            user: dbConfigUser.user
        }
    );

    const userModel = createUserModel(ownerDb);
    await userModel.ensureTable();
    console.log('Schema e permissoes asseguradas em barotrader_db');
}

export {
    applyBasePermissions,
    ensureBaseRole
};
