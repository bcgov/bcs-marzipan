/**
 * Database Error Mapper
 *
 * Maps PostgreSQL SQLSTATE error codes to appropriate HTTP status codes
 * and user-friendly error messages.
 *
 * Reference: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */

export interface DatabaseErrorMapping {
  httpStatus: number;
  type: string;
  title: string;
  detail: string;
}

type DatabaseErrorLike = Error & { code?: string; cause?: unknown };

/** Postgres/driver errors may nest the real error in cause */
function getSqlState(error: DatabaseErrorLike): string | undefined {
  if (error.code) return error.code;
  const cause = error.cause as (Error & { code?: string }) | undefined;
  return cause?.code;
}

/** Collect messages from wrapped driver errors (e.g. Drizzle → postgres.js). */
function getErrorMessage(error: DatabaseErrorLike): string {
  const parts: string[] = [];
  if (error.message) parts.push(error.message);
  const cause = error.cause as (Error & { message?: string }) | undefined;
  if (cause?.message) parts.push(cause.message);
  return parts.join(' ');
}

/** Parent-row delete blocked by dependent rows (ON DELETE NO ACTION / RESTRICT). */
function isForeignKeyDeleteBlocked(message: string): boolean {
  return /update or delete on table/i.test(message);
}

/**
 * Maps PostgreSQL SQLSTATE codes to HTTP error responses.
 * Checks both the error and error.cause so wrapped driver errors are mapped.
 */
export function mapDatabaseError(
  error: DatabaseErrorLike
): DatabaseErrorMapping | null {
  const sqlState = getSqlState(error);

  if (!sqlState) {
    return null;
  }

  const message = getErrorMessage(error);

  switch (sqlState) {
    // Undefined table (42P01) - e.g. migration not applied
    case '42P01':
      return {
        httpStatus: 500,
        type: 'https://api.example.com/errors/internal-server-error',
        title: 'Database Schema Error',
        detail:
          'A required database table is missing. Ensure migrations have been applied.',
      };

    // Unique constraint violation (23505)
    case '23505':
      return {
        httpStatus: 409,
        type: 'https://api.example.com/errors/conflict',
        title: 'Conflict',
        detail: 'A record with this value already exists',
      };

    // Foreign key violation (23503)
    case '23503':
      if (isForeignKeyDeleteBlocked(message)) {
        return {
          httpStatus: 400,
          type: 'https://api.example.com/errors/bad-request',
          title: 'Cannot Delete',
          detail:
            'Cannot delete this record because related records still exist',
        };
      }
      return {
        httpStatus: 400,
        type: 'https://api.example.com/errors/bad-request',
        title: 'Invalid Reference',
        detail: 'Referenced record does not exist',
      };

    // Check constraint violation (23514)
    case '23514':
      return {
        httpStatus: 400,
        type: 'https://api.example.com/errors/bad-request',
        title: 'Constraint Violation',
        detail: 'Value violates constraint',
      };

    // Not null violation (23502)
    case '23502':
      return {
        httpStatus: 400,
        type: 'https://api.example.com/errors/bad-request',
        title: 'Missing Required Field',
        detail: 'A required field cannot be null',
      };

    // Serialization failure (40001) - concurrent transaction conflict
    case '40001':
      return {
        httpStatus: 409,
        type: 'https://api.example.com/errors/conflict',
        title: 'Concurrent Update Conflict',
        detail: 'Another operation modified this record. Please retry',
      };

    // Deadlock detected (40P01)
    case '40P01':
      return {
        httpStatus: 503,
        type: 'https://api.example.com/errors/service-unavailable',
        title: 'Temporary Conflict',
        detail: 'A temporary conflict occurred. Please retry',
      };

    // Connection errors
    case 'ECONNREFUSED':
    case 'ETIMEDOUT':
      return {
        httpStatus: 503,
        type: 'https://api.example.com/errors/service-unavailable',
        title: 'Database Unavailable',
        detail: 'Database connection failed. Please try again later',
      };

    default:
      return null;
  }
}
