import { check } from 'k6';
import http from 'k6/http';

import { paths } from './paths.js';

function correlationId() {
  return `k6-${__VU}-${__ITER}-${Date.now()}`;
}

/** Axios-style success for JSON API calls (not redirects). */
function isHttp2xx(r) {
  return r.status >= 200 && r.status < 300;
}

export function defaultHeaders(config) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Correlation-ID': correlationId(),
  };
  if (config.apiKey) {
    headers['X-API-Key'] = config.apiKey;
  }
  return headers;
}

export function authBearerHeaders(config, token) {
  return {
    ...defaultHeaders(config),
    Authorization: `Bearer ${token}`,
  };
}

export function urlFor(config, path) {
  return `${config.baseUrl}${path}`;
}

export function getHealth(config) {
  const res = http.get(urlFor(config, paths.health), {
    tags: { name: 'health' },
    headers: defaultHeaders(config),
  });
  check(res, { 'health status 2xx': isHttp2xx });
  return res;
}

export function getReady(config) {
  const res = http.get(urlFor(config, paths.ready), {
    tags: { name: 'ready' },
    headers: defaultHeaders(config),
  });
  check(res, { 'ready status 2xx': isHttp2xx });
  return res;
}

export function getAuthAzureConfig(config) {
  const res = http.get(urlFor(config, paths.authAzureConfig), {
    tags: { name: 'auth_azure_config' },
    headers: defaultHeaders(config),
  });
  check(res, { 'auth azure config status 2xx': isHttp2xx });
  return res;
}

export function postLogin(config) {
  const body = JSON.stringify({
    username: config.username,
    ...(config.password ? { password: config.password } : {}),
  });
  const res = http.post(urlFor(config, paths.authLogin), body, {
    tags: { name: 'auth_login' },
    headers: defaultHeaders(config),
  });
  check(res, {
    'auth login status 2xx': isHttp2xx,
    'auth login returns accessToken': (r) => {
      try {
        const parsed = JSON.parse(r.body);
        return typeof parsed.accessToken === 'string' && parsed.accessToken.length > 0;
      } catch {
        return false;
      }
    },
  });
  return res;
}

export function extractAccessToken(response) {
  try {
    const parsed = JSON.parse(response.body);
    if (typeof parsed.accessToken === 'string') {
      return parsed.accessToken;
    }
  } catch {
    // ignore
  }
  return '';
}

export function getAuthMe(config, token) {
  const res = http.get(urlFor(config, paths.authMe), {
    tags: { name: 'auth_me' },
    headers: authBearerHeaders(config, token),
  });
  check(res, { 'auth me status 2xx': isHttp2xx });
  return res;
}

export function getActivities(config, token) {
  const query = 'page=1&limit=10';
  const res = http.get(`${urlFor(config, paths.activities)}?${query}`, {
    tags: { name: 'activities_list' },
    headers: authBearerHeaders(config, token),
  });
  check(res, { 'activities list status 2xx': isHttp2xx });
  return res;
}

export function getUsers(config, token) {
  const res = http.get(urlFor(config, paths.users), {
    tags: { name: 'users' },
    headers: authBearerHeaders(config, token),
  });
  check(res, { 'users list status 2xx': isHttp2xx });
  return res;
}

export function getSettingsLookAheadReset(config, token) {
  const res = http.get(urlFor(config, paths.settingsLookAheadReset), {
    tags: { name: 'settings_look_ahead_reset' },
    headers: authBearerHeaders(config, token),
  });
  check(res, { 'settings look-ahead-reset status 2xx': isHttp2xx });
  return res;
}

/**
 * Optional env overrides (defaults align with e2e + seed: thomas.garcia on team 2 / CCHQ):
 * PERF_CREATE_COMMS_USER_ID, PERF_LEAD_TEAM_ID, PERF_LEAD_MINISTRY_ID, PERF_CREATE_CATEGORY_ID
 */
export function buildCreateActivityBody() {
  const commsUserId = __ENV.PERF_CREATE_COMMS_USER_ID
    ? parseInt(__ENV.PERF_CREATE_COMMS_USER_ID, 10)
    : 18;
  const leadTeamId = __ENV.PERF_LEAD_TEAM_ID
    ? parseInt(__ENV.PERF_LEAD_TEAM_ID, 10)
    : 2;
  const leadMinistryId = __ENV.PERF_LEAD_MINISTRY_ID
    ? parseInt(__ENV.PERF_LEAD_MINISTRY_ID, 10)
    : 1;
  const categoryId = __ENV.PERF_CREATE_CATEGORY_ID
    ? parseInt(__ENV.PERF_CREATE_CATEGORY_ID, 10)
    : 1;

  return {
    title: `k6-${__VU}-${__ITER}-${Date.now()}`,
    summary: 'k6 load-test summary',
    significance: 'k6 load-test significance',
    dateStatusId: 1,
    timeStatusId: 1,
    activityStatusId: 1,
    visibility: 'global',
    leadOrgName: 'k6 load-test org',
    leadTeamId,
    leadMinistryId,
    categoryIds: [categoryId],
    eventPlanners: [{ eventPlannerName: 'k6 planner', isLead: true }],
    commsContacts: [{ userId: commsUserId, isLead: true }],
  };
}

/** POST /activities — Nest returns 201 Created on success. */
export function postCreateActivity(config, token) {
  const body = JSON.stringify(buildCreateActivityBody());
  const res = http.post(urlFor(config, paths.activities), body, {
    tags: { name: 'activities_create' },
    headers: authBearerHeaders(config, token),
  });
  check(res, {
    'create activity status 201': (r) => r.status === 201,
    'create activity returns data id': (r) => {
      try {
        const parsed = JSON.parse(r.body);
        const id = parsed?.data?.id;
        return (
          parsed &&
          parsed.success === true &&
          parsed.data &&
          (typeof id === 'number' || typeof id === 'string')
        );
      } catch {
        return false;
      }
    },
  });
  return res;
}

export function getGlobalHistory(config, token) {
  const query = 'page=1&pageSize=10&order=desc';
  const res = http.get(
    `${urlFor(config, paths.activitiesGlobalHistory)}?${query}`,
    {
      tags: { name: 'global_history' },
      headers: authBearerHeaders(config, token),
    }
  );
  check(res, { 'global history status 2xx': isHttp2xx });
  return res;
}

export function getReports(config, token) {
  const res = http.get(urlFor(config, paths.reports), {
    tags: { name: 'reports' },
    headers: authBearerHeaders(config, token),
  });
  check(res, { 'reports status 2xx': isHttp2xx });
  return res;
}
