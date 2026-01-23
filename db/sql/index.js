/*
Central registry for SQL files via pg-promise QueryFile.
Runtime queries live under db/sql/runtime and tooling SQL under db/sql/infra.
*/

import { fileURLToPath } from 'url';
import path from 'path';
import pkg from 'pg-promise';

const { QueryFile } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const qf = (relativePath) => {
    /*
    Create a pg-promise QueryFile from a path relative to this directory.
    */
    return new QueryFile(
        path.join(__dirname, relativePath),
        { minify: true }
    );
};

const sql = {
    infra: {
        database: {
            checkExists: qf('./infra/database/check_db.sql'),
            create: qf('./infra/database/create_db.sql'),
            drop: qf('./infra/database/clean_db.sql')
        },
        roles: {
            drop: qf('./infra/roles/clean_db_role.sql')
        },
        users: {
            checkExists: qf('./infra/users/check_user.sql'),
            checkCreateRole: qf('./infra/users/check_createrole.sql'),
            create: qf('./infra/users/create_user.sql'),
            grantCreateRole: qf('./infra/users/grant_createrole.sql'),
            drop: qf('./infra/users/clean_db_user.sql')
        },
        seed: {
            insertUser: qf('./infra/seed/insert_user_table.sql'),
            selectUser: qf('./infra/seed/select_user_table_1.sql')
        }
    },
    runtime: {
        user: {
            insert: qf('./runtime/user/insert_user.sql'),
            selectById: qf('./runtime/user/select_user_by_id.sql'),
            selectByUsername: qf('./runtime/user/select_user_by_username.sql')
        }
    }
};

export default sql;
export { sql };
