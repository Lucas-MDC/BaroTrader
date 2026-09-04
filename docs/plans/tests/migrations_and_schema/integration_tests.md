<a id="migrations-integration"></a>
### Integration

<a id="mig-int-001"></a>
#### MIG-INT-001: runMigrations dependency check
Source: Added
Conditions:
- Missing node-pg-migrate yields a helpful error.

<a id="mig-int-002"></a>
#### MIG-INT-002: runMigrations argument sanitization
Source: Added
Conditions:
- Unsupported CLI-only flags are rejected in programmatic mode.
- The runner uses the canonical `MIGRATION_*` contract through object-based config.
- Supported flags are translated into node-pg-migrate runner options.

<a id="mig-int-003"></a>
#### MIG-INT-003: printMigrationStatus without pgmigrations table
Source: Added
Conditions:
- All migrations are reported as pending when pgmigrations is missing.

<a id="mig-int-004"></a>
#### MIG-INT-004: printMigrationStatus with missing files
Source: Added
Conditions:
- Applied migrations missing from the filesystem are listed as missing.

<a id="mig-int-005"></a>
#### MIG-INT-005: apply migrations on clean DB
Source: Added
Conditions:
- All migrations apply without errors.
- The users table exists after applying migrations.

<a id="mig-int-006"></a>
#### MIG-INT-006: down migrations
Source: Added
Conditions:
- 004 down removes password_salt from users.
- 001 down removes the users table.

<a id="mig-int-007"></a>
#### MIG-INT-007: migration wrapper env resolution
Source: Added
Conditions:
- Missing `MIGRATION_USER` causes migrator grants to fail.
- Missing `RUNTIME_USER` causes base role grants to fail.

