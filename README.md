# BaroTrader

BaroTrader is an Express.js application with PostgreSQL, built around a
Docker-first runtime and an explicit environment contract.

## Quickstart

Prerequisites:
- Docker Desktop/Engine + Docker Compose v2
- Node.js 20+

Setup:

```bash
cp .env.example .env
npm install
npm run dev:up
```

Then open `http://localhost:3000` or run `npm run dev:open`.

## Canonical environment contract

The repository only supports the canonical variables below. The previous
URL-based and alias-based contract has been removed from the public interface.

### Required DB/admin variables

- `BAROTRADER_DB_ADMIN_DB`
- `BAROTRADER_DB_ADMIN_USER`
- `BAROTRADER_DB_ADMIN_PASSWORD`
- `RUNTIME_DB`
- `RUNTIME_USER`
- `RUNTIME_PASSWORD`
- `MIGRATION_DB`
- `MIGRATION_USER`
- `MIGRATION_PASSWORD`
- `TEST_DB`
- `TEST_USER`
- `TEST_PASSWORD`

### Required app variables

- `APP_ENV`
- `APP_HOST`
- `APP_PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_BASE_ROLE`
- `HASH_PEPPER`
- `REGISTER_MIN_DELAY_MS`

### Secrets from files

`config/env.js` supports `*_FILE` variants for:

- `BAROTRADER_DB_ADMIN_PASSWORD`
- `RUNTIME_PASSWORD`
- `MIGRATION_PASSWORD`
- `TEST_PASSWORD`
- `HASH_PEPPER`

## Operational doctrine

### Local Docker dev

- `docker compose` is the operational authority.
- `.env` provides local defaults.
- Exported shell variables override `.env`.
- `compose.dev.yaml` consumes the variables explicitly; there are no credentials
  or URLs hardcoded in the Compose file.

### GitHub Actions

- The workflow is the operational authority.
- `vars` and `secrets` feed the job and the PostgreSQL service container.
- Tests consume the job environment; they do not bootstrap CI infrastructure by
  discovering it dynamically.

### Production

- The platform or orchestrator is the operational authority.
- `compose.prod.yaml` is a structure-only skeleton with required variables and
  no defaults.
- Missing required variables fail fast.

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the application using the canonical runtime env contract |
| `npm run dev` | Start the application with `node --watch` |
| `npm run dev:up` | Build and start `db`, `migrate`, and `app` |
| `npm run dev:up:bg` | Start the dev stack detached |
| `npm run dev:down` | Stop the dev stack and keep volumes |
| `npm run dev:reset` | Stop the dev stack and remove volumes |
| `npm run dev:bootstrap` | Re-run provisioning against the current dev DB |
| `npm run dev:open` | Open the local app URL |
| `npm run lint` | Run ESLint |
| `npm run validate:env:runtime` | Validate the canonical runtime contract |
| `npm run validate:env:test` | Validate the canonical test contract |
| `npm test` | Run unit + integration tests; local DB base is prepared automatically |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests with automatic local DB base setup |
| `npm run test:integration:debug` | Run integration tests in-band |
| `npm run test:coverage` | Run coverage with the same automatic test-base orchestration |
| `npm run db:setup` | Create runtime/migrator roles and application DB using `BAROTRADER_DB_ADMIN_*` |
| `npm run db:migrate` | Run migrations using `MIGRATION_*` |
| `npm run db:seed` | Run a smoke/seed flow as the runtime user |
| `npm run db:cleanup` | Drop DB/users/role with explicit destructive confirmation |

## Testing

DB-backed integration tests use the following model:

- Local: `scripts/test.js` brings up `compose.test.yaml`, points the process to
  `127.0.0.1:55432`, validates the test contract, runs Jest, and tears the base
  stack down afterward.
- CI: GitHub Actions provides `services: postgres`; the same test command
  consumes that base and does not attempt to preserve anything.
- Harness: `tests/integration/support/dbHarness.js` uses `TEST_*` as the admin
  connection, then provisions `RUNTIME_*` and `MIGRATION_*`, applies migrations,
  and cleans up the logical test environment.

### Local debugging

- `TEST_KEEP_DB=1` preserves both the logical test database and the local test
  PostgreSQL base after the run.
- This flag is local-only. In GitHub Actions it is ignored.

PowerShell example:

```powershell
$env:TEST_KEEP_DB='1'
npm run test:integration:debug
```

## Database safety

Destructive tooling is intentionally separate from the normal runtime/test path.
`npm run db:cleanup` requires:

- `APP_ENV=development` or `APP_ENV=test`
- `DB_ALLOW_DESTRUCTIVE=YES`
- `DB_DESTRUCTIVE_CONFIRM` matching the target runtime database exactly

For the normal local Docker-first path, a full reset is `npm run dev:reset`, not
`db:cleanup`.

## Project structure

```text
config/
  app.js
  db.admin.js
  db.migrations.js
  db.runtime.js
  db.shared.js
  db.test.js
  env.js
  index.js
  security.js
db/
  engine/
  migrations/
  sql/
docker/
  node/
  postgres/
scripts/
  dev.js
  test.js
  validate-env.js
tests/
  integration/
  unity/
```

## Additional docs

- `docs/devops.md`: local Docker and CI operational model
- `docs/db-architecture.md`: config, roles, pools, and provisioning flow
- `docs/db-lifecycle.md`: provisioning, cleanup, and safe reset guidance
- `docs/migrations.md`: migration workflow and supported flags
