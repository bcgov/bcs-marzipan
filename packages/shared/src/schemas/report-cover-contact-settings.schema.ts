import { z } from 'zod';

import {
  REPORT_COVER_CONTACT_EMAIL_MAX_LEN,
  REPORT_COVER_CONTACT_PHONE_MAX_LEN,
} from '../report-cover-contact';

export type ReportCoverContactSettings = {
  contactPhone: string;
  contactEmail: string;
};

/** Display-only; allow any reasonable characters — no phone format validation. */
const trimmedPhone = z
  .string()
  .max(REPORT_COVER_CONTACT_PHONE_MAX_LEN)
  .transform((s) => s.trim());

/** Display-only; allow any reasonable characters — no email format validation. */
const trimmedContactEmail = z
  .string()
  .max(REPORT_COVER_CONTACT_EMAIL_MAX_LEN)
  .transform((s) => s.trim());

export const reportCoverContactSettingsSchema: z.ZodType<ReportCoverContactSettings> =
  z.object({
    contactPhone: trimmedPhone,
    contactEmail: trimmedContactEmail,
  });
