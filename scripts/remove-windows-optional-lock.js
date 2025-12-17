#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const lockPath = path.resolve(process.cwd(), 'package-lock.json');
if (!fs.existsSync(lockPath)) {
  console.warn('No package-lock.json found; skipping lockfile cleanup.');
  process.exit(0);
}
let lock;
try {
  lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
} catch (e) {
  console.error('Failed to parse package-lock.json:', e.message);
  process.exit(1);
}
let removed = 0;
// Remove entries in `packages` whose name contains 'win32' or 'rollup-win32'
if (lock.packages && typeof lock.packages === 'object') {
  for (const key of Object.keys(lock.packages)) {
    const pkg = lock.packages[key];
    if (pkg && pkg.name && /win32|rollup-win32/i.test(pkg.name)) {
      delete lock.packages[key];
      removed++;
    }
  }
}
// Also remove from top-level dependencies map
if (lock.dependencies && typeof lock.dependencies === 'object') {
  for (const dep of Object.keys(lock.dependencies)) {
    if (/win32|rollup-win32/i.test(dep)) {
      delete lock.dependencies[dep];
      removed++;
    }
  }
}
if (removed > 0) {
  try {
    fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2));
    console.log(`Removed ${removed} windows-specific entries from package-lock.json`);
  } catch (e) {
    console.error('Failed to write package-lock.json:', e.message);
    process.exit(1);
  }
} else {
  console.log('No windows-specific optional entries found in package-lock.json');
}
process.exit(0);
