# PR Deploy (Dev) — GitHub Actions & OpenShift DB Migrations 🔧

## Overview ✅

This document explains how the GitHub Actions workflow `Deploy to OpenShift` (file: `.github/workflows/pr-deploy-dev.yaml`) works and how to run database migrations on OpenShift for the `corporate-calendar` project.

---

## What the `pr-deploy-dev` workflow does

- Trigger: runs on push to the `develop` branch.
- High level steps (see `.github/workflows/pr-deploy-dev.yaml`):
  1. Checkout the repository.
  2. Install the `oc` (OpenShift) CLI.
  3. Login to OpenShift using secrets: `OPENSHIFT_TOKEN` and `OPENSHIFT_SERVER`.
  4. Switch to the target project/namespace defined by the `OPENSHIFT_NAMESPACE` secret.
  5. Start binary builds for:
     - `calendar-service-build` (BuildConfig) — runs `oc start-build calendar-service-build --from-dir=. --follow --commit=$(git rev-parse HEAD)`
     - `calendar-ui-build` — runs `oc start-build calendar-ui-build --from-dir=. --follow --commit=$(git rev-parse HEAD)`

Notes:

- The workflow uses the provided OpenShift credentials and namespace from GitHub Secrets: `OPENSHIFT_TOKEN`, `OPENSHIFT_SERVER`, and `OPENSHIFT_NAMESPACE`.
- The workflow currently only starts the two workspace builds (service and UI). It does not automatically run DB migration jobs as part of the deploy job by default.

---

## How to run DB migrations on OpenShift (manual step) 🛠️

There are two primary artifacts already in the repo related to migrations:

- `Dockerfile.migrate` — builds an image that will run migrations and then seed the app. Default command runs:
  ```sh
  npm run db:migrate --workspace=packages/database && npm run seed --workspace=calendar-service
  ```
- `openshift/database/migration/calendar-db-migrate.yaml` — (BuildConfig, currently kept for reference)
- `openshift/database/migration/calendar-db-migrate-job.yaml` — (Job manifest, currently kept for reference)

### Recommended manual process (one-off migration run)

1. Login to OpenShift (locally or in CI shell):

   ```sh
   oc login --token=$OPENSHIFT_TOKEN --server=$OPENSHIFT_SERVER --insecure-skip-tls-verify=true
   oc project $OPENSHIFT_NAMESPACE
   ```

2. Start a binary build that uses `Dockerfile.migrate`:

   ```sh
   oc start-build calendar-db-migrate --from-dir=. --follow --commit=$(git rev-parse HEAD)
   ```

   - This will create/push the `calendar-db-migrate:latest` image into the internal image registry for your project.

3. Run the migration Job using the job manifest or an ad-hoc job:
   - Using the existing job manifest (replace namespace in image if required):

     ```sh
     # Update the image reference if you do not use the hard-coded namespace in the manifest
     sed -e "s|image-registry.openshift-image-registry.svc:5000/b3237c-dev|image-registry.openshift-image-registry.svc:5000/${OPENSHIFT_NAMESPACE}|" \
       openshift/database/migration/calendar-db-migrate-job.yaml | oc apply -f -

     # Wait for completion, tail logs
     oc wait --for=condition=complete job/calendar-db-migrate --timeout=600s
     oc logs -l job-name=calendar-db-migrate --follow

     # Clean up job
     oc delete job calendar-db-migrate
     ```

   - Or create/run an ad-hoc pod/job directly pointing to the image:
     ```sh
     oc run calendar-db-migrate --restart=Never --image=image-registry.openshift-image-registry.svc:5000/${OPENSHIFT_NAMESPACE}/calendar-db-migrate:latest -- env=DATABASE_URL=$(oc get secret calendar-service-secrets -o jsonpath='{.data.DATABASE_URL}' | base64 -d) -- /bin/sh -c "npm run db:migrate --workspace=packages/database && npm run seed --workspace=calendar-service"
     ```

4. Verify that migrations and seed completed successfully by checking job logs and your database.

---

## How to wire migrations into the GitHub Actions workflow (optional) 🔁

If you want migrations to run automatically as part of `pr-deploy-dev`, add steps after the `Start binary build` steps to:

1. Start the `calendar-db-migrate` build (same as above).
2. Apply or create a `Job` that points to the built image.
3. Wait for job completion and stream logs.

Example additional steps to append in `.github/workflows/pr-deploy-dev.yaml`:

```yaml
- name: Start DB migrate build
  run: |
    oc start-build calendar-db-migrate --from-dir=. --follow --commit=$(git rev-parse HEAD)

- name: Run DB migration job
  run: |
    sed -e "s|image-registry.openshift-image-registry.svc:5000/b3237c-dev|image-registry.openshift-image-registry.svc:5000/${{ secrets.OPENSHIFT_NAMESPACE }}|" \
      openshift/database/migration/calendar-db-migrate-job.yaml | oc apply -f -
    oc wait --for=condition=complete job/calendar-db-migrate --timeout=600s
    oc logs -l job-name=calendar-db-migrate --follow
    oc delete job calendar-db-migrate
```

Be sure to adjust the manifest image reference for your namespace or use an imageStream reference if preferred.

---

## Required secrets & configuration 🔐

- `OPENSHIFT_TOKEN` — service account token or personal token with appropriate permissions
- `OPENSHIFT_SERVER` — API server URL
- `OPENSHIFT_NAMESPACE` — target project/namespace
- `calendar-service-secrets` (OpenShift Secret) — must contain `DATABASE_URL` for the Job to connect to the DB

---

## Troubleshooting & common issues ⚠️

- Builds may fail during `npm ci` due to optional native `@swc/core` binaries. Workarounds:
  - Install without optional native deps: `npm ci --no-optional`
  - Or set env var: `NPM_CONFIG_OPTIONAL=false npm ci`
  - In this repo we centralized `@swc/core` in the root `devDependencies` and pinned `picomatch` via `overrides` to reduce install mismatches.
- If your Job fails to find the image, check the internal image registry path and namespace in the Job manifest.
- Increase `oc wait` timeout if migrations take longer than the default.

---

## Quick checklist ✅

- [ ] Ensure GitHub Secrets (`OPENSHIFT_*`) are configured in the repo.
- [ ] Ensure `calendar-service-secrets` contains `DATABASE_URL`.
- [ ] Start `calendar-db-migrate` build and run Job to execute migrations.
- [ ] Confirm Job logs and database state.
