import { mapDatabaseError } from './database-error.mapper';

function errorWithCode(code: string): Error & { code?: string } {
  return Object.assign(new Error('DB error'), { code });
}

describe('mapDatabaseError', () => {
  describe('mapped codes', () => {
    it('23505 returns 409 Conflict', () => {
      const result = mapDatabaseError(errorWithCode('23505'));
      expect(result).toEqual({
        httpStatus: 409,
        type: 'https://api.example.com/errors/conflict',
        title: 'Conflict',
        detail: 'A record with this value already exists',
      });
    });

    it('23503 returns 400 Invalid Reference', () => {
      const result = mapDatabaseError(errorWithCode('23503'));
      expect(result).toEqual({
        httpStatus: 400,
        type: 'https://api.example.com/errors/bad-request',
        title: 'Invalid Reference',
        detail: 'Referenced record does not exist',
      });
    });

    it('23514 returns 400 Constraint Violation', () => {
      const result = mapDatabaseError(errorWithCode('23514'));
      expect(result).toEqual({
        httpStatus: 400,
        type: 'https://api.example.com/errors/bad-request',
        title: 'Constraint Violation',
        detail: 'Value violates constraint',
      });
    });

    it('23502 returns 400 Missing Required Field', () => {
      const result = mapDatabaseError(errorWithCode('23502'));
      expect(result).toEqual({
        httpStatus: 400,
        type: 'https://api.example.com/errors/bad-request',
        title: 'Missing Required Field',
        detail: 'A required field cannot be null',
      });
    });

    it('40001 returns 409 Concurrent Update Conflict', () => {
      const result = mapDatabaseError(errorWithCode('40001'));
      expect(result).toEqual({
        httpStatus: 409,
        type: 'https://api.example.com/errors/conflict',
        title: 'Concurrent Update Conflict',
        detail: 'Another operation modified this record. Please retry',
      });
    });

    it('40P01 returns 503 Temporary Conflict', () => {
      const result = mapDatabaseError(errorWithCode('40P01'));
      expect(result).toEqual({
        httpStatus: 503,
        type: 'https://api.example.com/errors/service-unavailable',
        title: 'Temporary Conflict',
        detail: 'A temporary conflict occurred. Please retry',
      });
    });

    it('ECONNREFUSED returns 503 Database Unavailable', () => {
      const result = mapDatabaseError(errorWithCode('ECONNREFUSED'));
      expect(result).toEqual({
        httpStatus: 503,
        type: 'https://api.example.com/errors/service-unavailable',
        title: 'Database Unavailable',
        detail: 'Database connection failed. Please try again later',
      });
    });

    it('ETIMEDOUT returns 503 Database Unavailable', () => {
      const result = mapDatabaseError(errorWithCode('ETIMEDOUT'));
      expect(result).toEqual({
        httpStatus: 503,
        type: 'https://api.example.com/errors/service-unavailable',
        title: 'Database Unavailable',
        detail: 'Database connection failed. Please try again later',
      });
    });
  });

  describe('unknown or missing code', () => {
    it('returns null when error has no code', () => {
      expect(mapDatabaseError(new Error())).toBeNull();
    });

    it('returns null for unknown code', () => {
      expect(mapDatabaseError(errorWithCode('99999'))).toBeNull();
    });
  });
});
