# Database architecture and setup

## Config and env loading

- `config/env.js` loads `.env` once and supports `*_FILE` secret loading for
  canonical password variables and `HASH_PEPPER`.
- `config/app.js` validates `APP_ENV`, `APP_HOST`, and `APP_PORT`.
- `config/db.shared.js` owns the shared `DB_HOST`/`DB_PORT` parsing.
- `config/index.js` centralizes the public config API:
  - `getAdminDbConfig()` for `BAROTRADER_DB_ADMIN_*`
  - `getTestAdminDbConfig()` for `TEST_*`
  - `getRuntimeDbConfig()` for `RUNTIME_*`
  - `getMigrationsDbConfig()` for `MIGRATION_*`
  - `getBaseRole()` for `DB_BASE_ROLE`

## Role separation

- `BAROTRADER_DB_ADMIN_*` is the provisioning admin for runtime/manual tooling.
- `TEST_*` is the provisioning admin for DB-backed test runs.
- `MIGRATION_*` owns DDL/DCL and schema evolution.
- `RUNTIME_*` owns DML/application queries.

`RUNTIME_DB` and `MIGRATION_DB` must point to the same application database.

## Pools and connections

- `src/db/pool.js` exposes the runtime pool only.
- `db/engine/pool.js` exposes tooling pools:
  - `getAdminDb()` for runtime/manual provisioning
  - `getTestAdminDb()` for integration tests
  - `getOwnerDb()` for migration status queries
  - `getRuntimeDb()` for seed/smoke flows

## Setup flow

Entry point: `db/engine/main.js`

- `db:setup`
  - `ensureDatabaseUser`
  - `ensureMigratorUser`
  - `ensureDatabase`
- `db:migrate`
  - runs node-pg-migrate programmatically using `MIGRATION_*`
  - `002_migrator_privileges` uses `MIGRATION_USER`
  - `003_base_role_permissions` uses `RUNTIME_USER` and `DB_BASE_ROLE`
- `db:seed`
  - exercises the runtime path as the application user
- `db:cleanup`
  - drops database, users, and base role with destructive guardrails

## Test setup flow

`tests/integration/support/dbHarness.js` uses the same provisioning helpers with
`getTestAdminDb()` as the admin connection. The harness:

1. forces `APP_ENV=test`
2. enables destructive cleanup for the configured runtime database
3. drops any previous logical test environment
4. recreates runtime user, migrator user, and runtime database
5. applies migrations
6. tears everything down unless `TEST_KEEP_DB=1`
