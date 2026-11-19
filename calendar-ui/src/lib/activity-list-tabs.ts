export type ActivityListTabValue =
  | 'all'
  | 'ministry'
  | 'my-activities'
  | 'shared-with-me'
  | 'favourites'
  | 'assigned-to-me';

export const ACTIVITY_LIST_TAB_STORAGE_KEY = 'activityListTab';

export const ACTIVITY_LIST_TAB_VALUES: readonly ActivityListTabValue[] = [
  'all',
  'ministry',
  'my-activities',
  'shared-with-me',
  'favourites',
  'assigned-to-me',
];

export function getStoredActivityListTab(): ActivityListTabValue | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(ACTIVITY_LIST_TAB_STORAGE_KEY);
    if (!raw) return null;
    if (raw === 'recent') {
      sessionStorage.removeItem(ACTIVITY_LIST_TAB_STORAGE_KEY);
      return null;
    }
    if (ACTIVITY_LIST_TAB_VALUES.includes(raw as ActivityListTabValue)) {
      return raw as ActivityListTabValue;
    }
    return null;
  } catch {
    return null;
  }
}

export function setStoredActivityListTab(tab: ActivityListTabValue): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(ACTIVITY_LIST_TAB_STORAGE_KEY, tab);
  } catch {
    // ignore
  }
}

export function activityListTabDisplayLabel(
  tab: ActivityListTabValue,
  options?: { ministryTabLabel?: string }
): string {
  switch (tab) {
    case 'all':
      return 'All';
    case 'ministry':
      return options?.ministryTabLabel ?? 'Ministry';
    case 'my-activities':
      return 'My activities';
    case 'shared-with-me':
      return 'Shared with us';
    case 'favourites':
      return 'My watchlist';
    case 'assigned-to-me':
      return 'Assigned to me';
    default:
      return tab;
  }
}
