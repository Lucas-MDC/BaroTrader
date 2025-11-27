import dotenv from 'dotenv';
import process from 'process';
import { PostgreSQL } from './databaseWrappers/postgresql_wrapper.js';
import { sleep, connectWithRetries, loadSql } from './database_utils.js';

const checkUserQuery = 'check_user.sql';
const createUserQuery = 'create_user.sql';
const checkDatabaseQuery = 'check_db.sql';
const createDatabaseQuery = 'create_db.sql';
const checkRoleQuery = 'check_role.sql';
const createRoleQuery = 'create_role.sql';
const permissionsQuery = 'permissions.sql';
const createUserTableQuery = 'create_user_table.sql';
const insertUserQuery = 'insert_user_table.sql';
const selectUserTableQuery = 'select_user_table_1.sql';
const cleanDbQuery = 'clean_db.sql';
const cleanDbUserQuery = 'clean_db_user.sql';
const cleanDbRoleQuery = 'clean_db_role.sql';

dotenv.config();

const dbConfig_owner = {
    host: process.env.HOST,
    port: process.env.PORT,
    database: process.env.DB_ADMIN_DBNAME,
    user: process.env.DB_ADMIN_USER,
    password: process.env.DB_ADMIN_PASS
};

const dbConfig_user = {
    host: process.env.HOST,
    port: process.env.PORT,
    database: process.env.DB_DBNAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
};

const rolname = 'base_role_op';

async function setupBasePermissions() {

    console.log('||| Setting up base permissions and user... |||');
    let ownerConn = null;

    try {

        ownerConn = await connectWithRetries(
            dbConfig_owner, PostgreSQL
        );
        
        const userCheckStmt = await loadSql(checkUserQuery);
        const roleCheck = await ownerConn.query(
            userCheckStmt, { user: dbConfig_user.user }
        );
        
        if (!roleCheck || roleCheck.length === 0) {
            
            const createUserStmt = await loadSql(createUserQuery);
            await ownerConn.execute(createUserStmt, {
                user : dbConfig_user.user, 
                password: dbConfig_user.password
            });
            console.log(`ROLE ${dbConfig_user.user} criado`);

        } else {
            console.log(`ROLE ${dbConfig_user.user} já existe`);
        }

    } catch (err) {
        console.error('Error on setup user', err);
        throw err;

    } finally {
        if (ownerConn) await ownerConn.close();
    }
}

async function setupDatabase() {

    console.log('||| Setting up database... |||');
    let ownerConn = null;
    
    try {
        ownerConn = await connectWithRetries(
            dbConfig_owner, PostgreSQL
        );

        // criar database se não existir
        const dbCheckStmt = await loadSql(checkDatabaseQuery);
        const dbCheck = await ownerConn.query(
            dbCheckStmt,{ database: dbConfig_user.database }
        );
        if (!dbCheck || dbCheck.length === 0) {
            const createDbStmt = await loadSql(createDatabaseQuery);
            await ownerConn.execute(
                createDbStmt, {
                    user: dbConfig_user.user,
                    database: dbConfig_user.database
                }
            );
            console.log(`DATABASE ${dbConfig_user.database} criado`);

        } else {
            console.log(`DATABASE ${dbConfig_user.database} já existe`);

        }

    } catch (err) {
        console.error('Error on setup database', err);
        throw err;

    } finally {
        if (ownerConn) await ownerConn.close();
    }
}

async function createSchema() {
    console.log('||| Creating schema and permissions... |||');
    // aguardar um pouco para garantir que o novo DB esteja disponível
    await sleep(500);

    let ownerDbConn = null;
    
    try {

        ownerDbConn = await connectWithRetries({ 
            ...dbConfig_owner, 
            database: dbConfig_user.database 
        }, PostgreSQL);

        // criar role de permissão se não existir
        const roleCheckStmt = await loadSql(checkRoleQuery);
        const roleCheck = await ownerDbConn.query(
            roleCheckStmt, { rolname: rolname }
        );

        if (!roleCheck || roleCheck.length === 0) {
            const createRoleStmt = await loadSql(createRoleQuery);
            await ownerDbConn.execute(
                createRoleStmt, { rolname: rolname }
            );
            console.log(`ROLE ${rolname} criado`);
        } else {
            console.log(`ROLE ${rolname} já existe`);
        }

    } catch (err) {
        console.error('Error on permissions creation', err);
        throw err;

    } finally {
        if (ownerDbConn) await ownerDbConn.close();
    }
}

