# Database lifecycle

This document describes how the repository provisions, migrates, resets, and
destroys PostgreSQL environments under the new contract.

## Safety gates

`npm run db:cleanup` is blocked unless all of the following are true:

- `APP_ENV` is `development` or `test`
- `DB_ALLOW_DESTRUCTIVE=YES`
- `DB_DESTRUCTIVE_CONFIRM` matches `RUNTIME_DB` exactly

These gates are for manual/destructive tooling only. They are not part of the
normal Docker-first dev path or the normal CI path.

## Local Docker-first path

For daily work:

- copy `.env.example` to `.env`
- use `npm run dev:up`
- use `npm run dev:down` to stop without losing data
- use `npm run dev:reset` to remove the dev volume and start fresh

`dev:reset` is the recommended full reset for local Docker development.

## Manual provisioning path

If you are targeting a manually managed PostgreSQL instance:

- export `BAROTRADER_DB_ADMIN_DB`
- export `BAROTRADER_DB_ADMIN_USER`
- export `BAROTRADER_DB_ADMIN_PASSWORD`
- export the rest of the canonical runtime/migration contract

Then:

```bash
npm run db:setup
npm run db:migrate -- up
npm run db:seed
```

## Local integration-test path

For DB-backed tests:

- `scripts/test.js` prepares the local PostgreSQL base automatically
- the harness provisions `RUNTIME_*` and `MIGRATION_*` under `TEST_*`
- the logical environment is cleaned after the run by default

For debugging:

```bash
TEST_KEEP_DB=1 npm run test:integration:debug
```

That preserves the local PostgreSQL base and the logical test DB.

## Managed environments

For CI/staging/prod-like environments:

- infrastructure is created outside the app via workflow or orchestrator
- `db:setup` and `db:cleanup` are not part of the normal deploy path
- `db:migrate` runs against the configured `MIGRATION_*`

## Branch switching and rollback

- `npm run db:migrate status` shows applied vs pending migrations
- `npm run db:migrate down` rolls back the latest migration
- `npm run db:migrate redo` replays the latest migration

If the local state is too divergent, prefer a clean rebuild of the environment
instead of editing migration history.
