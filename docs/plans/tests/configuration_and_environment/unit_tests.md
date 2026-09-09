<a id="config-unit"></a>
### Unit

<a id="cfg-unit-001"></a>
#### CFG-UNIT-001: loadEnv idempotency
Source: Added
Conditions:
- loadEnv loads .env only once.
- Subsequent calls do not re-expand or override values.

<a id="cfg-unit-002"></a>
#### CFG-UNIT-002: admin env preservation
Source: Added
Conditions:
- BAROTRADER_DB_ADMIN_* values set in process.env are preserved after loadEnv.
- When admin values are absent, loadEnv removes any injected values from .env.

<a id="cfg-unit-003"></a>
#### CFG-UNIT-003: parseDatabaseUrl empty input
Source: Added
Conditions:
- parseDatabaseUrl returns null for empty or undefined values.

<a id="cfg-unit-004"></a>
#### CFG-UNIT-004: parseDatabaseUrl parsing
Source: Added
Conditions:
- Host, port, database, user, and password are extracted correctly.
- Port defaults to 5432 when missing.
- Username and password are URL-decoded.

<a id="cfg-unit-005"></a>
#### CFG-UNIT-005: buildDatabaseUrl required parts
Source: Added
Conditions:
- Missing host, port, database, or user returns null.
- Missing password returns a URL with user only.

<a id="cfg-unit-006"></a>
#### CFG-UNIT-006: buildDatabaseUrl encoding
Source: Added
Conditions:
- User and password are URL-encoded when building the URL.

<a id="cfg-unit-007"></a>
#### CFG-UNIT-007: getBaseConnectionConfig defaults
Source: Added
Conditions:
- `DB_HOST` is required and returned unchanged.
- `DB_PORT` is required and parsed as a positive integer.

<a id="cfg-unit-008"></a>
#### CFG-UNIT-008: assertRequired behavior
Source: Added
Conditions:
- Missing values throw with the provided label.
- Non-empty values are returned unchanged.

<a id="cfg-unit-009"></a>
#### CFG-UNIT-009: getRuntimeDbConfig from canonical runtime env
Source: Added
Conditions:
- `RUNTIME_DB`, `RUNTIME_USER`, and `RUNTIME_PASSWORD` are required.
- `DB_HOST` and `DB_PORT` are required shared inputs.

<a id="cfg-unit-010"></a>
#### CFG-UNIT-010: getRuntimeDbConfig rejects incomplete runtime env
Source: Added
Conditions:
- Missing `RUNTIME_DB`, `RUNTIME_USER`, or `RUNTIME_PASSWORD` throws.
- Missing `DB_HOST` or `DB_PORT` throws.

<a id="cfg-unit-011"></a>
#### CFG-UNIT-011: getMigrationsDbConfig from canonical migration env
Source: Added
Conditions:
- `MIGRATION_DB`, `MIGRATION_USER`, and `MIGRATION_PASSWORD` are required.
- `DB_HOST` and `DB_PORT` are required shared inputs.

<a id="cfg-unit-012"></a>
#### CFG-UNIT-012: getMigrationsDbConfig rejects incomplete migration env
Source: Added
Conditions:
- Missing `MIGRATION_DB`, `MIGRATION_USER`, or `MIGRATION_PASSWORD` throws.

<a id="cfg-unit-013"></a>
#### CFG-UNIT-013: getMigrationsDbConfig from MIGRATION_*
Source: Added
Conditions:
- `MIGRATION_DB` no longer falls back to any runtime alias.
- No migration URL is derived as public contract state.

<a id="cfg-unit-014"></a>
#### CFG-UNIT-014: getAdminDbConfig requirements
Source: Added
Conditions:
- `BAROTRADER_DB_ADMIN_DB`, `BAROTRADER_DB_ADMIN_USER`, and `BAROTRADER_DB_ADMIN_PASSWORD` are required.

<a id="cfg-unit-015"></a>
#### CFG-UNIT-015: getBaseRole default
Source: Added
Conditions:
- DB_BASE_ROLE overrides the default base role.
- Default base role is base_role_op.

<a id="cfg-unit-016"></a>
#### CFG-UNIT-016: getHashConfig requirements
Source: Added
Conditions:
- Missing HASH_PEPPER throws an error.
- HASH_PEPPER returns as hashPepper.

<a id="cfg-unit-017"></a>
#### CFG-UNIT-017: getRegisterConfig parsing
Source: Added
Conditions:
- REGISTER_MIN_DELAY_MS parses as an integer.
- Invalid or negative values fall back to the default delay.
- Regex and length constants are returned as configured.

<a id="cfg-unit-018"></a>
#### CFG-UNIT-018: dotenv-expand compatibility
Source: Added
Conditions:
- loadEnv supports dotenvExpand.expand when available.
- loadEnv supports dotenvExpand as a direct function when expand is missing.

