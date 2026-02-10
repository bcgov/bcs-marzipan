// Export schema object for Drizzle
import * as schema from './schema';

export * from './schema';
export * from './client';
export * from './types';
export * from './seed-runner';

export { schema };

// Re-export Drizzle helpers from the same instance used by the database package
export {
  eq,
  and,
  inArray,
  gte,
  lte,
  lt,
  gt,
  isNull,
  isNotNull,
  sql,
} from 'drizzle-orm';
