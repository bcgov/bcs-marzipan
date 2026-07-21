Calendar Analytics (Snowplow) - Dev/Test Integration

- Runtime-gated: The Snowplow snippet is included in `index.html` but only initializes when `window.__APP_CONFIG__.ENABLE_SNOWPLOW === 'true'`. Keep the flag disabled in Prod until instructed.

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

Phase 1 QA Event Matrix (reports)

| Event                          | Trigger in UI                                              | Required fields to verify                                                                          | Notes                                                       |
| ------------------------------ | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `report_search_submitted`      | Press Enter in Reports search box                          | `report_name`, `search_present`, `search_length_bucket`, `active_filter_count`, `timestamp_client` | Verify no raw search text is present.                       |
| `report_search_results_loaded` | Search or filter change finishes loading fresh report data | `report_name`, `results_count_bucket`, `latency_bucket_ms`, `search_present`                       | Should emit on fresh load, not on stale placeholder data.   |
| `report_result_opened`         | Click an activity link in report preview                   | `report_name`, `item_type`, `position_in_results`, `results_count_bucket`                          | Position is 1-based index in current preview links.         |
| `report_search_cleared`        | Click clear (X) on Reports search field                    | `report_name`, `had_search_text`, `had_filters`                                                    | Includes `active_filter_count_before_clear` when available. |

Phase 1 QA Checklist (dev/test)

- Enable Snowplow (`ENABLE_SNOWPLOW: 'true'`) in the target environment.
- Open DevTools Network and filter for collector traffic (or verify in Snowplow QA dashboard).
- Validate each Phase 1 event above fires exactly once per user action.
- Confirm bucket fields are used (`search_length_bucket`, `results_count_bucket`, `latency_bucket_ms`) and no PII is sent.
- Confirm `report_name` is included on every report event.

Phase 2 QA Event Matrix (reports)

| Event                     | Trigger in UI                                  | Required fields to verify                                                  | Notes                                                    |
| ------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------- |
| `report_filters_applied`  | User changes report filters and data refreshes | `report_name`, `filter_keys_used`, `active_filter_count`                   | Should not emit when no effective filters are applied.   |
| `report_no_results_shown` | Fresh load resolves with zero matching rows    | `report_name`, `active_filter_count`, `search_present`, `filter_keys_used` | Should emit once per unique fresh zero-results response. |

Phase 3 QA Event Matrix (reports)

| Event                       | Trigger in UI                                           | Required fields to verify                                                            | Notes                                                               |
| --------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `report_export_started`     | User clicks export button and export begins             | `report_name`, `export_type`, `rows_bucket`, `active_filter_count`, `search_present` | Should fire before export completes/fails.                          |
| `report_export_completed`   | Export succeeds or fails                                | `report_name`, `export_type`, `status`, `duration_bucket_ms`                         | On failure also verify `error_category` is populated.               |
| `saved_filter_action`       | Saved filter apply/create/update/delete/default actions | `report_name`, `action`, `filter_complexity_bucket`                                  | Includes auto-default apply via `action=auto_apply_default`.        |
| `report_pagination_changed` | User changes preview page or page size (custom report)  | `report_name`, `action`, `page_number`, `page_size`, `total_pages`                   | Currently emitted from custom preview pagination interactions only. |

Localhost QA Runbook

1. Start the app:

```bash
npm run dev --workspace calendar-ui
```

2. Ensure runtime config enables Snowplow (`ENABLE_SNOWPLOW: 'true'` in the served `config.js`).
3. Open browser DevTools Network tab and filter by collector host (`spm.apps.gov.bc.ca`) or event endpoint path.
4. In Reports page, execute this sequence and confirm one matching event per action:

- Enter search text and press Enter (`report_search_submitted`).
- Change one or more filters (`report_filters_applied`).
- Wait for data load (`report_search_results_loaded`).
- If zero rows, confirm (`report_no_results_shown`).
- Click an activity row link (`report_result_opened`).
- Click export (`report_export_started`, then `report_export_completed`).
- Apply/create/update/delete a saved filter (`saved_filter_action`).
- In custom report preview, change page/page size (`report_pagination_changed`).

5. Validate privacy/bucketing:

- No raw free-text search payload should be sent.
- Bucket fields should be present where expected (`search_length_bucket`, `rows_bucket`, `duration_bucket_ms`).

6. Negative-path check:

- Trigger an export failure (for example via temporary network blocking) and verify `report_export_completed` is emitted with `status: failure`.

Implementation notes:

- The helper safely no-ops if `window.snowplow` is not present (production builds without the snippet are unaffected).
- Reports instrumentation uses dedicated `report_*` schemas and bucket fields (no raw free-text search is sent).
- Adjust schema fields and event contents to match updates to the analytics schemas as needed.

## Runtime configuration (per-environment)

This project uses a small runtime `config.js` file (served from `/config.js`) so you can toggle Snowplow per environment without rebuilding the app image. By default `public/config.js` sets `ENABLE_SNOWPLOW` to `'false'`.

OpenShift example:

1. Create a ConfigMap containing `config.js` with the desired setting:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: calendar-ui-config
data:
  config.js: |-
    window.__APP_CONFIG__ = { ENABLE_SNOWPLOW: 'true' };
```

2. Mount the ConfigMap as a file in your Deployment so the static server serves `/config.js` from the container root. Example `volumeMounts` snippet (adjust `mountPath` to match your image's static root):

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
- report_search_submitted: https://github.com/bcgov/GDX-Analytics/blob/master/examples/schemas/ca.bc.gov.bcs/report_search_submitted/jsonschema/1-0-0
- report_search_results_loaded: https://github.com/bcgov/GDX-Analytics/blob/master/examples/schemas/ca.bc.gov.bcs/report_search_results_loaded/jsonschema/1-0-0
- report_result_opened: https://github.com/bcgov/GDX-Analytics/blob/master/examples/schemas/ca.bc.gov.bcs/report_result_opened/jsonschema/1-0-0
- report_search_cleared: https://github.com/bcgov/GDX-Analytics/blob/master/examples/schemas/ca.bc.gov.bcs/report_search_cleared/jsonschema/1-0-0
- report_filters_applied: https://github.com/bcgov/GDX-Analytics/blob/master/examples/schemas/ca.bc.gov.bcs/report_filters_applied/jsonschema/1-0-0
- report_no_results_shown: https://github.com/bcgov/GDX-Analytics/blob/master/examples/schemas/ca.bc.gov.bcs/report_no_results_shown/jsonschema/1-0-0
- report_export_started: https://github.com/bcgov/GDX-Analytics/blob/master/examples/schemas/ca.bc.gov.bcs/report_export_started/jsonschema/1-0-0
- report_export_completed: https://github.com/bcgov/GDX-Analytics/blob/master/examples/schemas/ca.bc.gov.bcs/report_export_completed/jsonschema/1-0-0
- saved_filter_action: https://github.com/bcgov/GDX-Analytics/blob/master/examples/schemas/ca.bc.gov.bcs/saved_filter_action/jsonschema/1-0-0
- report_pagination_changed: https://github.com/bcgov/GDX-Analytics/blob/master/examples/schemas/ca.bc.gov.bcs/report_pagination_changed/jsonschema/1-0-0

Possible next steps:

- Instrument additional interactions (filters, export, view buttons).
- Add automated tests that mock `window.snowplow` and assert calls.
- Add a feature flag or env-var guard to control activation more explicitly.
