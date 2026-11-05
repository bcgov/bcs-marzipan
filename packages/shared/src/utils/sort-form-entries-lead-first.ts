/**
 * Puts the entry with `isLead: true` first; preserves relative order of other rows.
 */
export function sortFormEntriesLeadFirst<T extends { isLead?: boolean }>(
  entries: readonly T[]
): T[] {
  if (entries.length <= 1) return [...entries];
  const leadIndex = entries.findIndex((e) => e.isLead === true);
  if (leadIndex <= 0) return [...entries];
  const rest = [...entries];
  const [lead] = rest.splice(leadIndex, 1);
  return [lead, ...rest];
}
