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

# Run config-data first, then seeds. Keep alphabetical order within each directory.
for dir in $dirs; do
  for f in $(find "$dir" -maxdepth 1 -type f -name '*.sql' | awk -F/ '{print $NF "|" $0}' | sort | cut -d'|' -f2-); do
    if [ ! -f "$f" ]; then
      continue
    fi

    echo "Applying $f"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
  done
done

echo "DB seeds completed successfully."
