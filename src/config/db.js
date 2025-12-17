import dotenv from 'dotenv';

dotenv.config();

const base = {
    host: process.env.HOST,
    port: Number(process.env.PORT || 5432),
};

const dbConfigUser = {
    ...base,
    database: process.env.DB_DBNAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
};

const dbConfigOwner = {
    ...base,
    database: process.env.DB_ADMIN_DBNAME,
    user: process.env.DB_ADMIN_USER,
    password: process.env.DB_ADMIN_PASS
};

const ownerOnAppDb = {
    ...dbConfigOwner,
    database: process.env.DB_DBNAME
};

const baseRole = process.env.DB_BASE_ROLE || 'base_role_op';

export {
    baseRole,
    dbConfigOwner,
    dbConfigUser,
    ownerOnAppDb
};
