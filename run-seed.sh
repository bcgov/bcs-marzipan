#!/bin/sh
set -e

echo "Checking for seed files..."
ls -l /seeds

echo "Waiting for database..."
until pg_isready -d "$DATABASE_URL"; do
  sleep 2
done

echo "Running DB seeds..."

for f in /seeds/*.sql; do
  if [ ! -f "$f" ]; then
    continue
  fi

  echo "Applying $f"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done

echo "DB seeds completed successfully."
