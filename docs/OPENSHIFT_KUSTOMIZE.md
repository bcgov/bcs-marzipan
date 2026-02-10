# Deploying to OpenShift with Kustomize

This document explains how to deploy the corporate calendar app to OpenShift using kustomize and the GitHub Actions workflow, as well as manual steps.

## Overview

The project uses two separate kustomize bases:

- **`openshift/build`** — ImageStreams and BuildConfigs for building images in a tools namespace.
- **`openshift/deploy`** — Deployments, Services, Routes, and ConfigMaps for running the app in target environments (dev, staging, prod).

## Automated deployment via GitHub Actions

The workflow `.github/workflows/pr-deploy-dev.yaml` is triggered on pushes to the feature branch and:

1. **Logs into OpenShift** using secrets: `OPENSHIFT_SERVER`, `OPENSHIFT_TOKEN`.
2. **Applies build resources** in `TOOLS_NAMESPACE` (ImageStreams, BuildConfigs).
3. **Starts binary builds** for `calendar-service` and `calendar-ui` from repo source.
4. **Tags images** from tools namespace to the target deployment namespace (e.g., `DEV_NAMESPACE`).
5. **Applies deploy resources** using kustomize overlay for the target environment (dev/staging/prod).
6. **Rolls out** the updated deployments.

### Required GitHub Secrets

Set these secrets in the repo settings for the workflow to run:

- `OPENSHIFT_SERVER` — OpenShift API server URL (e.g., `https://api.silver.devops.gov.bc.ca:6443`)
- `OPENSHIFT_TOKEN` — Service account token with build and deploy permissions
- `OPENSHIFT_TOOLS_NAMESPACE` — Namespace for building images (e.g., `d8b00f-tools`)
- `OPENSHIFT_DEV_NAMESPACE` — Namespace for dev deployment (e.g., `d8b00f-dev`)
- `OPENSHIFT_STAGING_NAMESPACE` — Namespace for staging deployment (e.g., `d8b00f-staging`)
- `OPENSHIFT_PROD_NAMESPACE` — Namespace for prod deployment (e.g., `d8b00f-prod`)

### Workflow trigger

The workflow triggers automatically on push to the branch defined in the `on.push.branches` section (currently `feat/CORPCAL-95-openshift-db-migration-scripts`). Modify this to match your target branch (e.g., `develop` or `main`). 2. Copy the `dev` overlay and set your namespace and images, or edit in place:

```bash
# set variable
NAMESPACE=d8b00f-dev
# Replace placeholder in overlay (in-place)
sed -i "s/REPLACE_NAMESPACE/${NAMESPACE}/g" openshift/deploy/overlays/dev/kustomization.yaml
```

### 3. Build and apply the kustomize output with `oc`:

```bash
# Ensure you're logged into OpenShift and project set
oc login --token=$OPENSHIFT_TOKEN --server=$OPENSHIFT_SERVER --insecure-skip-tls-verify=true
oc project $NAMESPACE

# Apply the kustomized manifests
oc apply -k openshift/deploy/overlays/dev
```

4. If you use BuildConfigs to build images (recommended for CI workflows), start builds for service and UI (from repo root):

```bash
oc start-build calendar-service-build --from-dir=. --follow --commit=$(git rev-parse HEAD)
oc start-build calendar-ui-build --from-dir=. --follow --commit=$(git rev-parse HEAD)
```

→ Replace entire section below with new one:

```bash
oc start-build calendar-service-build --from-dir=. --follow --commit=$(git rev-parse HEAD)
oc start-build calendar-ui-build --from-dir=. --follow --commit=$(git rev-parse HEAD)
```

## Running database migrations

If you need to run database migrations manually after deployment:

### Option 1: Using the migration job manifest

```bash
# Ensure you're in the target deployment namespace
oc project ${DEV_NAMESPACE}

# Apply the migration job (adjust image namespace if needed)
oc apply -f openshift/database/migration/calendar-db-migrate-job.yaml

# Wait for completion and check logs
oc wait --for=condition=complete job/calendar-db-migrate --timeout=600s
oc logs -l job-name=calendar-db-migrate --follow

# Clean up
oc delete job calendar-db-migrate
```

## Troubleshooting

- **BuildConfig not found:** Ensure you've run step 2 (Apply build resources) in the tools namespace first.
- **Image not found in deployment:** Check that you've tagged images correctly (step 4) from tools to target namespace.
- **Deployment not picking up new image:** Use `oc rollout restart deployment/<name>` to force a rollout.
- **Database migrations failing:** Check job logs with `oc logs -l job-name=calendar-db-migrate` and ensure the `DATABASE_URL` secret is set in the target namespace.
- **envsubst not found (on macOS):** Install with `brew install gettext && brew link gettext --force`.

## Environment-specific overlays

Three overlays are available for different environments:

- `openshift/deploy/overlays/dev` — development environment
- `openshift/deploy/overlays/staging` — staging environment
- `openshift/deploy/overlays/prod` — production environment

Each overlay can customize namespaces, replicas, resource limits, and image tags. To use a different overlay, replace `dev` in the deploy command with your target environment (e.g., `openshift/deploy/overlays/staging`).

Each overlay can customize namespaces, replicas, resource limits, and image tags. To use a different overlay, replace `dev` in the deploy command with your target environment (e.g., `openshift/deploy/overlays/staging`).

Notes & Troubleshooting

- The overlay contains placeholder `REPLACE_NAMESPACE` that must be replaced before applying. Use `sed` as shown, or edit the file directly.
- If your OpenShift registry prefix or image paths differ, update `openshift/overlays/dev/kustomization.yaml` images section accordingly.
- If you prefer to avoid editing files, you can run `kustomize edit set namespace <ns>` and `kustomize edit set image <old>=<new>` within the overlay directory.
