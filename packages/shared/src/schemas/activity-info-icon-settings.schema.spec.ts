import { describe, expect, it } from 'vitest';

import { ACTIVITY_INFO_ICON_TEXT_MAX_LENGTH } from '../activity-info-icon-settings';
import { tipTapDocJsonFromPlainText } from '../utils';
import { activityInfoIconSettingsSchema } from './activity-info-icon-settings.schema';

describe('activityInfoIconSettingsSchema', () => {
  it('accepts legacy markdown-like text values', () => {
    const result = activityInfoIconSettingsSchema.safeParse({
      items: [
        {
          fieldKey: 'visibility',
          text: '**Visible** to all teams',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('accepts rich text JSON values when plain text is within max length', () => {
    const result = activityInfoIconSettingsSchema.safeParse({
      items: [
        {
          fieldKey: 'categoryIds',
          text: tipTapDocJsonFromPlainText('Event category guidance'),
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rejects values when plain text exceeds max length', () => {
    const result = activityInfoIconSettingsSchema.safeParse({
      items: [
        {
          fieldKey: 'categoryIds',
          text: tipTapDocJsonFromPlainText(
            'x'.repeat(ACTIVITY_INFO_ICON_TEXT_MAX_LENGTH + 1)
          ),
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});
