# BaroTrader

BaroTrader application with Express.js and PostgreSQL database.

## Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+) or Docker with PostgreSQL container

## Installation

```bash
npm install
```

## Configuration

Copy the `.env.example` file to `.env` and configure the database connection:

```bash
cp .env.example .env
```

Edit the `.env` file with your PostgreSQL credentials.

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the application |
| `npm run dev` | Start the application in development mode with hot reload |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Run ESLint and fix auto-fixable issues |
| `npm run db:setup` | Provision the PostgreSQL user and application database |
| `npm run db:schema` | Create/ensure database entities (tables) |
| `npm run db:permissions` | Create the base role and apply grants |
| `npm run db:build` | Run setup + schema + permissions in sequence (no seed) |
| `npm run db:seed` | Run a smoke test/seed as the application user |
| `npm run db:test` | Alias for `npm run db:seed` |
| `npm run db:full` | Run setup + schema + permissions + seed in sequence |
| `npm run db:cleanup` | Clean up (drop) the database, user and roles |
| `npm run db:test-sqlite` | Test SQLite database operations |

## Database Setup

The project includes scripts to set up and test database connectivity.

### PostgreSQL Setup

1. Ensure PostgreSQL is running
2. Configure the `.env` file with your credentials
3. Run the database setup scripts:

```bash
npm run db:setup
npm run db:schema
npm run db:permissions
```

This sequence will:
- Create the application user and database
- Create/ensure the initial schema (users table)
- Create the base role and grants

You can run the same sequence in one go:

```bash
npm run db:build
```

Optionally run the smoke test/seed:

```bash
npm run db:seed
# or
npm run db:test
```

To execute the full flow in one go:

```bash
npm run db:full
```

### SQLite (for development)

For quick local testing without PostgreSQL, you can use SQLite:

```bash
npm run db:test-sqlite
```

## Project Structure

```
src/
  index.js                 # Express server entry point
  config/db.js             # Centralized DB config (env)
  infra/db/                # Database setup + pooled connections
    main.js                # Entry point for DB setup/schema/permissions/seed/cleanup
    pool.js                # Shared pg-promise pool (user/admin/owner)
    setup/                 # User/database provisioning and cleanup
    schema/                # Creation of database entities (DDL)
    permissions/           # Base role creation and grants
    seed/                  # Smoke test/seed routines as app user
  models/                  # Domain models (repositories)
    user/
      index.js             # Public API for user model
      userModel.js         # User data access using shared pool
  sql/                     # Organized SQL scripts
    infra/                 # DDL, roles, grants, DB/user creation
    user/                  # Domain queries for user
    seed/                  # Sample/seed scripts
  utils/
    database_sqlite.js     # SQLite setup and operations
    database_utils.js      # Shared database utilities
    databaseWrappers/      # Database abstraction layers
      postgresql_wrapper.js
      sqlite_wrapper.js
docs/
  db-architecture.md       # DB setup, roles, pooling and SQL layout
```

## License

ISC
