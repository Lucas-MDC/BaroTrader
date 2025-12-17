# Database architecture and setup

## Roles and configs
- `config/db.js` centralizes `.env` reading and exports:
  - `dbConfigUser`: application DB user connection.
  - `dbConfigOwner`: owner/admin connection (database `postgres`).
  - `ownerOnAppDb`: owner connected directly to the application database.
  - `baseRole`: base role name (default `base_role_op`, overridable via `DB_BASE_ROLE`).

## Pools and connections
- `infra/db/pool.js` creates one `pg-promise` instance per process and exports:
  - `db`: pool for the application user.
  - `ownerDb`: pool for the owner pointed at the application DB (for grants/DDL).
  - `adminDb`: pool for the owner pointed at the admin DB (to create DB/user).
- `getDb(role)`: helper (`user` | `owner` | `admin`).
- `closeAll()`: closes pools (used by the CLI script teardown).
- Each pool exposes `query` (selects), `execute` (DDL/DML with `result`), and `close` (only that pool).

## Setup flow (CLI)
- Entry: `infra/db/main.js` (scripts `db:setup`, `db:schema`, `db:permissions`, `db:seed`/`db:test`, `db:full`, `db:cleanup`).
- Setup (infra only):
  1. `ensureDatabaseUser` (`setup/database.js`): creates the DB user if missing (adminDb).
  2. `ensureDatabase` (`setup/database.js`): creates the application database if missing (adminDb).
- Schema/entities:
  1. `ensureDatabaseEntities` (`schema/entities.js`): ensures business entities (currently the users table) using `ownerDb`.
- Permissions:
  1. `ensureBaseRole` (`permissions/permissions.js`): creates the base role if missing (ownerDb).
  2. `applyBasePermissions` (`permissions/permissions.js`): applies grants for the base role/user (ownerDb).
- Seed/Test: `runAsUser` (`seed/runAs.js`): smoke test using the application user (`db`).
- Cleanup: `setup/cleanup.js` drops database, user, and role (order: drop DB -> drop user -> drop role).
- `db:full`: runs setup -> schema -> permissions -> seed in sequence (keeps a small wait between setup and permissions to let the DB come up).

## SQL layout
- `sql/index.js` centralizes paths via `QueryFile` (cache/minify):
  - `infra/database/*`: create/check/drop database.
  - `infra/users/*`: create/check/drop DB user.
  - `infra/roles/*`: create/grant/drop roles.
  - `user/*`: domain queries for business entity `user`.
  - `seed/*`: legacy sample/seed scripts.
- Usage: import `sql` and pass QueryFile directly to `db.query`/`db.execute`.

## Models
- `models/user/userModel.js` receives a client with `query/execute` (uses shared pool) and exposes:
  - `ensureTable`, `createUser`, `findByUsername`, `findById`.
- `models/user/index.js` provides `getUserModel()` (caches instance over the pool) and reexports `createUserModel`.

## Naming convention
- Prefer `setup` for infra/provisioning routines (instead of `bootstrap`).
- Roles/DB/users configurable via `.env`; defaults documented in `config/db.js`.
