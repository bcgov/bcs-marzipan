function historyChangeLabel(changeCount: number): string {
  return `${changeCount} change${changeCount === 1 ? '' : 's'}`;
}

function historyHideChangeLabel(changeCount: number): string {
  return `Hide change${changeCount === 1 ? '' : 's'}`;
}

export function historyDetailsBadgeLabel(
  changeCount: number,
  hasNote: boolean
): string {
  return historyDetailsBadgeLabels(changeCount, hasNote).join(' and ');
}

export function historyDetailsBadgeLabels(
  changeCount: number,
  hasNote: boolean
): string[] {
  const labels: string[] = [];
  if (hasNote) labels.push('Note');
  if (changeCount > 0) labels.push(historyChangeLabel(changeCount));
  return labels;
}

export function historyDetailsShowLabel(
  changeCount: number,
  hasNote: boolean
): string {
  const hasChanges = changeCount > 0;

  if (hasNote && hasChanges) {
    return `Show note and ${historyChangeLabel(changeCount)}`;
  }
  if (hasNote) return 'Show note';
  if (hasChanges) return `Show ${historyChangeLabel(changeCount)}`;
  return '';
}

export function historyDetailsHideLabel(
  changeCount: number,
  hasNote: boolean
): string {
  const hasChanges = changeCount > 0;

  if (hasNote && hasChanges) {
    return `Hide note and ${historyChangeLabel(changeCount)}`;
  }
  if (hasNote) return 'Hide note';
  if (hasChanges) return historyHideChangeLabel(changeCount);
  return '';
}

/** @deprecated Use historyDetailsBadgeLabel for visible/aria labels. */
export function historyDetailsAriaLabel(
  changeCount: number,
  hasNote: boolean
): string {
  return historyDetailsBadgeLabel(changeCount, hasNote);
}

export function historyDetailsHasDisclosure(
  changeCount: number,
  hasNote: boolean
): boolean {
  return changeCount > 0 || hasNote;
}
