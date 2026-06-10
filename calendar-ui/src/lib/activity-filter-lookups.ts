import type { ValidFilterLookups } from '@/lib/savedFilterSanitize';
import type { OptionItem } from '@/schemas/types';

export function buildValidFilterLookupsFromOptions(options: {
  statusOptions: OptionItem[];
  tagOptions: OptionItem[];
  ministryOptions: OptionItem[];
  organizationOptions: OptionItem[];
  commsContactOptions: OptionItem[];
  eventPlannerOptions: OptionItem[];
  translationStatusOptions: OptionItem[];
  translationOptions: OptionItem[];
}): ValidFilterLookups {
  const nums = (opts: OptionItem[]) =>
    new Set(
      opts.map((o) => parseInt(o.value, 10)).filter((n) => Number.isFinite(n))
    );
  return {
    statusIds: nums(options.statusOptions),
    tagIds: nums(options.tagOptions),
    ministryIds: nums(options.ministryOptions),
    orgIds: nums(options.organizationOptions),
    commsContactUserIds: nums(options.commsContactOptions),
    eventPlannerIds: nums(options.eventPlannerOptions),
    translationStatusIds: nums(options.translationStatusOptions),
    translationLanguageIds: nums(options.translationOptions),
  };
}
