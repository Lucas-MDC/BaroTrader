import dotenv from 'dotenv';

/*
PostgreSQL provisioning happens in distinct contexts. We first connect
to the admin database as the sysadmin to create the application database.
Once it exists we reconnect as the owner inside that database to create
roles, schemas and other assets. This module centralizes the connection
details needed for those stages (admin, owner inside app DB, and the
runtime application user) so the setup code can switch contexts explicitly 
without guessing environment variables.
*/

dotenv.config();

// Host environment configurations
const base = {
    host: process.env.HOST,
    port: Number(process.env.PORT || 5432),
};

// Operational Production User Database Configuration
const dbConfigUser = {
    ...base,
    database: process.env.DB_DBNAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
};

// SysAdmin DBMS, responsible for creating 
// and managing DBs and roles
const dbConfigOwner = {
    ...base,
    database: process.env.DB_ADMIN_DBNAME,
    user: process.env.DB_ADMIN_USER,
    password: process.env.DB_ADMIN_PASS
};

// Intermediary configuration between the owner and the application DB
// needed for certain administrative tasks on the application database
const ownerOnAppDb = {
    ...dbConfigOwner,
    database: process.env.DB_DBNAME // different from the dbConfigOwner secrets
};

// Base role for application DB operations
const baseRole = process.env.DB_BASE_ROLE || 'base_role_op';

export {
    baseRole,
    dbConfigOwner,
    dbConfigUser,
    ownerOnAppDb
};
