
/*
This module organizes and exports SQL query files
using pg-promise's QueryFile feature. It provides a
structured way to access SQL scripts for different
parts of the application, such as infrastructure setup
and user operations.
*/

import { fileURLToPath } from 'url';
import pkg from 'pg-promise';
import path from 'path';

const { QueryFile } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const qf = (relativePath) => new QueryFile(
    path.join(__dirname, relativePath),
    { minify: true }
);

const sql = {
    infra: {
        database: {
            checkExists: qf('./infra/database/check_db.sql'),
            create: qf('./infra/database/create_db.sql'),
            drop: qf('./infra/database/clean_db.sql')
        },
        roles: {
            checkExists: qf('./infra/roles/check_role.sql'),
            create: qf('./infra/roles/create_role.sql'),
            grantPermissions: qf('./infra/roles/permissions.sql'),
            drop: qf('./infra/roles/clean_db_role.sql')
        },
        users: {
            checkExists: qf('./infra/users/check_user.sql'),
            create: qf('./infra/users/create_user.sql'),
            drop: qf('./infra/users/clean_db_user.sql')
        }
    },
    user: {
        createTable: qf('./user/create_user_table.sql'),
        insert: qf('./user/insert_user.sql'),
        selectById: qf('./user/select_user_by_id.sql'),
        selectByUsername: qf('./user/select_user_by_username.sql')
    },
    seed: {
        createUserTable: qf('./seed/create_user_table.sql'),
        insertUser: qf('./seed/insert_user_table.sql'),
        selectUser: qf('./seed/select_user_table_1.sql')
    }
};

export default sql;
export { sql };
