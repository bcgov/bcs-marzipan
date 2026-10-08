import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './user';

const DEFAULT_RECURRING_LOCKOUT_LEAD_CONTENT =
  'Updates to activities will be locked <lockStartTime> - <lockEndTime> PT. Please make updates before lockout begins.';

const DEFAULT_RECURRING_LOCKOUT_ACTIVE_CONTENT =
  'Updates to activities are locked out until <lockEndTime> PT. Contact <report_look_ahead_cover_contact_email> to make emerging or urgent updates.';

export const recurringLockoutBannerSettings = pgTable(
  'recurring_lockout_banner_settings',
  {
    id: serial('id').primaryKey(),
    isActive: boolean('is_active').notNull().default(false),
    leadContent: text('lead_content')
      .notNull()
      .default(DEFAULT_RECURRING_LOCKOUT_LEAD_CONTENT),
    activeContent: text('active_content')
      .notNull()
      .default(DEFAULT_RECURRING_LOCKOUT_ACTIVE_CONTENT),
    backgroundColor: varchar('background_color', { length: 20 })
      .notNull()
      .default('#E6A635'),
    textColor: varchar('text_color', { length: 20 })
      .notNull()
      .default('#000000'),
    variant: varchar('variant', { length: 20 }).notNull().default('warning'),
    startTimeOfDay: varchar('start_time_of_day', { length: 5 })
      .notNull()
      .default('15:00'),
    endTimeOfDay: varchar('end_time_of_day', { length: 5 })
      .notNull()
      .default('23:59'),
    bannerLeadMinutes: integer('banner_lead_minutes').notNull().default(30),
    editCountdownLeadMinutes: integer('edit_countdown_lead_minutes')
      .notNull()
      .default(3),
    createdDateTime: timestamp('created_date_time', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: integer('created_by')
      .notNull()
      .references(() => users.id),
    lastUpdatedDateTime: timestamp('last_updated_date_time', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    lastUpdatedBy: integer('last_updated_by')
      .notNull()
      .references(() => users.id),
  }
);
