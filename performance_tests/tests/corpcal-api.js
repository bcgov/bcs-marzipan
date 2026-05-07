/**
 * CorpCal API load test: health, readiness, auth, activities list, POST create, settings sample, history, reports.
 *
 * Run locally (k6 must be on PATH):
 *   npm run perf:k6:local
 *   BASE_URL=http://localhost:3001 k6 run performance_tests/tests/corpcal-api.js
 *   PERF_PROFILE=smoke BASE_URL=http://localhost:3001 k6 run performance_tests/tests/corpcal-api.js
 *
 * Through Vite dev proxy:
 *   BASE_URL=http://localhost:3000/api k6 run performance_tests/tests/corpcal-api.js
 *
 * The service applies a per-IP rate limit (default 100 req/min, health/ready excluded).
 * This scenario sleeps between iterations to stay under that budget for a single runner IP.
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

export default function runScenario() {
  getHealth(config);
  getReady(config);
  getAuthAzureConfig(config);

  const loginRes = postLogin(config);
  const token = extractAccessToken(loginRes);
  if (!token) {
    sleep(2);
    return;
  }

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
