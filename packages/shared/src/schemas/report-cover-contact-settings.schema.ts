import { z } from 'zod';

import {
  REPORT_COVER_CONTACT_EMAIL_MAX_LEN,
  REPORT_COVER_CONTACT_PHONE_MAX_LEN,
} from '../report-cover-contact';

export type ReportCoverContactSettings = {
  contactPhone: string;
  contactEmail: string;
};

const trimmedPhone = z
  .string()
  .max(REPORT_COVER_CONTACT_PHONE_MAX_LEN)
  .transform((s) => s.trim());

const trimmedEmail = z
  .string()
  .max(REPORT_COVER_CONTACT_EMAIL_MAX_LEN)
  .transform((s) => s.trim())
  .refine((s) => s.length === 0 || z.string().email().safeParse(s).success, {
    message: 'Invalid email address',
  });

export const reportCoverContactSettingsSchema: z.ZodType<ReportCoverContactSettings> =
  z.object({
    contactPhone: trimmedPhone,
    contactEmail: trimmedEmail,
  });
