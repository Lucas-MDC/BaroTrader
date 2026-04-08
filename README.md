# BaroTrader

BaroTrader application with Express.js and PostgreSQL database.

## Quickstart (Docker Compose DEV)

This repository is Docker-first. The supported local startup path is Docker Compose; there is no separate manual bootstrap flow documented here.

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
| `npm run dev:up:bg` | Build + start the stack detached |
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
| `npm run dev:up` | Build + start db/migrate/app (foreground) |
| `npm run dev:up:bg` | Build + start the stack detached |
| `npm run dev:down` | Stop the dev stack (keeps data) |
| `npm run dev:reset` | Stop and remove volumes (fresh DB) |
| `npm run dev:bootstrap` | Re-run DB bootstrap inside Docker |
| `npm run dev:open` | Open `http://localhost:3000` |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Run ESLint and fix auto-fixable issues |
| `npm run test` | Run all Jest projects; DB-backed integration suites may bootstrap Docker when not running in GitHub Actions |
| `npm run test:unit` | Run the Jest unit project |
| `npm run test:integration` | Run the Jest integration project; only DB-backed suites bootstrap Docker locally when needed |
| `npm run test:integration:debug` | Run integration tests in-band (recommended for interactive DB debugging) |
| `npm run test:coverage` | Run Jest coverage report; includes DB-backed integration tests |
| `npm run db:migrate` | Run migrations (use `up`, `down`, `redo`, `status`) |
| `npm run db:seed` | Run a smoke test/seed as the application user |

## Testing

Current test folders:

```text
tests/
  unity/
    branchProtectionGuard.test.js
    passwordService.test.js
    registerClient.test.js
    registerService.test.js
    registerUtils.test.js
  integration/
    registerApi.backend-smoke.test.js
    registerApi.http-contract.test.js
    registerClient.jsdom.test.js
    registerService.db-integration.test.js
    support/
      dbHarness.js
```

Integration DB debugging flags:

- `KEEP_DB=1`: skip test database cleanup in teardown.

This flag is intended for local development/debug sessions. Keep it disabled in GitHub Actions/homolog/deploy to keep tests fully automatic and fast.

Integration test bootstrap:

- `GITHUB_ACTIONS=true` switches the harness into Actions mode.
- In that mode, the workflow must export `BAROTRADER_GHA_POSTGRES_SERVICE_ID`, `BAROTRADER_GHA_POSTGRES_SERVICE_NETWORK`, and `BAROTRADER_GHA_POSTGRES_SERVICE_PORT` from `job.services.postgres`.
- If that signature is missing or the PostgreSQL service is not reachable, DB-backed suites fail immediately.
- Outside GitHub Actions, only suites that call `dbHarness` use the local Docker fallback when no admin database is reachable.
- Full coverage still requires Docker Desktop/Engine locally, or `BAROTRADER_DB_ADMIN_*` exported to a reachable PostgreSQL instance.

PowerShell example:

```powershell
$env:KEEP_DB='1'
npm run test:integration:debug
```

## Migrations

Migrations are SQL-first and executed via node-pg-migrate. For details on how to
create, run, and check migration state, see `docs/migrations.md`.

For lifecycle guidance (setup, cleanup, branching, and safety gates), see
`docs/db-lifecycle.md`.

## Project Structure

```
config/
  db.admin.js              # Admin DB config (env)
  db.migrations.js         # Migrations DB config (env)
  db.runtime.js            # Runtime DB config (env)
  db.shared.js             # Shared DB config helpers
  env.js                   # Environment loading and expansion
  index.js                 # Config entrypoints
  security.js              # Hash config
db/
  engine/
    main.js                # DB setup/migrate/seed/cleanup CLI
    migrate.js             # node-pg-migrate runner + loader export
    migration_sql.cjs      # SQL loader for migrations
    pool.js                # Tooling pg-promise pools (admin/migrator/runtime)
    safety.js              # Destructive command guardrails
    seed/
      runAs.js             # Seed helpers executed with the app user
    setup/
      cleanup.js           # DB/user cleanup helpers
      database.js          # DB/user provisioning helpers
  sql/
    index.js               # SQL loader entrypoint
    infra/
      database/            # Bootstrap/cleanup SQL for DB lifecycle
      roles/               # Role management SQL
      seed/                # Seed SQL
      users/               # User management SQL
    migrations/            # SQL-first migrations (DDL changes)
    runtime/
      user/                # Runtime user queries
  migrations/
    001_init_users.js
    002_migrator_privileges.js
    003_base_role_permissions.js
    004_add_password_salt.js
    package.json
src/
  app.js                   # Express app factory (middlewares + routes)
  index.js                 # Runtime server entry point (listen)
  routes.js                # Route wiring
  db/
    pool.js                # Runtime pg-promise pool
  models/
    user/
      index.js             # Public API for user model
      userModel.js         # User data access using runtime pool
  private/
    assets/
    pages/
  public/
    assets/
    pages/
  services/
    register/
      passwordService.js
      register.js
      registerService.js
      sleep.js
    services.js
  shared/
    css/
      style.css
    js/
      utils.js
  utils/
    databaseWrappers/
      postgresql_wrapper.js
scripts/
  dev.js                   # Docker Compose helper CLI
docker/
  node/
    entrypoint-dev.sh
  postgres/
    init/
      01_bootstrap_roles.sh
tests/
  integration/
    support/
      dbHarness.js
    registerApi.backend-smoke.test.js
    registerApi.http-contract.test.js
    registerClient.jsdom.test.js
    registerService.db-integration.test.js
  unity/
    branchProtectionGuard.test.js
    passwordService.test.js
    registerClient.test.js
    registerService.test.js
    registerUtils.test.js
docs/
  db-architecture.md       # DB setup, roles, pooling and SQL layout
  db-lifecycle.md          # DB lifecycle, safety gates, use cases
  migrations.md            # How to create/run/check migrations
  devops.md                # Docker Compose/devops tutorial for bring-up
  plans/                   # Test plans and feature-level coverage map
```

## License

ISC

## DevOps walkthrough

Leitura focada em quem está começando com Docker Compose e quer entender a automação de um ambiente dev/devops moderno: veja `docs/devops.md`.
