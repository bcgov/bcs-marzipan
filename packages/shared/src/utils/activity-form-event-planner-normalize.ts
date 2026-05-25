import type { ActivityFormData } from '../schemas/activity.schema';

export type EventPlannerFormEntry = NonNullable<
  ActivityFormData['eventPlanners']
>[number];

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * One event planner row in the shape custom controls persist: id XOR name, explicit isLead.
 * Strips redundant keys (e.g. eventPlannerName when eventPlannerId is set) so hydrate,
 * review diff, and FreeformCombobox round-trips compare equal.
 */
export function normalizeEventPlannerFormEntry(
  entry: Record<string, unknown>
): EventPlannerFormEntry | null {
  const isLead = entry.isLead === true;
  const id =
    typeof entry.eventPlannerId === 'number' && entry.eventPlannerId > 0
      ? entry.eventPlannerId
      : undefined;

  if (id != null) {
    return { eventPlannerId: id, isLead };
  }

  const name =
    typeof entry.eventPlannerName === 'string'
      ? entry.eventPlannerName.trim()
      : '';
  if (name.length > 0) {
    return { eventPlannerName: name, isLead };
  }

  return null;
}

export function normalizeEventPlannerFormEntries(
  entries: unknown
): EventPlannerFormEntry[] {
  if (!Array.isArray(entries) || entries.length === 0) return [];
  const out: EventPlannerFormEntry[] = [];
  for (const item of entries) {
    if (!isPlainRecord(item)) continue;
    const normalized = normalizeEventPlannerFormEntry(item);
    if (normalized) out.push(normalized);
  }
  return out;
}
