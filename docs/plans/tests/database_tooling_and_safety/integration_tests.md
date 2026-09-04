<a id="db-tooling-integration"></a>
### Integration

<a id="dbt-int-001"></a>
#### DBT-INT-001: db:setup idempotency
Source: Added
Conditions:
- db:setup creates runtime and migrator users and the database.
- Re-running db:setup does not error when they already exist.

<a id="dbt-int-002"></a>
#### DBT-INT-002: db:cleanup safety gates
Source: Added
Conditions:
- db:cleanup fails when safety gates are not satisfied.
- db:cleanup succeeds when gates are satisfied.

<a id="dbt-int-003"></a>
#### DBT-INT-003: db:seed smoke test
Source: Added
Conditions:
- runAsUser creates a user and can fetch it by username and id.
- The smoke test logs the created user summary.

<a id="dbt-int-004"></a>
#### DBT-INT-004: db:seed schema alignment
Source: Added
Conditions:
- runAsUser supplies passwordSalt to createUser.
- The smoke test fails when required fields are missing (document current behavior).

<a id="dbt-int-005"></a>
#### DBT-INT-005: db main error path
Source: Added
Conditions:
- Errors in a flow set process.exitCode to 1.
- closeAll is invoked in the finally block.

