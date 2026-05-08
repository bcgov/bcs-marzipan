import { Test, TestingModule } from '@nestjs/testing';

import { createMockActivity } from '../../common/test-utils';
import { ActivityMapperService } from './activity-mapper.service';

describe('ActivityMapperService', () => {
  let mapper: ActivityMapperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActivityMapperService],
    }).compile();

    mapper = module.get<ActivityMapperService>(ActivityMapperService);
  });

  describe('mapToResponseDto', () => {
    it('should map leadTeamId and leadMinistryId from activity', () => {
      const activity = createMockActivity({
        id: 1,
        leadTeamId: 5,
        leadMinistryId: 2,
      });

      const result = mapper.mapToResponseDto(activity);

      expect(result.leadTeamId).toBe(5);
      expect(result.leadMinistryId).toBe(2);
    });

    it('should map leadMinistryId to null when activity has null leadMinistryId', () => {
      const activity = createMockActivity({
        id: 1,
        leadTeamId: 3,
        leadMinistryId: null,
      });

      const result = mapper.mapToResponseDto(activity);

      expect(result.leadTeamId).toBe(3);
      expect(result.leadMinistryId).toBeNull();
    });

    it('should map null venueStatusId and omit computed venueStatus when not provided', () => {
      const activity = createMockActivity({
        id: 1,
        venueStatusId: null,
      });

      const result = mapper.mapToResponseDto(activity);

      expect(result.venueStatusId).toBeNull();
      expect(result.venueStatus).toBeNull();
    });

    it('should map venueStatus from relatedData when venueStatusId is set', () => {
      const activity = createMockActivity({
        id: 1,
        venueStatusId: 2,
      });

      const result = mapper.mapToResponseDto(activity, {
        venueStatus: 'Venue TBC',
      });

      expect(result.venueStatusId).toBe(2);
      expect(result.venueStatus).toBe('Venue TBC');
    });

    it('should include canEdit when relatedData.canEdit is true', () => {
      const activity = createMockActivity({ id: 1 });
      const result = mapper.mapToResponseDto(activity, { canEdit: true });
      expect(result.canEdit).toBe(true);
    });

    it('should include canEdit when relatedData.canEdit is false', () => {
      const activity = createMockActivity({ id: 1 });
      const result = mapper.mapToResponseDto(activity, { canEdit: false });
      expect(result.canEdit).toBe(false);
    });

    it('should omit canEdit when relatedData.canEdit is undefined', () => {
      const activity = createMockActivity({ id: 1 });
      const result = mapper.mapToResponseDto(activity);
      expect('canEdit' in result).toBe(false);
    });

    it('should omit canEdit when relatedData is provided without canEdit', () => {
      const activity = createMockActivity({ id: 1 });
      const result = mapper.mapToResponseDto(activity, {
        activityStatus: 'Draft',
      });
      expect('canEdit' in result).toBe(false);
    });
  });

  describe('calendar date and civil time formatting', () => {
    it('passes through YYYY-MM-DD calendar dates from the DB unchanged', () => {
      const activity = createMockActivity({
        id: 42,
        startDate: '2026-04-27',
        endDate: '2026-04-28',
        pitchDate: '2026-04-25',
      });

      const result = mapper.mapToResponseDto(activity);

      expect(result.startDate).toBe('2026-04-27');
      expect(result.endDate).toBe('2026-04-28');
      expect(result.pitchDate).toBe('2026-04-25');
    });

    it('extracts UTC components when a Date arrives instead of a string', () => {
      // Defensive path: postgres-js returns DATE as a string today, but if a
      // future driver flag returns a UTC-midnight Date, the mapper must still
      // produce the correct calendar day regardless of host TZ.
      const utcMidnight = new Date(Date.UTC(2026, 3, 27, 0, 0, 0));
      const activity = createMockActivity({
        startDate: utcMidnight as unknown as string,
      });

      const result = mapper.mapToResponseDto(activity);

      expect(result.startDate).toBe('2026-04-27');
    });

    it('truncates HH:mm:ss civil times to HH:mm', () => {
      const activity = createMockActivity({
        startTime: '09:30:00',
        endTime: '14:00:00',
      });

      const result = mapper.mapToResponseDto(activity);

      expect(result.startTime).toBe('09:30');
      expect(result.endTime).toBe('14:00');
    });

    it('returns null for missing schedule fields', () => {
      const activity = createMockActivity({
        startDate: null,
        endDate: null,
        startTime: null,
        endTime: null,
        pitchDate: null,
      });

      const result = mapper.mapToResponseDto(activity);

      expect(result.startDate).toBeNull();
      expect(result.endDate).toBeNull();
      expect(result.startTime).toBeNull();
      expect(result.endTime).toBeNull();
      expect(result.pitchDate).toBeNull();
    });

    it('formats audit instants as UTC ISO strings ending in Z', () => {
      const created = new Date('2026-04-27T15:30:00.000Z');
      const updated = new Date('2026-04-27T16:45:00.000Z');
      const activity = createMockActivity({
        createdDateTime: created,
        lastUpdatedDateTime: updated,
      });

      const result = mapper.mapToResponseDto(activity);

      expect(result.createdDateTime).toBe('2026-04-27T15:30:00.000Z');
      expect(result.lastUpdatedDateTime).toBe('2026-04-27T16:45:00.000Z');
    });
  });
});
