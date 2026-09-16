import { mapDatabaseError } from './database-error.mapper';

function errorWithCode(
  code: string,
  message?: string,
  cause?: Error
): Error & { code?: string; cause?: unknown } {
  return Object.assign(new Error(message ?? 'DB error'), { code, cause });
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

    it('23503 returns 400 Invalid Reference when insert/update references missing row', () => {
      const result = mapDatabaseError(
        errorWithCode(
          '23503',
          'insert or update on table "deletion_audit" violates foreign key constraint "deletion_audit_user_id_users_id_fk"'
        )
      );
      expect(result).toEqual({
        httpStatus: 400,
        type: 'https://api.example.com/errors/bad-request',
        title: 'Invalid Reference',
        detail: 'Referenced record does not exist',
      });
    });

    it('23503 returns 400 Cannot Delete when parent delete is blocked by dependents', () => {
      const result = mapDatabaseError(
        errorWithCode(
          '23503',
          'update or delete on table "activities" violates foreign key constraint "activity_event_planners_activity_id_activities_id_fk" on table "activity_event_planners"'
        )
      );
      expect(result).toEqual({
        httpStatus: 400,
        type: 'https://api.example.com/errors/bad-request',
        title: 'Cannot Delete',
        detail: 'Cannot delete this record because related records still exist',
      });
    });

    it('23503 detects delete-blocked message on nested cause', () => {
      const result = mapDatabaseError(
        errorWithCode(
          '23503',
          'Failed query: delete from "activities" where "activities"."id" = $1',
          Object.assign(
            new Error(
              'update or delete on table "activities" violates foreign key constraint "activity_event_planners_activity_id_activities_id_fk" on table "activity_event_planners"'
            ),
            { code: '23503' }
          )
        )
      );
      expect(result?.title).toBe('Cannot Delete');
      expect(result?.detail).toBe(
        'Cannot delete this record because related records still exist'
      );
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
