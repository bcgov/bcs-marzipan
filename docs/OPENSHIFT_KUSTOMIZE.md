# Deploying to OpenShift with Kustomize

This document explains how to deploy the repo to a target OpenShift namespace using the `openshift1` kustomize base and overlays.

Files used:

- `openshift1/base/kustomization.yaml` — aggregates base manifests (pointing to `openshift/` manifests).
- `openshift1/overlays/dev/kustomization.yaml` — dev overlay with namespace and image placeholders.

Quick steps (manual)

1. Choose your namespace (example: `d8b00f-dev`).
2. Copy the `dev` overlay and set your namespace and images, or edit in place:

```bash
# set variable
NAMESPACE=d8b00f-dev
# Replace placeholder in overlay (in-place)
sed -i "s/REPLACE_NAMESPACE/${NAMESPACE}/g" openshift1/overlays/dev/kustomization.yaml
```

3. Build and apply the kustomize output with `oc`:

```bash
# Ensure you're logged into OpenShift and project set
oc login --token=$OPENSHIFT_TOKEN --server=$OPENSHIFT_SERVER --insecure-skip-tls-verify=true
oc project $NAMESPACE

# Apply the kustomized manifests
oc apply -k openshift1/overlays/dev
```

4. If you use BuildConfigs to build images (recommended for CI workflows), start builds for service and UI (from repo root):

```bash
oc start-build calendar-service-build --from-dir=. --follow --commit=$(git rev-parse HEAD)
oc start-build calendar-ui-build --from-dir=. --follow --commit=$(git rev-parse HEAD)
```

5. If you need to run DB migrations:

- Start `calendar-db-migrate` build (Dockerfile.migrate exists):

```bash
oc start-build calendar-db-migrate --from-dir=. --follow --commit=$(git rev-parse HEAD)
```

- Run the migration job (manifest available at `openshift/database/migration/calendar-db-migrate-job.yaml`). Adjust image namespace if needed, then apply and wait:

```bash
# change image namespace in manifest if needed, then apply
sed -e "s|image-registry.openshift-image-registry.svc:5000/b3237c-dev|image-registry.openshift-image-registry.svc:5000/${NAMESPACE}|" \
  openshift/database/migration/calendar-db-migrate-job.yaml | oc apply -f -

oc wait --for=condition=complete job/calendar-db-migrate --timeout=600s
oc logs -l job-name=calendar-db-migrate --follow
oc delete job calendar-db-migrate
```

Notes & Troubleshooting

- The overlay contains placeholder `REPLACE_NAMESPACE` that must be replaced before applying. Use `sed` as shown, or edit the file directly.
- If your OpenShift registry prefix or image paths differ, update `openshift1/overlays/dev/kustomization.yaml` images section accordingly.
- If you prefer to avoid editing files, you can run `kustomize edit set namespace <ns>` and `kustomize edit set image <old>=<new>` within the overlay directory.

Want me to patch the overlay to directly use a specific namespace (e.g. `d8b00f-dev`) and create overlays for `staging`/`prod`? Reply with the target namespaces and I will add them.
