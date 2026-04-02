import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { firstValueFrom, of } from 'rxjs';

import { SYSTEM_ROLES, type AuthUser } from '@corpcal/shared';
import { createMockActivityResponse } from '@corpcal/shared/test-utils';

import { ActivityResponseRedactionInterceptor } from './activity-response-redaction.interceptor';

describe('ActivityResponseRedactionInterceptor', () => {
  let interceptor: ActivityResponseRedactionInterceptor;

  const viewerNoGrants: AuthUser = {
    id: 1,
    username: 'viewer',
    displayName: 'Viewer',
    email: 'v@example.com',
    roleId: 3,
    roleName: SYSTEM_ROLES.VIEWER,
    permissions: ['activities.view'],
    teamIds: [],
  };

  const editorWithNotesLookAheadPitch: AuthUser = {
    id: 2,
    username: 'editor',
    displayName: 'Editor',
    email: 'e@example.com',
    roleId: 2,
    roleName: SYSTEM_ROLES.EDITOR,
    permissions: [
      'activities.view',
      'activities.notes.view',
      'activities.lookAhead.view',
      'activities.pitchStatus.view',
    ],
    teamIds: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActivityResponseRedactionInterceptor],
    }).compile();

    interceptor = module.get<ActivityResponseRedactionInterceptor>(
      ActivityResponseRedactionInterceptor
    );
  });

  const createContext = (user?: AuthUser): ExecutionContext => {
    const request: Record<string, unknown> = { user };
    return {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue(request),
      }),
    } as unknown as ExecutionContext;
  };

  const createHandler = (body: unknown): CallHandler => ({
    handle: vi.fn().mockReturnValue(of(body)),
  });

  it('redacts a single ActivityResponse when user lacks view grants', async () => {
    const activity = createMockActivityResponse({
      notes: 'secret',
      lookAheadStatus: 'new',
      lookAheadSection: 'events',
    });
    const ctx = createContext(viewerNoGrants);
    const handler = createHandler({ success: true, data: activity });

    const out = (await firstValueFrom(interceptor.intercept(ctx, handler))) as {
      data: { notes?: string; lookAheadStatus?: string };
    };

    expect(out.data.notes).toBeUndefined();
    expect(out.data.lookAheadStatus).toBeUndefined();
  });

  it('does not strip fields when user has view grants', async () => {
    const activity = createMockActivityResponse({ notes: 'keep' });
    const ctx = createContext(editorWithNotesLookAheadPitch);
    const handler = createHandler({ success: true, data: activity });

    const out = (await firstValueFrom(interceptor.intercept(ctx, handler))) as {
      data: { notes: string };
    };

    expect(out.data.notes).toBe('keep');
  });

  it('redacts each element in an ActivityResponse array', async () => {
    const a = createMockActivityResponse({ id: 1, notes: 'a' });
    const b = createMockActivityResponse({ id: 2, notes: 'b' });
    const ctx = createContext(viewerNoGrants);
    const handler = createHandler({ success: true, data: [a, b] });

    const out = (await firstValueFrom(interceptor.intercept(ctx, handler))) as {
      data: { notes?: string }[];
    };

    const data = out.data;
    expect(data[0].notes).toBeUndefined();
    expect(data[1].notes).toBeUndefined();
  });

  it('passes through category list payloads', async () => {
    const payload = {
      success: true,
      data: [{ id: 1, name: 'event', displayName: 'Event' }],
    };
    const ctx = createContext(viewerNoGrants);
    const handler = createHandler(payload);

    const out = await firstValueFrom(interceptor.intercept(ctx, handler));
    expect(out).toEqual(payload);
  });

  it('passes through activity history entries', async () => {
    const payload = {
      success: true,
      data: [
        {
          id: 1,
          activityId: 2,
          userId: 3,
          actionType: 'updated',
          changes: [],
          notes: null,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
      ],
    };
    const ctx = createContext(viewerNoGrants);
    const handler = createHandler(payload);

    const out = await firstValueFrom(interceptor.intercept(ctx, handler));
    expect(out).toEqual(payload);
  });

  it('passes through { message } bodies', async () => {
    const payload = { message: 'deleted' };
    const ctx = createContext(viewerNoGrants);
    const handler = createHandler(payload);

    const out = await firstValueFrom(interceptor.intercept(ctx, handler));
    expect(out).toEqual(payload);
  });

  it('passes through when no user is present', async () => {
    const activity = createMockActivityResponse({ notes: 'secret' });
    const ctx = createContext(undefined);
    const handler = createHandler({ success: true, data: activity });

    const out = (await firstValueFrom(interceptor.intercept(ctx, handler))) as {
      data: { notes: string };
    };
    expect(out.data.notes).toBe('secret');
  });

  it('does not treat empty data array as activity list', async () => {
    const payload = { success: true, data: [] };
    const ctx = createContext(viewerNoGrants);
    const handler = createHandler(payload);

    const out = await firstValueFrom(interceptor.intercept(ctx, handler));
    expect(out).toEqual(payload);
  });
});
