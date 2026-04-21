# DevOps guide

This guide explains the runtime/test execution model after the environment
contract refactor.

## Local development

Local development is Docker-first:

- `compose.yaml` defines the service graph (`db`, `migrate`, `app`).
- `compose.dev.yaml` injects the canonical variables explicitly.
- `.env` is the local source of defaults.
- Exported shell variables override `.env`.

The supported happy path is:

```bash
cp .env.example .env
npm install
npm run dev:up
```

The dev stack behavior is:

1. `db` starts PostgreSQL and runs `docker/postgres/init/01_bootstrap_roles.sh`
   on first volume initialization.
2. `migrate` runs `npm run db:migrate -- up` using `MIGRATION_*`,
   `RUNTIME_USER`, `DB_BASE_ROLE`, `DB_HOST`, and `DB_PORT`.
3. `app` starts the HTTP server using `APP_HOST`, `APP_PORT`, `RUNTIME_*`,
   `DB_HOST`, `DB_PORT`, `HASH_PEPPER`, and `REGISTER_MIN_DELAY_MS`.

## Local test execution

Integration tests use a separate local base stack:

- `compose.test.yaml` runs PostgreSQL only.
- `scripts/test.js` starts that stack automatically when the selected mode
  includes DB-backed integration tests.
- The script points the process to `127.0.0.1:55432`, validates the test
  contract, runs Jest, and tears the stack down afterwards.

This means the operator interaction stays at one command:

```bash
npm run test:integration
```

No individual test file is responsible for bootstrapping Docker.

### Debugging

Use `TEST_KEEP_DB=1` locally to preserve:

- the logical database provisioned by the harness, and
- the local PostgreSQL base from `compose.test.yaml`

That flag is intended only for local debugging.

## GitHub Actions

CI uses `services: postgres` as the infrastructure authority:

- the workflow injects the canonical variables from GitHub `vars` and `secrets`;
- the PostgreSQL service is created by the workflow itself;
- `npm run validate:env:test` checks the contract before tests;
- `npm test` consumes the CI-provided PostgreSQL base and does not try to
  preserve local debug state.

## Production

`compose.prod.yaml` is intentionally strict:

- no defaults are embedded in the repository;
- every required variable is referenced explicitly with `${VAR:?}`;
- missing configuration fails the deployment immediately.

This keeps the production contract aligned with Twelve-Factor config and avoids
dual sources of truth.
