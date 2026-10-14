/**
 * Lead team label for selects/filters — matches Activity Overview Lead Team combobox.
 */
export function formatLeadTeamSelectLabel(team: {
  name: string;
  displayName?: string | null;
  ministryName?: string | null;
}): string {
  const base = team.displayName || team.name;
  return team.ministryName ? `${base} (${team.ministryName})` : base;
}
