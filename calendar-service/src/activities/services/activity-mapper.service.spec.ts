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
});
