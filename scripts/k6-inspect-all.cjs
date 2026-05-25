/**
 * Validate all k6 scripts (syntax / options) without hitting a real target.
 */
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.join(__dirname, '..');

const targets = [
  {
    script: 'performance_tests/tests/corpcal-api-smoke.js',
    env: { BASE_URL: 'http://127.0.0.1:1', PERF_PROFILE: 'smoke' },
  },
  {
    script: 'performance_tests/tests/corpcal-api.js',
    env: { BASE_URL: 'http://127.0.0.1:1', PERF_PROFILE: 'standard' },
  },
  {
    script: 'performance_tests/browser/corpcal-frontend-smoke.js',
    env: { FRONTEND_URL: 'http://127.0.0.1:1' },
  },
  {
    script: 'performance_tests/browser/corpcal-login-public-flow.js',
    env: { FRONTEND_URL: 'http://127.0.0.1:1' },
  },
  {
    script: 'performance_tests/browser/corpcal-mock-auth-flow.js',
    env: { FRONTEND_URL: 'http://127.0.0.1:1', MOCK_LOGIN_USERNAME: 'thomas.garcia' },
  },
];

for (const { script, env } of targets) {
  const args = ['inspect', script];
  for (const [key, value] of Object.entries(env)) {
    args.push('-e', `${key}=${value}`);
  }
  const result = spawnSync('k6', args, {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: false,
  });
  if (result.error) {
    console.error(
      '[perf:k6:inspect] Failed to start k6. Is it installed and on PATH?\n',
      result.error.message
    );
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
