import type { LeadTeamFilterOption } from '@/components/activity/ActivityTable/LeadTeamFilterPanel';
import type { ValidFilterLookups } from '@/lib/savedFilterSanitize';
import type { OptionItem } from '@/schemas/types';

export function buildTeamIdsByMinistryIdMap(
  teams: LeadTeamFilterOption[]
): Map<number, number[]> {
  const map = new Map<number, number[]>();
  for (const team of teams) {
    if (team.ministryId == null) continue;
    const id = parseInt(team.value, 10);
    if (!Number.isFinite(id)) continue;
    const list = map.get(team.ministryId) ?? [];
    list.push(id);
    map.set(team.ministryId, list);
  }
  return map;
}

export function buildValidFilterLookupsFromOptions(options: {
  statusOptions: OptionItem[];
  categoryOptions?: OptionItem[];
  tagOptions: OptionItem[];
  commsContactOptions: OptionItem[];
  eventPlannerOptions: OptionItem[];
  leadTeamOptions: LeadTeamFilterOption[];
  translationStatusOptions: OptionItem[];
  translationOptions: OptionItem[];
}): ValidFilterLookups {
  const nums = (opts: OptionItem[]) =>
    new Set(
      opts.map((o) => parseInt(o.value, 10)).filter((n) => Number.isFinite(n))
    );
  return {
    statusIds: nums(options.statusOptions),
    categoryIds: options.categoryOptions
      ? nums(options.categoryOptions)
      : undefined,
    tagIds: nums(options.tagOptions),
    commsContactUserIds: nums(options.commsContactOptions),
    eventPlannerIds: nums(options.eventPlannerOptions),
    teamIds: nums(options.leadTeamOptions),
    teamIdsByMinistryId: buildTeamIdsByMinistryIdMap(options.leadTeamOptions),
    translationStatusIds: nums(options.translationStatusOptions),
    translationLanguageIds: nums(options.translationOptions),
  };
}
