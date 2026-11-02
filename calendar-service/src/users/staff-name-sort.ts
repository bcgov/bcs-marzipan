import { formatGovBcDisplayNameAsFirstLast } from '@corpcal/shared';

type StaffNameId = number | string | null | undefined;

function normalizeStaffName(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ');
}

function normalizeStaffDisplayName(value: string | null | undefined): string {
  return normalizeStaffName(value).replace(/\s+\(you\)$/i, '');
}

export function getFirstNameSortLabel(
  value: string | null | undefined
): string {
  const normalized = normalizeStaffDisplayName(value);
  if (!normalized) {
    return '';
  }

  const firstLastLabel = formatGovBcDisplayNameAsFirstLast(normalized);
  return firstLastLabel || normalized;
}

export function compareStaffNames(
  aName: string | null | undefined,
  bName: string | null | undefined,
  aId?: StaffNameId,
  bId?: StaffNameId
): number {
  const aFirstNameSortLabel = getFirstNameSortLabel(aName);
  const bFirstNameSortLabel = getFirstNameSortLabel(bName);
  const byFirstName = aFirstNameSortLabel.localeCompare(
    bFirstNameSortLabel,
    undefined,
    { sensitivity: 'base' }
  );
  if (byFirstName !== 0) return byFirstName;

  const byDisplayName = normalizeStaffDisplayName(aName).localeCompare(
    normalizeStaffDisplayName(bName),
    undefined,
    { sensitivity: 'base' }
  );
  if (byDisplayName !== 0) return byDisplayName;

  return String(aId ?? '').localeCompare(String(bId ?? ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

export function sortByStaffName<T>(
  values: readonly T[],
  getName: (value: T) => string | null | undefined,
  getId?: (value: T) => StaffNameId
): T[] {
  return [...values].sort((a, b) =>
    compareStaffNames(getName(a), getName(b), getId?.(a), getId?.(b))
  );
}
