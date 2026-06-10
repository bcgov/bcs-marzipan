/** Status labels treated as "confirmed" for date/time confirmed filters (case-insensitive). */
export const CONFIRMED_STATUS_NAMES = ['confirmed'] as const;

const CONFIRMED_STATUS_NAME_SET = new Set<string>(CONFIRMED_STATUS_NAMES);

export function isConfirmedStatusLabel(
  status: string | null | undefined
): boolean {
  return CONFIRMED_STATUS_NAME_SET.has((status ?? '').trim().toLowerCase());
}
