Snowplow Analytics Integration — Corporate Calendar (calendar-ui)

Status: Draft

Overview
--------
This document describes the Snowplow analytics integration added to `calendar-ui` to support BC Gov internal Snowplow tracking for dev/test environments. The integration is runtime-configurable via a small `config.js` served from the UI root so environments can enable/disable tracking without rebuilding images.

Goals
- Add Snowplow base tracker to dev/test only.
- Provide helper functions to emit `calendar_click` and `calendar_action` self-describing events.
- Allow per-environment toggling via OpenShift `ConfigMap` (no image rebuild required).
- Add minimal unit tests that mock analytics to prevent test flakes.

Files changed / added
- `calendar-ui/index.html` — runtime loader; initializes Snowplow only when `window.__APP_CONFIG__.ENABLE_SNOWPLOW === 'true'`.
- `calendar-ui/public/config.js` — local default runtime config (ENABLE_SNOWPLOW: 'false').
- `calendar-ui/src/lib/analytics.ts` — safe wrapper helpers: `trackCalendarClick(action)` and `trackCalendarAction(payload)`.
- `calendar-ui/src/custom.d.ts` — added `window.snowplow` typing.
- `calendar-ui/src/components/reports/ReportFiltersBar.tsx` — example instrumentation: sends `calendar_action` on search submit (Enter) and `calendar_click` for clear-search.
- `calendar-ui/src/components/reports/__tests__/ReportFiltersBar.test.tsx` — unit tests that mock `@/lib/analytics` and `@/hooks/useAuth`.
- `openshift/deploy/base/calendar-ui/configmap.yaml` — now includes a `config.js` value (default `ENABLE_SNOWPLOW: 'false'`).
- `openshift/deploy/base/calendar-ui/deployment.yaml` — mounts `config.js` into `/usr/share/nginx/html/config.js` so the app reads it at runtime.
- `calendar-ui/docs/calendar-analytics.md` — usage and verification notes (existing doc, also updated).

Runtime configuration (per-environment)
-------------------------------------
We use a runtime `config.js` file (served at `/config.js`) to control whether the Snowplow snippet runs. This allows CI/CD to update the `ConfigMap` in OpenShift per-environment.

OpenShift example (CI step):

1) Create/update the `ConfigMap` with `config.js` data:

```bash
# generate config locally
cat > /tmp/config.js <<'EOF'
window.__APP_CONFIG__ = { ENABLE_SNOWPLOW: 'true' };
EOF

# apply or update ConfigMap
oc create configmap calendar-ui-config --from-file=config.js=/tmp/config.js --dry-run=client -o yaml | oc apply -f -

# restart deployment
oc rollout restart deployment/calendar-ui -n <namespace>
```

Local development
-----------------
- By default `calendar-ui/public/config.js` sets `ENABLE_SNOWPLOW: 'false'` so Snowplow is off locally.
- To test locally, set the file to `'true'` or use a dev server proxy to serve a custom `config.js`.

Verification
------------
1. With `ENABLE_SNOWPLOW: 'true'`, load the app and open DevTools → Network.
2. Search for requests going to the Snowplow collector `spm.apps.gov.bc.ca` or inspect the network trace for calls to the `sp-2-14-0.js` script.
3. Trigger instrumented actions (search Enter and clear-search) and confirm the self-describing events are sent.
4. Analytics team provided QA link may be used to confirm events in the reporting UI.

Event schemas
-------------
- `calendar_click` — schema: `iglu:ca.bc.gov.bcs/calendar_click/jsonschema/1-0-0`
  - data: `{ action: string }`
- `calendar_action` — schema: `iglu:ca.bc.gov.bcs/calendar_action/jsonschema/1-0-0` (draft)
  - data: `{ action: string, count?: number, filters?: { ... } }`

Testing
-------
- Unit tests mock `window.snowplow` (via `@/lib/analytics` mock) so tests do not depend on the network.
- Run tests:

```bash
cd calendar-ui
npm test
```

Privacy & retention
-------------------
- Follow BC Gov analytics and privacy guidelines — avoid sending PII in analytics events.
- Optional fields in `calendar_action` may be omitted or set to `null` instead of empty strings.
- Coordinate with the analytics team to confirm data retention and schema definitions.

Rollout checklist
-----------------
- [ ] Confirm analytics team has receiver/collector configured for the environment.
- [ ] Enable `ENABLE_SNOWPLOW: 'true'` in the target environment's `ConfigMap`.
- [ ] Deploy/rollout restart and smoke test site to confirm tracking calls.
- [ ] Validate events show up in Snowplow QA dashboards.
- [ ] Keep `ENABLE_SNOWPLOW` off in Production until approved by analytics team and privacy review.

Next steps / extensions
-----------------------
- Instrument additional interactions (filter changes, export, view buttons, paging).
- Add a feature flag client library if more flags are needed.
- Provide a small CI job template to generate and apply `config.js` per environment automatically.

Contact
-------
For schema changes or reporting questions, coordinate with the BC Gov analytics team that provided the Snowplow schemas.
