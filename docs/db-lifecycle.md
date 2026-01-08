# Database lifecycle

This document describes how to provision, migrate, reset, and operate the DB
across local development and managed environments.

## Safety gates
Cleanup is blocked by default. To run destructive commands (like `db:cleanup`),
all of the following must be true:
- `APP_ENV` (or `NODE_ENV`) is `development` or `test`.
- `DB_ALLOW_DESTRUCTIVE=YES`.
- `DB_DESTRUCTIVE_CONFIRM` matches the target database name exactly.

The cleanup script prints the target database name before validating the
confirmation value.

## Manual today (no IaC/CI)
### Cluster-level provisioning
These steps require a DBMS sysadmin account:
- Obtain or create sysadmin credentials for the PostgreSQL instance.
- Export `BAROTRADER_DB_ADMIN_DBNAME`, `BAROTRADER_DB_ADMIN_USER`, and `BAROTRADER_DB_ADMIN_PASS` in your shell/CI.
- Use `npm run db:setup` in dev/test to create the database and runtime/migrator logins.

### Repo-managed automation
These steps are handled by the repository tooling:
- `npm run db:migrate up` applies schema + grants using `MIGRATIONS_DATABASE_URL` (can be derived from `MIGRATION_*`).
- `npm run db:seed` performs a smoke test as the runtime user.

## Automatic later (GitHub Actions / IaC)
These responsibilities move to the pipeline:
- Provision database and roles in managed environments (IaC).
- Run `node-pg-migrate up` using `--database-url-var MIGRATIONS_DATABASE_URL`.
- (Optional) run `npm run db:seed` as a smoke test in staging/preview.

## Use cases
1) New developer onboarding (first local setup)
- Copy `.env.example` to `.env` and fill in `HOST/PORT`, `DB_*`, `MIGRATION_*`, and hashing values.
- Export `BAROTRADER_DB_ADMIN_DBNAME`, `BAROTRADER_DB_ADMIN_USER`, and `BAROTRADER_DB_ADMIN_PASS` in your shell (not in `.env`).
- Run `npm run db:setup` to create logins + database.
- Run `npm run db:migrate up` to apply schema and grants.
- Optionally run `npm run db:seed` to smoke test.

2) Daily dev after a pull with new migrations
- Run `npm run db:migrate status` to see pending migrations.
- Run `npm run db:migrate up` to apply what is pending.

3) Full local reset (cleanup + rebuild)
- Set safety gates:
  - `APP_ENV=development`
  - `DB_ALLOW_DESTRUCTIVE=YES`
  - `DB_DESTRUCTIVE_CONFIRM=<your_database_name>`
- Ensure `BAROTRADER_DB_ADMIN_DBNAME`, `BAROTRADER_DB_ADMIN_USER`, and `BAROTRADER_DB_ADMIN_PASS` are exported in your shell.
- Run `npm run db:cleanup`.
- Run `npm run db:setup`, then `npm run db:migrate up`, then `npm run db:seed`.

4) Deploy to staging/prod (no recreating DB/roles)
- Provision the database/roles outside the app (IaC or DBA runbook).
- Run `npm run db:migrate up` using `MIGRATIONS_DATABASE_URL`.
- Do not run `db:setup` or `db:cleanup` in managed environments.
- Optional: run `npm run db:seed` as a smoke test in staging.

5) Switching branches / going back in time
- First, run `npm run db:migrate status` to see how your DB compares.
- If the target branch is **ahead** (has newer migrations):
  - Run `npm run db:migrate up` to apply the new migrations.
- If the target branch is **behind** (your DB has migrations it doesn't):
  - Use `npm run db:migrate down` to roll back the extra migrations.
  - If you need to reapply the latest migration after edits, use `npm run db:migrate redo`.
  - If rolling back is unsafe or there are many migrations, prefer `db:cleanup` + rebuild.
