import dotenv from 'dotenv';
import process from 'process';
import { PostgreSQL } from './databaseWrappers/postgresql_wrapper.js';

dotenv.config();

const dbConfig_owner = {
    host: process.env.HOST,
    port: process.env.PORT,
    database: process.env.DB_ADMIN_DBNAME,
    user: process.env.DB_ADMIN_USER,
    password: process.env.DB_ADMIN_PASS,
};

const dbConfig_user = {
    host: process.env.HOST,
    port: process.env.PORT,
    database: process.env.DB_DBNAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
};

const rolname = 'base_role_op';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function connectWithRetries(
    config, retries = 3, baseDelay = 500
) {
    for (let i = 0; i < retries; i++) {
        try {
            let p = await PostgreSQL(config);
            console.log(`Connected to DB as ${config.user}`);
            return p;

        } catch (err) {
            if (i === retries - 1) throw err;
            console.warn(`Connection attempt ${i + 1} failed. Retrying in ${baseDelay * (2 ** i)} ms...`);
            await sleep(baseDelay * (2 ** i));

        }
    }
}

async function setupDatabase() {
    console.log('Setting up database and user...');
    const ownerConn = await connectWithRetries(dbConfig_owner);
    try {
        // criar role do usuário se não existir
        // no PostgreSQL, roles e users são equivalentes
        const roleCheck = await ownerConn.query(
            `SELECT 1 FROM pg_roles WHERE rolname = '${dbConfig_user.user}';`
        );
        if (!roleCheck || roleCheck.length === 0) {
            await ownerConn.execute(`
                CREATE ROLE ${dbConfig_user.user}
                LOGIN PASSWORD '${dbConfig_user.password}';
            `);
            console.log(`ROLE ${dbConfig_user.user} criado`);

        } else {
            console.log(`ROLE ${dbConfig_user.user} já existe`);

        }

        // criar database se não existir
        const dbCheck = await ownerConn.query(
            `SELECT 1 FROM pg_database WHERE datname = '${dbConfig_user.database}';`
        );
        if (!dbCheck || dbCheck.length === 0) {
            await ownerConn.execute(`
                CREATE DATABASE ${dbConfig_user.database} OWNER ${dbConfig_user.user};
            `);
            console.log(`DATABASE ${dbConfig_user.database} criado`);

        } else {
            console.log(`DATABASE ${dbConfig_user.database} já existe`);

        }

    } catch (err) {
        console.error('Error on setup database', err);
        throw err;
    } finally {
        await ownerConn.close();
    }
}

async function createSchemaAndPermissions() {
    console.log('Creating schema and permissions...');
    // aguardar um pouco para garantir que o novo DB esteja disponível
    await sleep(500);

    const ownerDbConn = await connectWithRetries({ ...dbConfig_owner, database: dbConfig_user.database });
    try {
        // criar role de permissão se não existir
        const roleCheck = await ownerDbConn.query(
            'SELECT 1 FROM pg_roles WHERE rolname = ${user};',
            { user: rolname }
        );
        if (!roleCheck || roleCheck.length === 0) {
            await ownerDbConn.execute(`CREATE ROLE ${rolname} NOLOGIN;`);
            console.log(`ROLE ${rolname} criado`);
        } else {
            console.log(`ROLE ${rolname} já existe`);
        }
        
        // permissões e defaults
        await ownerDbConn.execute(`
            GRANT CREATE ON SCHEMA public TO ${rolname};
            GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${rolname};
            GRANT INSERT ON ALL TABLES IN SCHEMA public TO ${rolname};
            GRANT UPDATE ON ALL TABLES IN SCHEMA public TO ${rolname};
            GRANT DELETE ON ALL TABLES IN SCHEMA public TO ${rolname};

            GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${rolname};

            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ${rolname};
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT INSERT ON TABLES TO ${rolname};
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT UPDATE ON TABLES TO ${rolname};
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT DELETE ON TABLES TO ${rolname};
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${rolname};

            GRANT ${rolname} TO ${dbConfig_user.user};
        `);

        // criar tabela se não existir
        await ownerDbConn.execute(`
            CREATE TABLE IF NOT EXISTS public.users (
                id   SERIAL PRIMARY KEY,
                name TEXT NOT NULL
            );
        `);
        console.log('Schema e permissões asseguradas em barotrader_db');

    } catch (err) {
        console.error('Error on permissions creation', err);
        throw err;

    } finally {
        await ownerDbConn.close();
    }
}

async function runAsUser() {
    console.log('Running operations as db_user_barotrader_dev...');
    const userConn = await connectWithRetries(dbConfig_user);
    try {
        await userConn.execute(
            'INSERT INTO users (name) VALUES (${name});',
            { name: 'Teste' }
        );
        
        console.log('INSERT executado como db_user_barotrader_dev');
        
        const rows = await userConn.query(
            'SELECT id, name FROM users WHERE id = ${id};',
            { id: 1 }
        );

        console.log('SELECT retornou:', rows);

    } catch (err) {
        console.error('Error running as user', err);

    } finally {
        await userConn.close();

    }
}

async function cleanup() {
    console.log('Cleaning up: dropping database and roles...');
    const ownerConn = await connectWithRetries(dbConfig_owner);
    try {
        await ownerConn.execute(`DROP DATABASE IF EXISTS ${dbConfig_user.database};`);
        await ownerConn.execute(`DROP USER IF EXISTS ${dbConfig_user.user};`);
        await ownerConn.execute(`DROP ROLE IF EXISTS ${rolname};`);
        console.log('Cleanup completed: database and roles dropped.');

    } catch (err) {
        console.error('Error during cleanup', err);

    } finally {
        await ownerConn.close();

    }
}

const way = true;

if (way) {
    await setupDatabase();
    await createSchemaAndPermissions();
    await runAsUser();
    
} else { 
    await cleanup();

}


