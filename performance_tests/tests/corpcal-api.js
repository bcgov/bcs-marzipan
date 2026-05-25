/**
 * CorpCal API load scenario (includes POST /activities create). For read-only smoke
 * against shared DEV, use performance_tests/tests/corpcal-api-smoke.js (`npm run perf:k6:api-smoke`).
 *
 * CorpCal API load test: health, readiness, auth, activities list, POST create, settings sample, history, reports.
 *
 * Auth (one login per run via setup(); avoids POST /auth/login throttle of 5 req/min per IP):
 *   PERF_BEARER_TOKEN — JWT sent as Authorization: Bearer (skips login), or
 *   PERF_USERNAME / PERF_PASSWORD — login once in setup(), token reused by all VUs.
 *
 * Run locally (k6 must be on PATH):
 *   npm run perf:k6
 *   BASE_URL=http://localhost:3001 k6 run performance_tests/tests/corpcal-api.js
 *   PERF_PROFILE=smoke BASE_URL=http://localhost:3001 k6 run performance_tests/tests/corpcal-api.js
 *
 * Read-only smoke (no POST /activities): npm run perf:k6:local
 *
 * Through Vite dev proxy:
 *   BASE_URL=http://localhost:3000/api k6 run performance_tests/tests/corpcal-api.js
 *
 * Shared environments: prefer PERF_BEARER_TOKEN. POST /activities creates real rows — avoid shared DEV unless intended.
 * General API limits: ThrottlerModule 200 req/min; RateLimitInterceptor default 100 req/min (health/ready excluded).
 */

import { sleep } from 'k6';

import { buildLoadOptions, loadTestConfig } from '../api/config.js';
import {
  extractAccessToken,
  getActivities,
  getAuthAzureConfig,
  getAuthMe,
  getHealth,
  getReady,
  getUsers,
  getSettingsLookAheadReset,
  postCreateActivity,
  getGlobalHistory,
  getReports,
  postLogin,
} from '../api/client.js';

const config = loadTestConfig();

export const options = buildLoadOptions(config);

/**
 * Obtain JWT once per run. PERF_BEARER_TOKEN skips POST /auth/login (5 req/min per IP).
 */
export function setup() {
  if (config.bearerTokenOverride) {
    return { token: config.bearerTokenOverride };
  }
  const loginRes = postLogin(config);
  const token = extractAccessToken(loginRes);
  if (!token) {
    throw new Error(
      'setup: login failed — set PERF_BEARER_TOKEN or check PERF_USERNAME / PERF_PASSWORD'
    );
  }
  return { token };
}

export default function runScenario(data) {
  const token = data.token;

  getHealth(config);
  getReady(config);
  getAuthAzureConfig(config);

  getAuthMe(config, token);
  getActivities(config, token);
  getUsers(config, token);
  if (!config.skipLookAhead) {
    getSettingsLookAheadReset(config, token);
  }
  postCreateActivity(config, token);
  getGlobalHistory(config, token);
  getReports(config, token);

  sleep(config.profile === 'smoke' ? 2 : 8);
}
