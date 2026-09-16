#!/bin/sh
set -e

echo "Checking for seed files..."
ls -l /config-data || true
ls -l /seeds || true

echo "Waiting for database..."
until pg_isready -d "$DATABASE_URL"; do
  sleep 2
done

echo "Running DB seeds (scope: ${SEED_SCOPE:-all})..."

# Determine which directories to run based on SEED_SCOPE (default: all)
case "${SEED_SCOPE:-all}" in
  config) dirs="/config-data" ;;
  seed)   dirs="/seeds" ;;
  *)      dirs="/config-data /seeds" ;;
esac

# Run config-data first, then seeds. Glob expands in lexical order within each directory.
for dir in $dirs; do
  [ -d "$dir" ] || continue
  for f in "$dir"/*.sql; do
    [ -f "$f" ] || continue
    echo "Applying $f"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
  done
done

echo "DB seeds completed successfully."
