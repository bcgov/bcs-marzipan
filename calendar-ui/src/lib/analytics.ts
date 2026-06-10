// src/lib/analytics.ts
type CalendarActionFilters = {
  from_date?: string | null;
  to_date?: string | null;
  this_day_only?: boolean | null;
  look_ahead_filter?: string | null;
  [key: string]: any;
};

type CalendarAction = {
  action: string;
  count?: number | null;
  filters?: CalendarActionFilters | null;
};

function hasSnowplow(): boolean {
  return typeof window !== 'undefined' && typeof window.snowplow === 'function';
}

export function trackCalendarClick(action: string) {
  if (!hasSnowplow()) return;
  try {
    window.snowplow?.('trackSelfDescribingEvent', {
      schema: 'iglu:ca.bc.gov.bcs/calendar_click/jsonschema/1-0-0',
      data: { action },
    });
  } catch (e) {
    // swallow errors to avoid breaking the app
    // logging can be added here if desired
  }
}

export function trackCalendarAction(payload: CalendarAction) {
  if (!hasSnowplow()) return;
  const { action, count, filters } = payload;
  const eventData: any = { action };
  if (typeof count === 'number') eventData.count = count;
  if (filters && Object.keys(filters).length > 0) eventData.filters = filters;

  try {
    window.snowplow?.('trackSelfDescribingEvent', {
      schema: 'iglu:ca.bc.gov.bcs/calendar_action/jsonschema/1-0-0',
      data: eventData,
    });
  } catch (e) {
    // swallow
  }
}

export default {
  trackCalendarClick,
  trackCalendarAction,
};
