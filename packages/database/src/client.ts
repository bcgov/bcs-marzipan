/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { drizzle } from 'drizzle-orm/postgres-js';
import * as postgresModule from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  console.warn(
    'DATABASE_URL not set. Database client will not be initialized.'
  );
}

// Access the default export - when externalized, require() returns the default directly
// Type assertion needed because postgres module's default export typing varies by build target
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const postgres = (postgresModule as any).default || postgresModule;

// For query purposes
export const queryClient = connectionString ? postgres(connectionString) : null;

// For migrations
export const migrationClient = connectionString
  ? postgres(connectionString, { max: 1 })
  : null;

export const db = connectionString
  ? drizzle(queryClient, { schema })
  : (null as unknown as ReturnType<typeof drizzle>);

export type Database = typeof db;
