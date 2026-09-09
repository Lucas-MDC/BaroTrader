<a id="migrations-contract"></a>
### Contract

<a id="mig-con-001"></a>
#### MIG-CON-001: users table schema
Source: Added
Conditions:
- users.id is a primary key.
- users.username is unique and not null.
- users.password_hash is not null.
- users.password_salt is not null.
- users.created_at defaults to current timestamp.

<a id="mig-con-002"></a>
#### MIG-CON-002: migrator and base role grants
Source: Added
Conditions:
- Migrator has schema create and table/sequence privileges in public.
- Base role has DML and sequence privileges.
- Base role is granted to the runtime user.

<a id="mig-con-003"></a>
#### MIG-CON-003: runtime SQL alignment
Source: Added
Conditions:
- Runtime queries reference existing columns in public.users.
- Insert queries include password_hash and password_salt.

<a id="mig-con-004"></a>
#### MIG-CON-004: infra seed SQL alignment
Source: Added
Conditions:
- Seed SQL uses the same column names as the users table schema.
- Mismatches are documented as gaps to fix.

<a id="mig-con-005"></a>
#### MIG-CON-005: SQL registry integrity
Source: Added
Conditions:
- db/sql/index.js exposes QueryFile instances for all expected SQL files.
- QueryFile paths resolve to existing files.

