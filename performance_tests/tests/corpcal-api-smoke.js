/**
 * CorpCal authenticated API smoke (read-only, low VUs).
 *
 * Auth:
 *   POST /auth/login (preferred) with PERF_USERNAME / PERF_PASSWORD, or
 *   PERF_BEARER_TOKEN — JWT sent as Authorization: Bearer (same guard as cookie).
 *
 * Run:
 *   BASE_URL=http://127.0.0.1:3001 k6 run performance_tests/tests/corpcal-api-smoke.js
 *   BASE_URL=https://<dev-host>/api k6 run performance_tests/tests/corpcal-api-smoke.js -e PERF_USERNAME=... -e PERF_PASSWORD=...
 *   npm run perf:k6:api-smoke
 *
 * DEV token-only (skips login throttles):
 *   k6 run performance_tests/tests/corpcal-api-smoke.js -e BASE_URL=... -e PERF_BEARER_TOKEN="<jwt>"
 *
 * Blockers / cookies:
 *   All endpoints below use JwtAuthGuard: Bearer OR httpOnly cookie. Cookie-only sessions
 *   without Bearer are not exercised here by design (browser flows). If login is disabled
 *   on an environment, supply PERF_BEARER_TOKEN from a browser session or service token.
 *
 * Soft / permission-seeded checks (expect 200 or 403, or 404 for look-ahead when report missing):
 *   - GET /settings/look-ahead-reset — settings.manage.look_ahead_reset
 *   - GET /login-modal/settings — settings.view
 *   - GET /reports, GET /reports/:id — reports.view
 *   - GET /lookups/* — lookups.view
 *   - GET /look-ahead — reports.view (also 404 if look-ahead report not configured)
 */

import { group, sleep } from 'k6';
import http from 'k6/http';

import { buildLoadOptions, loadTestConfig } from '../api/config.js';
import {
  authBearerHeaders,
  extractAccessToken,
  getAuthAzureConfig,
  getHealth,
  getReady,
  postLogin,
  urlFor,
} from '../api/client.js';
import { paths } from '../api/paths.js';
import {
  activityDetailEnvelope,
  activityHistoryEnvelope,
  activityListEnvelope,
  authMeLooksValid,
  checkJson200Or404Or403,
  checkJson2xx,
  checkOptionalPermissionJson,
  firstActivityId,
  globalHistoryPagedEnvelope,
  lookAheadEnvelope,
  lookAheadResetSettingsEnvelope,
  loginModalSettingsEnvelope,
  lookupsArrayEnvelope,
  reportByIdEnvelope,
  reportsListIsArray,
  tryParseJson,
} from '../api/validators.js';

const config = loadTestConfig();
const maxMs = config.smokeMaxMs;

export const options = buildLoadOptions(config);

function tagReq(name) {
  return { name, suite: 'corpcal-smoke' };
}

function obtainToken() {
  if (config.bearerTokenOverride) {
    return config.bearerTokenOverride;
  }
  const loginRes = postLogin(config);
  return extractAccessToken(loginRes);
}

