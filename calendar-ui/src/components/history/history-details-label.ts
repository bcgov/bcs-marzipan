export function historyDetailsAriaLabel(
  changeCount: number,
  hasNote: boolean
): string {
  const parts: string[] = [];
  if (changeCount > 0) {
    parts.push(`${changeCount} change${changeCount === 1 ? '' : 's'}`);
  }
  if (hasNote) {
    parts.push('Note');
  }
  return parts.join(', ');
}

export function historyDetailsHasDisclosure(
  changeCount: number,
  hasNote: boolean
): boolean {
  return changeCount > 0 || hasNote;
}
