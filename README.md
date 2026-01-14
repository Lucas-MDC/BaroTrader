# BaroTrader

BaroTrader application with Express.js and PostgreSQL database.

## Quickstart (Docker Compose DEV)

Prerequisites:
- Docker Desktop/Engine + Docker Compose v2
- Node.js (v18+) to run npm scripts

From a fresh clone:

```bash
npm run dev:up
```

Then open `http://localhost:3000` (or run `npm run dev:open`).

`dev:up` builds the image, starts Postgres, bootstraps users/db on first init,
runs migrations, and starts the app. Use `npm run dev:up -- -d` for detached.

### Daily commands

| Script | Description |
|--------|-------------|
| `npm run dev:up` | Build + start db/migrate/app (foreground) |
| `npm run dev:down` | Stop the dev stack (keeps data) |
| `npm run dev:reset` | Stop and remove volumes (fresh DB) |
| `npm run dev:bootstrap` | Re-run DB bootstrap inside Docker |
| `npm run dev:open` | Open `http://localhost:3000` |

## Compose layout (DEV)

- `db`: Postgres with a named `pgdata` volume and bootstrap scripts in `docker/postgres/init`.
- `migrate`: one-shot job that runs `npm run db:migrate -- up`.
- `app`: Express dev server (`npm run dev`) that waits on migrations.

## Configuration & secrets

- HTTP port uses `APP_PORT` (defaults to 3000).
- DB config prefers `DATABASE_URL` / `MIGRATIONS_DATABASE_URL` with fallback to
  `DB_*` / `MIGRATION_*` (`DB_HOST`/`DB_PORT` override `HOST`/`PORT`).
- Supported `*_FILE` secrets: `DB_PASS`, `MIGRATION_PASS`,
  `BAROTRADER_DB_ADMIN_PASS`, `DATABASE_URL`, `MIGRATIONS_DATABASE_URL`,
  `MIGRATION_DATABASE_URL`, `HASH_PEPPER`.

For local Postgres (no Docker), copy `.env.example` to `.env`, fill values, and
export `BAROTRADER_DB_ADMIN_DBNAME`, `BAROTRADER_DB_ADMIN_USER`,
`BAROTRADER_DB_ADMIN_PASS` in your shell when running `db:setup`/`db:cleanup`.

## Production compose skeleton

`compose.prod.yaml` is a structure-only template with required variables and no
defaults. Use it as a base for prod orchestration or secret injection:

```bash
docker compose -f compose.yaml -f compose.prod.yaml up --build
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the application |
| `npm run dev` | Start the application in development mode with hot reload |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Run ESLint and fix auto-fixable issues |
| `npm run db:setup` | Provision the runtime/migrator users and application database |
| `npm run db:bootstrap` | Run DB setup inside Docker (dev helper) |
| `npm run db:migrate` | Run migrations (use `up`, `down`, `redo`, `status`) |
| `npm run db:seed` | Run a smoke test/seed as the application user |
| `npm run db:cleanup` | Clean up (drop) the database, user and roles (guarded) |
| `npm run db:test-sqlite` | Test SQLite database operations |

## Database Setup (manual)

For local Postgres without Docker:

1. Ensure PostgreSQL is running
2. Configure `.env`
3. Export `BAROTRADER_DB_ADMIN_DBNAME`, `BAROTRADER_DB_ADMIN_USER`,
   and `BAROTRADER_DB_ADMIN_PASS` in your shell
4. Run:

```bash
npm run db:setup
npm run db:migrate -- up
```

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
  main.js                  # DB setup/migrate/seed/cleanup CLI
  migrate.js               # node-pg-migrate runner + loader export
  migration_sql.cjs        # SQL loader for migrations
  pool.js                  # Tooling pg-promise pools (admin/migrator/runtime)
  safety.js                # Destructive command guardrails
  setup/                   # User/database provisioning and cleanup
  seed/                    # Smoke test/seed routines
sql/
  runtime/                 # Runtime queries (pg-promise)
  infra/                   # Setup/cleanup/seed SQL (tooling)
  migrations/              # SQL-first migrations (DDL changes)
migrations/                # node-pg-migrate wrappers (CommonJS)
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
  devops.md                # Docker Compose/devops tutorial for bring-up
```

## License

ISC

## DevOps walkthrough

Leitura focada em quem está começando com Docker Compose e quer entender a automação de um ambiente dev/devops moderno: veja `docs/devops.md`.
