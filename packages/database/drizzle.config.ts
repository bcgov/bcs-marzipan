import { defineConfig } from 'drizzle-kit';
import { config } from "dotenv";

    // Load environment variables from .env.local (or .env if path is not specified)
config({ path: "../../.env" }); 

import * as path from 'path';
import * as fs from 'fs';
import type { Config } from 'drizzle-kit';

// Load environment variables from .env files
// Try to load dotenv if available
let dotenv: typeof import('dotenv') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  dotenv = require('dotenv');
} catch {
  // dotenv not available, will use environment variables directly
}

/**
 * Resolves the root .env file path.
 * The .env file is located at the monorepo root.
 * From source: packages/database -> root is ../../.env
 * From compiled: packages/database/dist -> root is ../../../.env
 */
function resolveRootEnvPath(): string {
  // Check if we're running from compiled code (in dist directory)
  const isCompiled = __dirname.includes(path.sep + 'dist' + path.sep);
  return path.resolve(__dirname, isCompiled ? '../../../.env' : '../../.env');
}

// Try to load from root .env file first, then fall back to packages/database/.env
const rootEnvPath = resolveRootEnvPath();
const localEnvPath = path.join(__dirname, '.env');

if (dotenv) {
  if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
  } else if (fs.existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath });
  }
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL environment variable is required. Please set it in your .env file or as an environment variable.'
  );
}

export default {
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
} satisfies Config;
