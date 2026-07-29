import { z } from 'zod';

import {
  ACTIVITY_INFO_ICON_FIELD_KEYS,
  ACTIVITY_INFO_ICON_TEXT_MAX_LENGTH,
  type ActivityInfoIconFieldKey,
  type ActivityInfoIconSettings,
} from '../activity-info-icon-settings';
import { plainTextFromActivityRichField } from '../utils';

export type {
  ActivityInfoIconFieldKey,
  ActivityInfoIconSetting,
  ActivityInfoIconSettings,
} from '../activity-info-icon-settings';

const FIELD_KEY_ENUM = ACTIVITY_INFO_ICON_FIELD_KEYS as unknown as [
  ActivityInfoIconFieldKey,
  ...ActivityInfoIconFieldKey[],
];

const activityInfoIconSettingSchema = z
  .object({
    fieldKey: z.enum(FIELD_KEY_ENUM),
    text: z.string().refine((value) => {
      const plain = plainTextFromActivityRichField(value).trim();
      return (
        plain.length > 0 && plain.length <= ACTIVITY_INFO_ICON_TEXT_MAX_LENGTH
      );
    }),
  })
  .strict();

export const activityInfoIconSettingsSchema: z.ZodType<ActivityInfoIconSettings> =
  z
    .object({
      items: z.array(activityInfoIconSettingSchema).transform((items) => {
        const seen = new Set<string>();
        const deduped: ActivityInfoIconSettings['items'] = [];
        for (const item of items) {
          if (seen.has(item.fieldKey)) continue;
          seen.add(item.fieldKey);
          deduped.push(item);
        }
        return deduped;
      }),
    })
    .strict();
