<a id="db-tooling-e2e"></a>
### End-to-End

<a id="dbt-e2e-001"></a>
#### DBT-E2E-001: full DB lifecycle
Source: Added
Conditions:
- setup -> migrate up -> seed -> cleanup completes in order.

<a id="dbt-e2e-002"></a>
#### DBT-E2E-002: migration lifecycle commands
Source: Added
Conditions:
- db:migrate status reports current state.
- db:migrate up applies pending migrations.
- db:migrate down and redo behave as expected.

