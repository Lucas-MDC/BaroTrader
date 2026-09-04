<a id="migrations-unit"></a>
### Unit

<a id="mig-unit-001"></a>
#### MIG-UNIT-001: escapeIdentifier
Source: Added
Conditions:
- Empty identifiers throw.
- Double quotes are escaped properly.

<a id="mig-unit-002"></a>
#### MIG-UNIT-002: escapeLiteral
Source: Added
Conditions:
- Non-string values throw.
- Single quotes are escaped properly.

<a id="mig-unit-003"></a>
#### MIG-UNIT-003: applyReplacements behavior
Source: Added
Conditions:
- Tokens are replaced with provided values.
- Missing tokens cause an error listing missing keys.

<a id="mig-unit-004"></a>
#### MIG-UNIT-004: loadMigrationSql
Source: Added
Conditions:
- SQL files are loaded from db/sql/migrations.
- Missing files throw an error.

<a id="mig-unit-005"></a>
#### MIG-UNIT-005: stripFlagWithValue
Source: Added
Conditions:
- Flags and their values are removed from arg lists.
- Flags passed as --flag=value are removed.

<a id="mig-unit-006"></a>
#### MIG-UNIT-006: migration name sorting
Source: Added
Conditions:
- Numeric prefixes sort in numeric order.
- Non-numeric prefixes sort lexicographically.

<a id="mig-unit-007"></a>
#### MIG-UNIT-007: listMigrationNames filters
Source: Added
Conditions:
- Only .js files in db/migrations/ are returned.
- Hidden files are ignored.

<a id="mig-unit-008"></a>
#### MIG-UNIT-008: formatRunOn behavior
Source: Added
Conditions:
- Dates format as ISO strings.
- Non-date values are returned as-is.

