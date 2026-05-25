Calendar Analytics (Snowplow) - Dev/Test Integration

- Dev/test only: The Snowplow snippet was added to `index.html` for dev/test environments only. Do NOT deploy this snippet to Prod until instructed.

- Files added:
  - `src/lib/analytics.ts` — helper wrapper exposing `trackCalendarClick(action)` and `trackCalendarAction(payload)`.
  - `src/custom.d.ts` — added `window.snowplow` typing.
  - `src/components/reports/ReportFiltersBar.tsx` — example instrumentation: sends `calendar_action` when user presses Enter in the search box and `calendar_click` when the clear-search button is clicked.

Verification steps (local/dev):
1. Start the dev server (Vite):

```bash
npm run dev --workspace calendar-ui
```

2. Open the dev site and perform a search in the Reports filters. Press Enter to submit the search; the helper sends a `calendar_action` event.
3. Click the clear (X) button in the search field; the helper sends a `calendar_click` event with action `clear_search`.
4. Confirm events are received in the Snowplow service (QA intranet link provided by analytics team) or by inspecting the network tab for requests to the collector `spm.apps.gov.bc.ca`.

Implementation notes:
- The helper safely no-ops if `window.snowplow` is not present (production builds without the snippet are unaffected).
- `trackCalendarAction` includes `filters` populated from the current `filterState` and `searchKeyword`; optional fields are omitted when empty.
- Adjust schema fields and event contents to match updates to the analytics schemas as needed.

Runtime configuration (per-environment)
-------------------------------------

This project uses a small runtime `config.js` file (served from `/config.js`) so you can toggle Snowplow per environment without rebuilding the app image. By default `public/config.js` sets `ENABLE_SNOWPLOW` to `'false'`.

OpenShift example:

1) Create a ConfigMap containing `config.js` with the desired setting:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: calendar-ui-config
data:
  config.js: |-
    window.__APP_CONFIG__ = { ENABLE_SNOWPLOW: 'true' };
```

2) Mount the ConfigMap as a file in your Deployment so the static server serves `/config.js` from the container root. Example `volumeMounts` snippet (adjust `mountPath` to match your image's static root):

```yaml
volumes:
- name: calendar-ui-config
  configMap:
    name: calendar-ui-config

containers:
- name: calendar-ui
  volumeMounts:
  - name: calendar-ui-config
    mountPath: /usr/share/nginx/html/config.js
    subPath: config.js
```

Notes:
- For dev/test, set `ENABLE_SNOWPLOW: 'true'` in the ConfigMap to enable analytics; keep the production ConfigMap set to `'false'` until approvals are in place.
- If your CI/CD rebuilds the frontend per-environment, a build-time `VITE_ENABLE_SNOWPLOW` env flag is also an option, but the ConfigMap approach supports toggling without rebuilds.

Schema references:
- calendar_click: https://github.com/bcgov/GDX-Analytics/blob/master/examples/schemas/ca.bc.gov.bcs/calendar_click/jsonschema/1-0-0
- calendar_action (draft): https://github.com/bcgov/GDX-Analytics/blob/bcs-schemas/examples/schemas/ca.bc.gov.bcs/calendar_action/jsonschema/1-0-0

If you'd like, I can:
- Instrument additional interactions (filters, export, view buttons).
- Add automated tests that mock `window.snowplow` and assert calls.
- Add a feature flag or env-var guard to control activation more explicitly.
