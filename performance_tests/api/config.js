/**
 * Environment-driven test configuration.
 *
 * Required:
 *   BASE_URL  API root (e.g. http://localhost:3001 or http://localhost:3000/api)
 *
 * Optional:
 *   PERF_PROFILE     smoke | standard (default standard)
 *   PERF_USERNAME    mock / AD login username (default thomas.garcia — seeded admin)
 *   PERF_PASSWORD    optional; required for some AUTH_STRATEGY values
 *   API_KEY          forwarded as X-API-Key when set (service-specific usage)
 *   SKIP_LOOK_AHEAD  when "true", do not call look-ahead (permission or data constraints)
 *   VUS              override default virtual users (standard profile)
 *   DURATION         override default duration, e.g. 30s, 1m
 */

function stripTrailingSlash(url) {
  return url.replace(/\/+$/, '');
}

function parseBool(value, defaultValue) {
  if (value === undefined || value === '') {
    return defaultValue;
  }
  return value === 'true' || value === '1';
}

export function loadTestConfig() {
  const rawBase = __ENV.BASE_URL;
  if (!rawBase || !rawBase.trim()) {
    throw new Error(
      'BASE_URL is required (example: http://localhost:3001 or http://localhost:3000/api)'
    );
  }

  const profile = (__ENV.PERF_PROFILE || 'standard').toLowerCase();
  if (profile !== 'smoke' && profile !== 'standard') {
    throw new Error(`PERF_PROFILE must be "smoke" or "standard", got: ${profile}`);
  }

  return {
    baseUrl: stripTrailingSlash(rawBase.trim()),
    profile,
    username: __ENV.PERF_USERNAME || 'thomas.garcia',
    password: __ENV.PERF_PASSWORD || '',
    apiKey: __ENV.API_KEY || '',
    skipLookAhead: parseBool(__ENV.SKIP_LOOK_AHEAD, false),
    vuOverride: __ENV.VUS ? parseInt(__ENV.VUS, 10) : null,
    durationOverride: __ENV.DURATION || null,
  };
}

export function buildLoadOptions(config) {
  const thresholds = {
    checks: ['rate>0.85'],
    http_req_failed: ['rate<0.1'],
    http_req_duration: ['p(95)<5000'],
  };

  if (config.profile === 'smoke') {
    return {
      vus: config.vuOverride ?? 1,
      duration: config.durationOverride || '20s',
      thresholds: {
        ...thresholds,
        checks: ['rate>0.75'],
        http_req_duration: ['p(95)<8000'],
      },
    };
  }

  return {
    vus: config.vuOverride ?? 3,
    duration: config.durationOverride || '1m',
    thresholds,
  };
}
