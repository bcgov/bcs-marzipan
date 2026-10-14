import type { TableSummaryFilterDetailLine } from '@/components/table/TableSummaryBar';

type FilterOption = {
  value: string;
  label: string;
};

function resolveOptionLabels(
  selectedIds: number[],
  options: FilterOption[]
): string[] {
  const labelByValue = new Map(
    options.map((option) => [option.value, option.label])
  );
  return selectedIds.map((id) => labelByValue.get(String(id)) ?? String(id));
}

export function buildUserAppliedFilterTypeLabels({
  keyword = '',
  teamIds = [],
  roleIds = [],
}: {
  keyword?: string;
  teamIds?: number[];
  roleIds?: number[];
}): string[] {
  const labels: string[] = [];
  if (keyword.trim()) {
    labels.push('Search');
  }
  if (teamIds.length > 0) {
    labels.push('Team');
  }
  if (roleIds.length > 0) {
    labels.push('Role');
  }
  return labels;
}

export function buildUserFilterDetailLines({
  keyword = '',
  teamIds = [],
  roleIds = [],
  teamOptions = [],
  roleOptions = [],
}: {
  keyword?: string;
  teamIds?: number[];
  roleIds?: number[];
  teamOptions?: FilterOption[];
  roleOptions?: FilterOption[];
}): TableSummaryFilterDetailLine[] {
  const lines: TableSummaryFilterDetailLine[] = [];
  const trimmedKeyword = keyword.trim();

  if (trimmedKeyword) {
    lines.push({ label: 'Search', value: trimmedKeyword });
  }
  if (teamIds.length > 0) {
    lines.push({
      label: 'Team',
      value: resolveOptionLabels(teamIds, teamOptions).join(', '),
    });
  }
  if (roleIds.length > 0) {
    lines.push({
      label: 'Role',
      value: resolveOptionLabels(roleIds, roleOptions).join(', '),
    });
  }

  return lines;
}

export function hasUserClearableFilters({
  keyword = '',
  teamIds = [],
  roleIds = [],
}: {
  keyword?: string;
  teamIds?: number[];
  roleIds?: number[];
}): boolean {
  return (
    buildUserAppliedFilterTypeLabels({ keyword, teamIds, roleIds }).length > 0
  );
}

export function buildTeamAppliedFilterTypeLabels({
  keyword = '',
}: {
  keyword?: string;
}): string[] {
  return keyword.trim() ? ['Search'] : [];
}

export function buildTeamFilterDetailLines({
  keyword = '',
}: {
  keyword?: string;
}): TableSummaryFilterDetailLine[] {
  const trimmedKeyword = keyword.trim();
  return trimmedKeyword ? [{ label: 'Search', value: trimmedKeyword }] : [];
}

export function hasTeamClearableFilters({
  keyword = '',
}: {
  keyword?: string;
}): boolean {
  return keyword.trim().length > 0;
}
