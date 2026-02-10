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

/**
 * Maps PostgreSQL SQLSTATE codes to HTTP error responses
 */
export function mapDatabaseError(
  error: Error & { code?: string }
): DatabaseErrorMapping | null {
  const sqlState = error.code;

  if (!sqlState) {
    return null;
  }

  switch (sqlState) {
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
