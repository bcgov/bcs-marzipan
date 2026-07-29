# DB Migration Baseline Runbook (OpenShift)

Use this runbook when an environment has existing schema/data but Drizzle migration tracking is empty or out of sync.

## Symptoms

- `npm run db:migrate --workspace=packages/database` fails repeatedly.
- Logs show notices such as:
  - `schema "drizzle" already exists`
  - `relation "__drizzle_migrations" already exists`
- Migration table count is lower than expected for the image's migrations.

## Safety notes

- This runbook preserves existing application data.
- It only updates `drizzle.__drizzle_migrations` metadata in the target DB.
- Run first in dev/test, then promote to prod.

## Prerequisites

- Logged into OpenShift and correct namespace selected.
- Postgres pod running in target namespace.
- Migrate image available for target namespace.

## 1) Confirm mismatch

```bash
oc exec -n <namespace> calendar-postgres-0 -- \
  psql -U postgres -d calendar -tAc "select count(1) from drizzle.__drizzle_migrations"
```

If this is `0` (or lower than expected) while DB has tables/data, baseline is required.

## 2) Create temporary empty baseline DB

```bash
oc exec -n <namespace> calendar-postgres-0 -- \
  psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS calendar_migrate_baseline"

oc exec -n <namespace> calendar-postgres-0 -- \
  psql -U postgres -d postgres -c "CREATE DATABASE calendar_migrate_baseline"
```

## 3) Run migrate image against temporary DB

```powershell
$dbUrl = oc get secret -n <namespace> calendar-service-secrets -o jsonpath="{.data.DATABASE_URL}" |
  % { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) }

$tmpUrl = $dbUrl -replace '/calendar(\?|$)', '/calendar_migrate_baseline$1'

oc run -n <namespace> migrate-baseline-hash --rm -i --restart=Never \
  --image=image-registry.openshift-image-registry.svc:5000/<namespace>/calendar-db-migrate:<app_version> \
  --env="DATABASE_URL=$tmpUrl" \
  --command -- sh -lc "cd /app/packages/database; npx drizzle-kit migrate --config drizzle.config.ts"
```

This creates canonical rows in `drizzle.__drizzle_migrations` for the migrations present in the image.

## 4) Copy migration rows into real calendar DB metadata

```powershell
$rows = oc exec -n <namespace> calendar-postgres-0 -- \
  psql -U postgres -d calendar_migrate_baseline -At -F '|' -c \
  "select id, hash, created_at from drizzle.__drizzle_migrations order by id"

$insertValues = @()
foreach ($r in $rows) {
  $parts = $r -split '\|'
  if ($parts.Length -eq 3) {
    $id = $parts[0]
    $hash = $parts[1] -replace "'", "''"
    $created = $parts[2]
    $insertValues += "($id, '$hash', $created)"
  }
}

$sql = "BEGIN; TRUNCATE TABLE drizzle.__drizzle_migrations; " +
       "INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES " +
       ($insertValues -join ',') + "; COMMIT;"

$tmp = [System.IO.Path]::GetTempFileName()
Set-Content -Path $tmp -Value $sql
Get-Content $tmp | oc exec -i -n <namespace> calendar-postgres-0 -- psql -U postgres -d calendar
```

## 5) Verify and run migration job

```bash
oc exec -n <namespace> calendar-postgres-0 -- \
  psql -U postgres -d calendar -tAc "select count(1) from drizzle.__drizzle_migrations"

oc delete job -n <namespace> calendar-db-migrate --ignore-not-found=true
APP_VERSION=<app_version> DEV_NAMESPACE=<namespace> envsubst < openshift/deploy/base/database/migration/calendar-db-migrate-job.yaml | oc apply -n <namespace> -f -
oc wait -n <namespace> --for=condition=complete job/calendar-db-migrate --timeout=300s
oc logs -n <namespace> job/calendar-db-migrate --tail=200
```

Expected log tail:

- `[✓] migrations applied successfully!`
- `DB migrations completed successfully.`

## 6) Cleanup temporary DB

```bash
oc exec -n <namespace> calendar-postgres-0 -- \
  psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS calendar_migrate_baseline"
```

## Operational guidance

- Use `db:migrate` only for shared envs (dev/test/prod).
- Do not run `db:push` in shared envs.
- Keep migrate image branch/tag aligned with the deployment branch.
- If job spec changes, delete/recreate the Job instead of apply-in-place (Job pod template is immutable).
