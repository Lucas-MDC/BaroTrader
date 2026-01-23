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

Edit the `.env` file with your PostgreSQL credentials. Use:
- `HOST`, `PORT`, `DB_*` for the runtime application user (DML only)
- `MIGRATION_*` for the migrator user (DDL/DCL)
- `HASH_*`, `DB_BASE_ROLE`, and destructive gate flags as needed
- `APP_ENV`, `DB_ALLOW_DESTRUCTIVE`, `DB_DESTRUCTIVE_CONFIRM` for destructive gates
- (Optional) derived URLs via dotenv-expand:
  - `DATABASE_URL=postgres://${DB_USER}:${DB_PASS}@${HOST}:${PORT}/${DB_DBNAME}`
  - `MIGRATIONS_DATABASE_URL=postgres://${MIGRATION_USER}:${MIGRATION_PASS}@${HOST}:${PORT}/${MIGRATION_DB}`

Admin provisioning credentials (`BAROTRADER_DB_ADMIN_*`) must be injected via host/CI
environment variables (not stored in `.env`).

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the application |
| `npm run dev` | Start the application in development mode with hot reload |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Run ESLint and fix auto-fixable issues |
| `npm run db:setup` | Provision the runtime/migrator users and application database |
| `npm run db:migrate` | Run migrations (use `up`, `down`, `redo`, `status`) |
| `npm run db:seed` | Run a smoke test/seed as the application user |
| `npm run db:cleanup` | Clean up (drop) the database, user and roles (guarded) |
| `npm run db:test-sqlite` | Test SQLite database operations |

## Database Setup

The project includes scripts to set up and test database connectivity.

### PostgreSQL Setup

1. Ensure PostgreSQL is running
2. Configure the `.env` file with your credentials
3. Export `BAROTRADER_DB_ADMIN_DBNAME`, `BAROTRADER_DB_ADMIN_USER`, and `BAROTRADER_DB_ADMIN_PASS` in your shell
4. Run the database setup scripts:

```bash
npm run db:setup
npm run db:migrate up
```

This sequence will:
- Create the runtime and migrator users and database
- Apply schema migrations and grants (node-pg-migrate)

Note: `db:setup` and `db:cleanup` require `BAROTRADER_DB_ADMIN_*` to be set in the host/CI environment.

Optionally run the smoke test/seed:

```bash
npm run db:seed
```

## Migrations

Migrations are SQL-first and executed via node-pg-migrate. For details on how to
create, run, and check migration state, see `docs/migrations.md`.

For lifecycle guidance (setup, cleanup, branching, and safety gates), see
`docs/db-lifecycle.md`.

### SQLite (for development)

For quick local testing without PostgreSQL, you can use SQLite:

```bash
npm run db:test-sqlite
```

## Project Structure

```
config/
  db.runtime.js            # Runtime DB config (env)
  db.migrations.js         # Migrations DB config (env)
  db.admin.js              # Admin DB config (env)
  security.js              # Hash config
  index.js                 # Config entrypoints
db/
  engine/
    main.js                # DB setup/migrate/seed/cleanup CLI
    migrate.js             # node-pg-migrate runner + loader export
    migration_sql.cjs      # SQL loader for migrations
    pool.js                # Tooling pg-promise pools (admin/migrator/runtime)
    safety.js              # Destructive command guardrails
    setup/                 # User/database provisioning and cleanup
    seed/                  # Smoke test/seed routines
  sql/
    runtime/               # Runtime queries (pg-promise)
    infra/                 # Setup/cleanup/seed SQL (tooling)
    migrations/            # SQL-first migrations (DDL changes)
  migrations/              # node-pg-migrate wrappers (CommonJS)
src/
  index.js                 # Express server entry point
  db/                      # Runtime pg-promise pool
  models/                  # Domain models (repositories)
    user/
      index.js             # Public API for user model
      userModel.js         # User data access using runtime pool
  utils/
    database_sqlite.js     # SQLite setup and operations
    database_utils.js      # Shared database utilities
    databaseWrappers/      # Database abstraction layers
      postgresql_wrapper.js
      sqlite_wrapper.js
docs/
  db-architecture.md       # DB setup, roles, pooling and SQL layout
  db-lifecycle.md          # DB lifecycle, safety gates, use cases
  migrations.md            # How to create/run/check migrations
```

## License

ISC
