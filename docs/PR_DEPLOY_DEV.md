# PR Deploy (Dev) - GitHub Actions and OpenShift DB Migrations

## Overview

This document explains how the GitHub Actions workflow `Deploy to OpenShift` (file: `.github/workflows/pr-deploy-dev.yaml`) works and how to run database migrations on OpenShift for the `corporate-calendar` project.

---

## What the `pr-deploy-dev` workflow does

- Trigger: runs on push to the `feat/CORPCAL-95-openshift-db-migration-scripts` branch.
- High level steps (see `.github/workflows/pr-deploy-dev.yaml`):
  1. Checkout the repository.
  2. Install the `oc` (OpenShift) CLI and `envsubst`.
  3. Login to OpenShift using secrets: `OPENSHIFT_TOKEN` and `OPENSHIFT_SERVER`.
  4. Apply build resources in the tools namespace from `openshift/build`.
  5. Start binary builds for:
     - `calendar-service-build` (BuildConfig)
     - `calendar-ui-build`
  6. Promote images from tools to dev using `oc tag`.
  7. Render and apply the dev deployment overlay from `openshift/deploy/overlays/dev`.
  8. Restart deployments.

Notes:

- The workflow uses GitHub secrets for OpenShift access and namespaces: `OPENSHIFT_TOKEN`, `OPENSHIFT_SERVER`, `OPENSHIFT_TOOLS_NAMESPACE`, and `OPENSHIFT_DEV_NAMESPACE`.
- The workflow is scoped to the GitHub Environment `dev-silver` (so it pulls environment-scoped secrets/vars).
- DB migrations are not run automatically in this workflow.
- Snowplow analytics are enabled by default in the OpenShift base ConfigMap, so report search analytics will send browser-side events from all hosted environments if the cluster can reach the Snowplow collector at `spm.apps.gov.bc.ca`. To disable for a specific environment, add a kustomize patch that sets `ENABLE_SNOWPLOW: 'false'` in `config.js`.

---

## How to run DB migrations on OpenShift (manual step)

There is one migration artifact already in the repo:

- `openshift/deploy/base/database/migration/calendar-db-migrate-job.yaml` - Job manifest used by the workflow.

### Recommended manual process (one-off migration run)

1. Login to OpenShift (locally or in CI shell):

   ```sh
   oc login --token=$OPENSHIFT_TOKEN --server=$OPENSHIFT_SERVER --insecure-skip-tls-verify=true
   oc project $OPENSHIFT_DEV_NAMESPACE
   ```

2. Run the migration Job using the manifest:

   ```sh
   oc apply -f openshift/deploy/base/database/migration/calendar-db-migrate-job.yaml -n $OPENSHIFT_DEV_NAMESPACE
   oc wait --for=condition=complete job/calendar-db-migrate -n $OPENSHIFT_DEV_NAMESPACE --timeout=600s
   oc logs -l job-name=calendar-db-migrate -n $OPENSHIFT_DEV_NAMESPACE --follow
   ```

3. Verify that migrations completed successfully by checking job logs and your database.

---

## Manual workflow for DB migrations and seeds

There is a manual workflow you can run from GitHub Actions:

- Workflow file: `.github/workflows/run-db-migration-dev.yaml`
- Trigger: `workflow_dispatch` (manual run only)
- Optional input: `run_seeds` to also apply seed SQL files after migrations.

The workflow:

1. Applies migration ConfigMap from `packages/database/migrations`.
2. Runs the `calendar-db-migrate` Job.
3. If `run_seeds` is true, applies seed ConfigMap from `packages/database/seeds` and runs a seed Job.

---

## Required secrets and configuration

- `OPENSHIFT_TOKEN` - service account token or personal token with appropriate permissions
- `OPENSHIFT_SERVER` - API server URL
- `OPENSHIFT_TOOLS_NAMESPACE` - tools project for builds and image tags
- `OPENSHIFT_DEV_NAMESPACE` - dev project for deployment
- `calendar-service-secrets` (OpenShift Secret) - must contain `DATABASE_URL` for the Job to connect to the DB

---

## Troubleshooting and common issues

- Builds may fail during `npm ci` due to optional native `@swc/core` binaries. Workarounds:
  - Install without optional native deps: `npm ci --no-optional`
  - Or set env var: `NPM_CONFIG_OPTIONAL=false npm ci`
  - In this repo we centralized `@swc/core` in the root `devDependencies` and pinned `picomatch` via `overrides` to reduce install mismatches.
- If your Job fails to find the image, check the internal image registry path and namespace in the Job manifest.
- Increase `oc wait` timeout if migrations take longer than the default.

---

## Quick checklist

- [ ] Ensure GitHub Secrets (`OPENSHIFT_*`) are configured in the repo.
- [ ] Ensure `calendar-service-secrets` contains `DATABASE_URL`.
- [ ] Run the manual workflow when migrations (and optional seeds) are needed.
- [ ] Confirm Job logs and database state.
