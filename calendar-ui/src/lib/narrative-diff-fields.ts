const NARRATIVE_DIFF_FIELDS = new Set([
  'title',
  'summary',
  'significance',
  'strategy',
  'executiveSummary',
  'schedulingNotes',
  'notes',
]);

export function isNarrativeDiffField(field: string): boolean {
  return NARRATIVE_DIFF_FIELDS.has(field);
}
