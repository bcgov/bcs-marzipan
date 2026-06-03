/**
 * Authenticated mock-login browser test (local).
 */
const path = require('path');
const { spawn } = require('child_process');

const repoRoot = path.join(__dirname, '..');
const envFile = path.join(repoRoot, 'performance_tests', '.env');

require('dotenv').config({ path: envFile });

const env = { ...process.env };

function setDefault(key, value) {
  const current = env[key];
  if (current === undefined || String(current).trim() === '') {
    env[key] = value;
  }
}

setDefault('FRONTEND_URL', 'http://127.0.0.1:3000');
setDefault('K6_BROWSER_HEADLESS', 'true');
setDefault('MOCK_LOGIN_USERNAME', 'thomas.garcia');

const scriptPath = 'performance_tests/browser/corpcal-mock-auth-flow.js';

const child = spawn('k6', ['run', scriptPath], {
  cwd: repoRoot,
  env,
  stdio: 'inherit',
  shell: false,
});

child.on('error', (err) => {
  console.error(
    '[perf:k6:browser:auth:local] Failed to start k6. Is it installed with browser support?\n',
    err.message
  );
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code === null ? 1 : code);
});
