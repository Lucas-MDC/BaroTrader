<a id="db-tooling-security"></a>
### Security

<a id="dbt-sec-001"></a>
#### DBT-SEC-001: destructive guard in production
Source: Added
Conditions:
- APP_ENV values outside development/test block cleanup.

<a id="dbt-sec-002"></a>
#### DBT-SEC-002: destructive confirmation match
Source: Added
Conditions:
- DB_DESTRUCTIVE_CONFIRM must exactly match the target database name.

