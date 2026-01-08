# Migrations

This project uses node-pg-migrate with SQL-first migrations.

## Principles
- Migrations are append-only once merged to the main branch; fixes are new migrations.
- Treat `down` as a dev tool; production is forward-only unless a rollback plan exists.
- Use expand/contract for destructive changes (add, backfill, switch app, then remove).
- Migrations run in transactions by default; call `pgm.noTransaction()` only when required.
- node-pg-migrate uses advisory locks to serialize concurrent runs.

## Connection separation
- Runtime app uses `DATABASE_URL` (or `DB_*` primitives) for DML only.
- Migrations use `MIGRATIONS_DATABASE_URL` (or `MIGRATION_*` primitives) for DDL/DCL with `--database-url-var`.

## Structure
- `sql/migrations/*.sql` holds the DDL changes (up).
- `sql/migrations/*.down.sql` holds rollback SQL (down).
- `db/migration_sql.cjs` loads migration SQL from disk.
- `migrations/*.js` are node-pg-migrate wrappers that only wire `up`/`down`.
- Baseline order: `001_init_users`, `002_migrator_privileges`, `003_base_role_permissions`.

## Creating a migration
1. Add a new SQL file in `sql/migrations/NNN_description.sql`.
2. Add a rollback SQL file in `sql/migrations/NNN_description.down.sql`.
3. Add a wrapper in `migrations/NNN_description.js`:

```js
const { loadMigrationSql } = require('../db/migration_sql.cjs');

exports.up = (pgm) => {
    pgm.sql(loadMigrationSql('NNN_description.sql'));
};

exports.down = (pgm) => {
    pgm.sql(loadMigrationSql('NNN_description.down.sql'));
};
```

Notes:
- Use zero-padded numeric prefixes so migrations run in order (e.g. `002_add_orders`).
- Keep wrappers in CommonJS (node-pg-migrate loads them directly).
- Keep rollback SQL in the `.down.sql` file; avoid hardcoding SQL in the wrapper.
- If rollback is not possible, set `exports.down = false` in the wrapper and omit the `.down.sql`.

## Running migrations
- Apply pending migrations: `npm run db:migrate up`.
- Roll back the latest migration: `npm run db:migrate down`.
- Redo the latest migration: `npm run db:migrate redo`.
- Check migration status: `npm run db:migrate status`.
- Pass node-pg-migrate flags through with `--` (example: `npm run db:migrate up -- --count 2`).

## CLI behavior
- `up` with no args applies all pending migrations.
- `up N` applies N pending migrations from the current state.
- `down` rolls back one migration; `down N` rolls back N.
- `redo` replays the latest migration; `redo N` replays the latest N.

## Runner behavior
- The runner always passes `--migrations-dir migrations`.
- The runner always passes `--database-url-var MIGRATIONS_DATABASE_URL`.
- The runner uses `--envPath .env` when the root `.env` exists.

## Useful CLI flags
- `--database-url-var MIGRATIONS_DATABASE_URL` is set in scripts by default.
- `--timestamp` interprets numeric arguments as timestamps.
- `--migrations-table` and `--migrations-schema` control history tracking location.

## Checking sync state
- Run `npm run db:migrate status` to list applied and pending migrations.
- If anything is pending, run `npm run db:migrate up`.
- node-pg-migrate records applied migrations in the `pgmigrations` table. You can compare that list with the filenames in `migrations/`.

Example query:

```sql
SELECT name, run_on
FROM pgmigrations
ORDER BY run_on;
```

## Keeping the folder manageable
- It's normal for `migrations/` and `sql/migrations/` to grow over time.
- Keep files ordered by prefix and avoid renaming applied migrations.
- For branch-specific work, prefer rebuilds or a per-branch DB instead of editing history.
