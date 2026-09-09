<a id="db-tooling-unit"></a>
### Unit

<a id="dbt-unit-001"></a>
#### DBT-UNIT-001: destructive guard requires targetDatabase
Source: Added
Conditions:
- Missing targetDatabase throws an error.

<a id="dbt-unit-002"></a>
#### DBT-UNIT-002: destructive guard requires APP_ENV or NODE_ENV
Source: Added
Conditions:
- Missing APP_ENV and NODE_ENV throws an error.

<a id="dbt-unit-003"></a>
#### DBT-UNIT-003: destructive guard blocks non-dev/test
Source: Added
Conditions:
- APP_ENV values outside development/test throw an error.

<a id="dbt-unit-004"></a>
#### DBT-UNIT-004: destructive guard requires allow flag
Source: Added
Conditions:
- DB_ALLOW_DESTRUCTIVE not set to YES throws an error.

<a id="dbt-unit-005"></a>
#### DBT-UNIT-005: destructive guard requires confirm match
Source: Added
Conditions:
- Missing DB_DESTRUCTIVE_CONFIRM throws an error.
- Mismatched DB_DESTRUCTIVE_CONFIRM throws an error.

<a id="dbt-unit-006"></a>
#### DBT-UNIT-006: destructive guard success path
Source: Added
Conditions:
- Correct APP_ENV, DB_ALLOW_DESTRUCTIVE, and DB_DESTRUCTIVE_CONFIRM allow execution.

<a id="dbt-unit-007"></a>
#### DBT-UNIT-007: getNpmArgs parsing
Source: Added
Conditions:
- npm_config_argv is parsed to extract args after a script name.
- Invalid JSON returns an empty list and logs a warning.

<a id="dbt-unit-008"></a>
#### DBT-UNIT-008: resolveMigrateArgs precedence
Source: Added
Conditions:
- CLI args are used when provided.
- npm args are used when CLI args are absent.

<a id="dbt-unit-009"></a>
#### DBT-UNIT-009: migrateFlow unknown subcommand
Source: Added
Conditions:
- Unknown migrate commands throw with a helpful message.

<a id="dbt-unit-010"></a>
#### DBT-UNIT-010: ensureDatabaseUser behavior
Source: Added
Conditions:
- Existing runtime role skips creation.
- Missing runtime password throws when creation is needed.

<a id="dbt-unit-011"></a>
#### DBT-UNIT-011: ensureMigratorUser identity rules
Source: Added
Conditions:
- Migrator user cannot match admin user.
- Migrator user cannot match runtime user.

<a id="dbt-unit-012"></a>
#### DBT-UNIT-012: ensureMigratorUser creation and grants
Source: Added
Conditions:
- Missing migrator user is created with a password.
- Missing CREATEROLE privilege is granted.

<a id="dbt-unit-013"></a>
#### DBT-UNIT-013: ensureDatabase rules
Source: Added
Conditions:
- Runtime and migrator DB names must match.
- Database is created when missing.

<a id="dbt-unit-014"></a>
#### DBT-UNIT-014: cleanup flow
Source: Added
Conditions:
- Cleanup resolves the database name from runtime and migrator configs.
- Database, users, and base role are dropped in order.

<a id="dbt-unit-015"></a>
#### DBT-UNIT-015: tooling pools lifecycle
Source: Added
Conditions:
- getAdminDb/getOwnerDb/getRuntimeDb are lazy.
- closeAll does not throw when pgp.end fails.

<a id="dbt-unit-016"></a>
#### DBT-UNIT-016: printUsage on unknown command
Source: Added
Conditions:
- Unknown CLI modes print usage and exit with code 1.

