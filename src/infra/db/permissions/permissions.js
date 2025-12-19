/*
Creates the baseline role that represents the application user inside
the database and applies the privileges that role needs to operate.
*/

import { baseRole, dbConfigUser } from '../../../config/db.js';
import sql from '../../../sql/index.js';
import { ownerDb } from '../pool.js';

async function ensureBaseRole() {

    /*
    Ensure the reusable base role exists so we can attach grants to it
    and assign it to specific users.
    */

    console.log('||| [Permissions] Step 4 - Ensuring base role exists |||');

    const roleCheck = await ownerDb.query(
        sql.infra.roles.checkExists,
        { rolname: baseRole }
    );

    if (roleCheck && roleCheck.length > 0) {
        console.log(`ROLE ${baseRole} already exists`);
        return;
    }

    await ownerDb.execute(
        sql.infra.roles.create,
        { rolname: baseRole }
    );
    console.log(`ROLE ${baseRole} created`);
}

async function applyBasePermissions() {

    /*
    Grant the privileges that map to the responsibilities of the base
    role and link that role to the application login.
    */

    console.log('||| [Permissions] Step 5 - Applying base permissions |||');

    await ownerDb.execute(
        sql.infra.roles.grantPermissions,
        {
            rolname: baseRole,
            user: dbConfigUser.user
        }
    );

    console.log('Permissions ensured in barotrader_db');
}

export {
    applyBasePermissions,
    ensureBaseRole
};
