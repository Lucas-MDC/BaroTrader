# Database architecture and setup

## Config and env loading
- `/config/env.js` loads `.env` using `dotenv-expand` so derived URLs can be interpolated from primitives.
- `/config/index.js` centralizes config exports:
  - `getRuntimeDbConfig()` (`DATABASE_URL` or `HOST/PORT + DB_*`).
  - `getMigrationsDbConfig()` (`MIGRATIONS_DATABASE_URL` or `HOST/PORT + MIGRATION_*`).
  - `getAdminDbConfig()` (`BAROTRADER_DB_ADMIN_*` injected via the host/CI environment).
  - `getBaseRole()` (`DB_BASE_ROLE`, default `base_role_op`).
- `/config/security.js` owns hash salt/pepper validation.

## Role separation
- Runtime app uses `DATABASE_URL` (or `DB_*`) for DML only (same DB as migrations).
- Migrator uses `MIGRATIONS_DATABASE_URL` (or `MIGRATION_*`) for DDL/DCL and owns the schema.
- Sysadmin (`BAROTRADER_DB_ADMIN_*`) is reserved for provisioning (create DB/users/roles) and is not stored in `.env`.

## Pools and connections
- `src/db/pool.js` exposes the runtime pool only.
- `db/pool.js` exposes tooling pools:
  - `getAdminDb()` for sysadmin provisioning.
  - `getOwnerDb()` for migrator-owned DDL/grants.
  - `getRuntimeDb()` for seed/smoke tests.
- `closeAll()` closes all tooling pools (used by the CLI teardown).

## Setup flow (CLI)
- Entry: `db/main.js` (scripts `db:setup`, `db:migrate`, `db:seed`, `db:cleanup`).
- Setup (infra only):
  1. `ensureDatabaseUser` (`db/setup/database.js`): creates the runtime login if missing (admin).
  2. `ensureMigratorUser` (`db/setup/database.js`): creates the migrator login if missing (admin).
  3. `ensureDatabase` (`db/setup/database.js`): creates the application DB (admin, owned by migrator).
- Migrations:
  - `db:migrate` runs node-pg-migrate (`up`, `down`, `redo`, `status`).
  - Migrator grants are in `002_migrator_privileges`.
  - Base role creation and grants are handled by `003_base_role_permissions`.
- Seed/Test: `runAsUser` (`db/seed/runAs.js`) exercises the runtime model as the app user.
- Cleanup: `db/setup/cleanup.js` drops database/users/roles with safety gates.

## Migrations workflow
- Apply pending migrations: `npm run db:migrate up`.
- Check migration status: `npm run db:migrate status`.
- Roll back the latest migration: `npm run db:migrate down`.
- Redo the latest migration: `npm run db:migrate redo`.
- For creating migrations and checking state, see `docs/migrations.md`.

## SQL layout
- `/sql/index.js` centralizes paths via `QueryFile` (cache/minify):
  - `infra/database/*`: create/check/drop database.
  - `infra/users/*`: create/check/drop DB users.
  - `infra/roles/*`: drop base role (cleanup only).
  - `infra/seed/*`: optional seed helpers.
  - `runtime/user/*`: domain queries for `user`.
- Migrations:
  - `migrations/*`: node-pg-migrate wrappers (CommonJS).
  - `sql/migrations/*`: SQL-first schema and grants.

## Models
- `models/user/userModel.js` receives a client with `query/execute` (uses runtime pool) and exposes:
  - `createUser`, `findByUsername`, `findById`.
  - `ensureTable` is deprecated; use migrations instead.
- `models/user/index.js` provides `getUserModel()` (caches instance) and reexports `createUserModel`.

## Naming convention
- Prefer `setup` for infra/provisioning routines (instead of `bootstrap`).
- Runtime/migrator roles and DB names are configurable via `.env`; admin creds come from host/CI env vars.
