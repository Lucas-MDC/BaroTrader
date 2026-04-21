#!/bin/sh
set -e

get_env() {
    eval "printf '%s' \"\${$1}\""
}

require_env() {
    name="$1"
    value="$(get_env "$name")"
    if [ -z "$value" ]; then
        echo "Missing required env $name." >&2
        exit 1
    fi
    printf '%s' "$value"
}

read_secret() {
    name="$1"
    value="$(get_env "$name")"
    file_path="$(get_env "${name}_FILE")"

    if [ -z "$value" ] && [ -n "$file_path" ]; then
        if [ ! -f "$file_path" ]; then
            echo "Secret file not found: $file_path" >&2
            exit 1
        fi
        value="$(cat "$file_path")"
    fi

    value="$(printf '%s' "$value" | tr -d '\r\n')"
    if [ -z "$value" ]; then
        echo "Missing required env $name or ${name}_FILE." >&2
        exit 1
    fi

    printf '%s' "$value"
}

RUNTIME_DB="$(require_env RUNTIME_DB)"
RUNTIME_USER="$(require_env RUNTIME_USER)"
MIGRATION_USER="$(require_env MIGRATION_USER)"
MIGRATION_DB="$(require_env MIGRATION_DB)"
RUNTIME_PASSWORD="$(read_secret RUNTIME_PASSWORD)"
MIGRATION_PASSWORD="$(read_secret MIGRATION_PASSWORD)"

if [ "$RUNTIME_DB" != "$MIGRATION_DB" ]; then
    echo "RUNTIME_DB and MIGRATION_DB must match." >&2
    exit 1
fi

echo "Bootstrapping BaroTrader roles and database..."

psql -v ON_ERROR_STOP=1 \
    -v runtime_user="$RUNTIME_USER" \
    -v runtime_pass="$RUNTIME_PASSWORD" \
    -v migrator_user="$MIGRATION_USER" \
    -v migrator_pass="$MIGRATION_PASSWORD" \
    -v app_db="$RUNTIME_DB" \
    --username "$POSTGRES_USER" \
    --dbname "$POSTGRES_DB" <<'EOSQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'runtime_user', :'runtime_pass')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'runtime_user') \gexec

SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'migrator_user', :'migrator_pass')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'migrator_user') \gexec

SELECT format('ALTER ROLE %I CREATEROLE', :'migrator_user')
WHERE EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = :'migrator_user' AND NOT rolcreaterole
) \gexec

SELECT format('ALTER DATABASE %I OWNER TO %I', :'app_db', :'migrator_user')
WHERE EXISTS (SELECT 1 FROM pg_database WHERE datname = :'app_db') \gexec

SELECT format('CREATE DATABASE %I OWNER %I', :'app_db', :'migrator_user')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'app_db') \gexec
EOSQL

echo "BaroTrader bootstrap complete."
