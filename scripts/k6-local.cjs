/**
 * Local k6 runner: optional performance_tests/.env, then safe defaults for local smoke runs.
 * Works on Windows (cmd/PowerShell), Git Bash, Linux, and macOS.
 * Shell-set env vars override .env (dotenv does not overwrite existing keys).
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

setDefault('BASE_URL', 'http://127.0.0.1:3001');
setDefault('PERF_PROFILE', 'smoke');
setDefault('VUS', '1');
setDefault('DURATION', '10s');

const scriptPath = 'performance_tests/tests/corpcal-api.js';

const child = spawn('k6', ['run', scriptPath], {
  cwd: repoRoot,
  env,
  stdio: 'inherit',
  shell: false,
});

child.on('error', (err) => {
  console.error(
    '[perf:k6:local] Failed to start k6. Is it installed and on PATH?\n',
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