export default function corpcalApiSmoke() {
  group('01_public_probes', () => {
    getHealth(config);
    getReady(config);
    getAuthAzureConfig(config);
  });

  sleep(0.35);

  let token = '';
  group('02_auth_login', () => {
    token = obtainToken();
    if (!config.bearerTokenOverride && !token) {
      // login failed — client checks record failure
      return;
    }
  });

  if (!token) {
    sleep(1);
    return;
  }

  const headers = authBearerHeaders(config, token);

  group('03_auth_me', () => {
    const res = http.get(urlFor(config, paths.authMe), {
      tags: tagReq('auth_me'),
      headers,
    });
    checkJson2xx({
      res,
      prefix: 'auth_me',
      maxMs,
      validateBody: authMeLooksValid,
    });
  });

  sleep(0.35);

  let sampleActivityId = config.activityIdOverride;

  group('04_activities_list', () => {
    const res = http.get(
      `${urlFor(config, paths.activities)}?page=1&limit=20`,
      {
        tags: tagReq('activities_list'),
        headers,
      }
    );
    const parsed = tryParseJson(res.body);
    checkJson2xx({
      res,
      prefix: 'activities_list',
      maxMs,
      validateBody: activityListEnvelope,
    });
    if (!sampleActivityId && parsed) {
      sampleActivityId = firstActivityId(parsed);
    }
  });

  sleep(0.35);

  if (sampleActivityId != null) {
    group('05_activity_detail', () => {
      const res = http.get(
        urlFor(config, `${paths.activities}/${sampleActivityId}`),
        {
          tags: tagReq('activity_detail'),
          headers,
        }
      );
      checkJson2xx({
        res,
        prefix: 'activity_detail',
        maxMs,
        validateBody: activityDetailEnvelope,
      });
    });

    sleep(0.25);

    group('06_activity_history', () => {
      const res = http.get(
        urlFor(config, `${paths.activities}/${sampleActivityId}/history`),
        {
          tags: tagReq('activity_history'),
          headers,
        }
      );
      checkJson2xx({
        res,
        prefix: 'activity_history',
        maxMs,
        validateBody: activityHistoryEnvelope,
      });
    });
  }

  sleep(0.35);

  group('07_global_history', () => {
    const q = 'page=1&pageSize=10&order=desc';
    const res = http.get(
      `${urlFor(config, paths.activitiesGlobalHistory)}?${q}`,
      {
        tags: tagReq('global_history_paged'),
        headers,
      }
    );
    checkJson2xx({
      res,
      prefix: 'global_history',
      maxMs,
      validateBody: globalHistoryPagedEnvelope,
    });
  });

  sleep(0.35);

  if (!config.skipLookAhead) {
    group('08_look_ahead', () => {
      const res = http.get(urlFor(config, paths.lookAhead), {
        tags: tagReq('look_ahead'),
        headers,
      });
      checkJson200Or404Or403({
        res,
        prefix: 'look_ahead',
        maxMs,
        validateWhen200: lookAheadEnvelope,
      });
    });
    sleep(0.35);
  }

  group('09_login_modal_settings', () => {
    const res = http.get(urlFor(config, paths.loginModalSettings), {
      tags: tagReq('login_modal_settings'),
      headers,
    });
    checkOptionalPermissionJson({
      res,
      prefix: 'login_modal_settings',
      maxMs,
      validateWhenOk: loginModalSettingsEnvelope,
    });
  });

  sleep(0.35);

  group('10_settings_look_ahead_reset', () => {
    const res = http.get(urlFor(config, paths.settingsLookAheadReset), {
      tags: tagReq('settings_look_ahead_reset'),
      headers,
    });
    checkOptionalPermissionJson({
      res,
      prefix: 'look_ahead_reset_settings',
      maxMs,
      validateWhenOk: lookAheadResetSettingsEnvelope,
    });
  });

  sleep(0.35);

  let sampleReportId = null;

  group('11_reports_list', () => {
    const res = http.get(urlFor(config, paths.reports), {
      tags: tagReq('reports_list'),
      headers,
    });
    const parsed = tryParseJson(res.body);
    checkOptionalPermissionJson({
      res,
      prefix: 'reports_list',
      maxMs,
      validateWhenOk: reportsListIsArray,
    });
    if (
      res.status === 200 &&
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      typeof parsed[0].id === 'number'
    ) {
      sampleReportId = parsed[0].id;
    }
  });

  sleep(0.25);

  if (sampleReportId != null) {
    group('12_report_by_id', () => {
      const res = http.get(
        urlFor(config, `${paths.reports}/${sampleReportId}`),
        {
          tags: tagReq('report_by_id'),
          headers,
        }
      );
      checkOptionalPermissionJson({
        res,
        prefix: 'report_by_id',
        maxMs,
        validateWhenOk: reportByIdEnvelope,
      });
    });
  }

  sleep(0.25);

  group('13_lookups_sample', () => {
    const res = http.get(urlFor(config, paths.lookupsDateStatuses), {
      tags: tagReq('lookups_date_statuses'),
      headers,
    });
    checkOptionalPermissionJson({
      res,
      prefix: 'lookups_date_statuses',
      maxMs,
      validateWhenOk: lookupsArrayEnvelope,
    });
  });

  sleep(0.35);

  group('14_lookups_reports_meta', () => {
    const res = http.get(urlFor(config, paths.lookupsReports), {
      tags: tagReq('lookups_reports'),
      headers,
    });
    checkOptionalPermissionJson({
      res,
      prefix: 'lookups_reports',
      maxMs,
      validateWhenOk: lookupsArrayEnvelope,
    });
  });

  sleep(config.profile === 'smoke' ? 1.2 : 2);
}
