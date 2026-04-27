#!/bin/bash
set -e

is_development_env() {
	local env
	env=$(echo "${APP_ENV:-}" | tr '[:upper:]' '[:lower:]')
	[[ "$env" == "dev" || "$env" == "development" || "$env" == "local" ]]
}

is_truthy() {
	local value
	value=$(echo "$1" | tr '[:upper:]' '[:lower:]')
	[[ "$value" == "1" || "$value" == "true" || "$value" == "yes" || "$value" == "on" ]]
}

echo "Waiting for database..."
sleep 2

echo "Creating database if not exists..."
export PGPASSWORD="$DB_PASSWORD"
psql -U "$DB_USER" -h "$DB_HOST" -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true

echo "Running migrations..."
alembic upgrade head

if is_development_env; then
	if is_truthy "${RUN_SEED_ON_STARTUP:-true}"; then
		echo "Running development seed..."
		python -m app.seed
	else
		echo "Skipping seed (RUN_SEED_ON_STARTUP is disabled)."
	fi
else
	echo "Skipping seed (APP_ENV is not development)."
fi

echo "Starting application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
