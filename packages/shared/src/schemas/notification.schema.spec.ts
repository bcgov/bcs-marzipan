import { describe, expect, it } from 'vitest';

import { notificationListQuerySchema } from './notification.schema';

describe('notificationListQuerySchema', () => {
  it('parses includeRead=false string as false', () => {
    const parsed = notificationListQuerySchema.parse({ includeRead: 'false' });

    expect(parsed.includeRead).toBe(false);
  });

  it('parses includeRead=true string as true', () => {
    const parsed = notificationListQuerySchema.parse({ includeRead: 'true' });

    expect(parsed.includeRead).toBe(true);
  });

  it('defaults pagination values when omitted', () => {
    const parsed = notificationListQuerySchema.parse({});

    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(20);
    expect(parsed.includeRead).toBe(false);
  });
});
