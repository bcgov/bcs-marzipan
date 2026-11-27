import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it, vi } from 'vitest';

import { PERMISSIONS, SYSTEM_ROLES, type AuthUser } from '@corpcal/shared';

import type { DatabaseService } from '../database/database.service';
import { LegacyActivitiesController } from './legacy-activities.controller';
import { LegacyActivitiesService } from './legacy-activities.service';

describe('LegacyActivitiesService', () => {
  it('returns legacy rows with a bounded search query and a safe default sort order', async () => {
    const mockSelect = vi.fn();
    const mockWhere = vi.fn();
    const mockLimit = vi.fn();
    const mockOffset = vi.fn();

    const mockDb = {
      select: mockSelect,
    };

    const service = new LegacyActivitiesService({
      db: mockDb,
    } as unknown as DatabaseService);

    const limitResult = {
      offset: mockOffset.mockResolvedValue([]),
    };

    const chain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: mockWhere.mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: mockLimit.mockReturnValue(limitResult),
    };

    mockSelect.mockReturnValue(chain);

    const rows = await service.list({
      search: 'North Coast',
      status: 'archived',
      limit: 25,
      offset: 0,
    });

    expect(rows).toEqual([]);
    expect(mockSelect).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalledOnce();
    const predicate = new PgDialect().sqlToQuery(
      mockWhere.mock.calls[0][0] as SQL
    );
    expect(predicate.sql).toContain('"activity_statuses"."name"');
    expect(predicate.sql).toContain('"legacy_activities"."display_id"');
    expect(predicate.params).toContain('archived');
    expect(predicate.params).toContain('%north coast%');
    expect(mockLimit).toHaveBeenCalledWith(25);
    expect(mockOffset).toHaveBeenCalledWith(0);
  });

  it('returns only the selected Comms fields for legacy list rows', async () => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockResolvedValue([
        {
          id: 1,
          rawCommsMaterials: ['News release', null],
          rawTranslations: 'French',
          rawCommsContactName: '  Jane Smith  ',
        },
      ]),
    };
    const select = vi.fn().mockReturnValue(chain);
    const service = new LegacyActivitiesService({
      db: { select },
    } as unknown as DatabaseService);

    expect(await service.list()).toEqual([
      {
        id: 1,
        commsMaterials: ['News release'],
        translations: ['French'],
        commsContactName: 'Jane Smith',
      },
    ]);
    expect(select.mock.calls[0][0]).not.toHaveProperty('rawRecord');
  });

  it('projects only Overview fields and restricts notes', async () => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: 1,
          lookAheadStatus: 'changed',
          locationName: 'Prince Rupert',
          rawRecord: {
            category: ['Announcement', 'Event'],
            confidential: true,
            issue: false,
            tags: ['Health', 'Community'],
            significance: 'Important',
            notes: 'Restricted notes',
            executiveSummary: 'Historical executive summary',
            commsMaterials: ['News release', 'Social media'],
            newsReleaseOrigin: 'Ministry',
            newsReleaseDistribution: 'Province-wide',
            translations: ['French', 'Punjabi'],
            commsContactName: 'Jane Smith',
            premierStatus: 'Requested',
            governmentRepresentatives: ['Minister One', 'Minister Two'],
            eventPlanners: ['Planner One'],
            venueCity: 'Community Hall, Prince Rupert',
            unrelatedSecret: 'Do not expose',
          },
        },
      ]),
    };
    const db = { db: { select: vi.fn().mockReturnValue(chain) } };
    const service = new LegacyActivitiesService(
      db as unknown as DatabaseService
    );

    const restricted = await service.getById(1);
    expect(restricted).toEqual({
      id: 1,
      lookAheadStatus: null,
      locationName: 'Prince Rupert',
      commsMaterials: ['News release', 'Social media'],
      translations: ['French', 'Punjabi'],
      commsContactName: 'Jane Smith',
      overview: {
        category: ['Announcement', 'Event'],
        confidential: true,
        issue: false,
        tags: ['Health', 'Community'],
        significance: 'Important',
      },
      comms: {
        materials: ['News release', 'Social media'],
        newsReleaseOrigin: 'Ministry',
        newsReleaseDistribution: 'Province-wide',
        translations: ['French', 'Punjabi'],
      },
      event: {
        premierStatus: 'Requested',
        governmentRepresentatives: ['Minister One', 'Minister Two'],
        eventPlanners: ['Planner One'],
        venueCity: 'Community Hall, Prince Rupert',
      },
    });
    expect(await service.getById(1, true)).toEqual({
      ...restricted,
      overview: { ...restricted!.overview, notes: 'Restricted notes' },
    });
    expect(await service.getById(1, false, true)).toEqual({
      ...restricted,
      lookAheadStatus: 'changed',
      lookAhead: { executiveSummary: 'Historical executive summary' },
    });
  });

  it('handles common raw field names and ignores malformed optional values', async () => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: 2,
          locationName: 'Burnaby',
          rawRecord: {
            categories: 'Event',
            is_confidential: false,
            isIssue: true,
            tags: ['Health', null, 2],
            significance: { text: 'Not a text value' },
            notes: null,
            executive_summary: { text: 'Not a text value' },
            commsMaterials: 'News release',
            newsReleaseOrigin: 123,
            newsReleaseDistribution: null,
            translations: ['French', null, 2],
            premierStatus: 123,
            governmentRepresentatives: ['Minister', null, 2],
            eventPlanners: 'Planner',
            venueCity: null,
          },
        },
      ]),
    };
    const db = { db: { select: vi.fn().mockReturnValue(chain) } };
    const service = new LegacyActivitiesService(
      db as unknown as DatabaseService
    );

    expect(await service.getById(2, true)).toEqual({
      id: 2,
      lookAheadStatus: null,
      locationName: 'Burnaby',
      commsMaterials: ['News release'],
      translations: ['French'],
      commsContactName: null,
      overview: {
        category: ['Event'],
        confidential: false,
        issue: true,
        tags: ['Health'],
        significance: null,
        notes: null,
      },
      comms: {
        materials: ['News release'],
        newsReleaseOrigin: null,
        newsReleaseDistribution: null,
        translations: ['French'],
      },
      event: {
        premierStatus: null,
        governmentRepresentatives: ['Minister'],
        eventPlanners: ['Planner'],
        venueCity: 'Burnaby',
      },
    });
    expect(await service.getById(2, false, true)).toMatchObject({
      lookAhead: { executiveSummary: null },
    });
  });

  it('passes notes access from the authenticated user to the details service', async () => {
    const service = { getById: vi.fn().mockResolvedValue({ id: 1 }) };
    const controller = new LegacyActivitiesController(
      service as unknown as LegacyActivitiesService
    );
    const user: AuthUser = {
      id: 1,
      username: 'viewer',
      displayName: 'Viewer',
      email: 'viewer@example.com',
      roleId: 1,
      roleName: 'User',
      permissions: [PERMISSIONS.ACTIVITIES.VIEW],
      teamIds: [],
    };

    await controller.getById(1, user);
    expect(service.getById).toHaveBeenLastCalledWith(1, false, false);
    await controller.getById(1, {
      ...user,
      permissions: [...user.permissions, PERMISSIONS.ACTIVITIES.NOTES_VIEW],
    });
    expect(service.getById).toHaveBeenLastCalledWith(1, true, false);
    await controller.getById(1, {
      ...user,
      permissions: [
        ...user.permissions,
        PERMISSIONS.ACTIVITIES.LOOK_AHEAD_VIEW,
      ],
    });
    expect(service.getById).toHaveBeenLastCalledWith(1, false, true);
    await controller.getById(1, { ...user, roleName: SYSTEM_ROLES.ADMIN });
    expect(service.getById).toHaveBeenLastCalledWith(1, true, true);
    await controller.getById(1, undefined);
    expect(service.getById).toHaveBeenLastCalledWith(1, false, false);
  });
});