async function buildPermissions() {

    console.log('||| Building schema permissions... |||');
    let ownerDbConn = null;

    try {

        ownerDbConn = await connectWithRetries({ 
            ...dbConfig_owner, 
            database: dbConfig_user.database 
        }, PostgreSQL);

        // permissões e defaults
        const permissionsStmt = await loadSql(permissionsQuery);
        await ownerDbConn.execute(permissionsStmt, {
            rolname: rolname,
            user: dbConfig_user.user
        });

        // criar tabela se não existir
        const createUserTableStmt = await loadSql(createUserTableQuery);
        await ownerDbConn.execute(createUserTableStmt);
        console.log('Schema e permissões asseguradas em barotrader_db');

    } catch (err) {
        console.error('Error on building permissions', err);
        throw err;

    } finally {
        if (ownerDbConn) await ownerDbConn.close();
    }
}

async function runAsUser() {
    console.log('Running operations as db_user_barotrader_dev...');

    let userConn = null;

    try {

        userConn = await connectWithRetries(
            dbConfig_user, PostgreSQL
        );

        const insertStmt = await loadSql(insertUserQuery);
        await userConn.execute(
            insertStmt, { name: 'Teste' }
        );
        
        console.log('INSERT executado como db_user_barotrader_dev');
        
        const selectStmt = await loadSql(selectUserTableQuery);
        const rows = await userConn.query(
            selectStmt, { id: 1 }
        );

        console.log('SELECT retornou:', rows);

    } catch (err) {
        console.error('Error running as user', err);

    } finally {
        if (userConn) await userConn.close();

    }
}

async function cleanup() {
    console.log('Cleaning up: dropping database and roles...');

    let ownerConn = null;
    
    try {

        ownerConn = await connectWithRetries(
            dbConfig_owner, PostgreSQL
        );

        const cleanDbStmt = await loadSql(cleanDbQuery);
        await ownerConn.execute(cleanDbStmt, {
            database: dbConfig_user.database,
        });
        console.log(`Database ${dbConfig_user.database} dropped.`);

        const cleanDbUserStmt = await loadSql(cleanDbUserQuery);
        await ownerConn.execute(cleanDbUserStmt, {
            user: dbConfig_user.user
        });
        console.log(`User ${dbConfig_user.user} dropped.`);

        const cleanDbRoleStmt = await loadSql(cleanDbRoleQuery);
        await ownerConn.execute(cleanDbRoleStmt, {
            rolname: rolname
        });
        console.log(`Role ${rolname} dropped.`);

        console.log('Cleanup completed: database and roles dropped.');

    } catch (err) {
        console.error('Error during cleanup', err);

    } finally {
        if (ownerConn) await ownerConn.close();
    }
}

// Parse command-line arguments to determine operation mode
const args = process.argv.slice(2);
const mode = args[0] || 'setup';

async function main() {
    try {
        switch (mode) {
            case 'setup':
                console.log('=== Setting up database ===');
                await setupBasePermissions();
                await setupDatabase();
                await createSchema();
                await buildPermissions();
                await runAsUser();
                console.log('=== Database setup complete ===');
                break;
            case 'cleanup':
                console.log('=== Cleaning up database ===');
                await cleanup();
                console.log('=== Database cleanup complete ===');
                break;
            case 'test':
                console.log('=== Testing database operations ===');
                await runAsUser();
                console.log('=== Database test complete ===');
                break;
            default:
                console.log('Usage: node database_postgresql.js [setup|cleanup|test]');
                console.log('  setup   - Create database, user, roles and schema (default)');
                console.log('  cleanup - Drop database, user and roles');
                console.log('  test    - Test read/write operations as application user');
                process.exit(1);
        }
    } catch (error) {
        console.error('Error during database operation:', error.message);
        process.exit(1);
    }
}

main();


