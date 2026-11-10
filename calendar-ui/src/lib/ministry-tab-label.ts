/** "CITZ" for one ministry, "CITZ + 2" when more are selected. */
export function formatMinistrySelectionLabel(
  selectedLabels: string[],
  fallback = 'Ministry'
): string {
  if (selectedLabels.length === 0) return fallback;
  const [first, ...rest] = selectedLabels;
  return rest.length > 0 ? `${first} + ${rest.length}` : first;
}
