import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const intervals: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.34524, 'week'],
    [12, 'month'],
    [Number.POSITIVE_INFINITY, 'year'],
  ];

  let counter = seconds;
  for (let i = 0; i < intervals.length; i++) {
    const [limit, name] = intervals[i];
    if (counter < limit) {
      const value = Math.floor(counter) || 0;
      return `${value} ${name}${value !== 1 ? 's' : ''}`;
    }
    counter = Math.floor(counter / limit);
  }
  return '0 seconds';
}

export function formatLongDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function timeAgoShort(dateStr: string): string {
  const d = new Date(dateStr);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return d.toLocaleDateString();
}

type StatusLookupItem = { name?: string; label?: string; id?: string | number };

export const CONFIRMED_STATUS_NAMES = ['confirmed'];
export const UNCONFIRMED_STATUS_NAMES = [
  'unknown',
  'not confirmed',
  'not_confirmed',
  'unconfirmed',
];

export const CONFIRMED_STATUS_LABEL = 'Confirmed';
export const UNCONFIRMED_STATUS_LABEL = 'Not confirmed';

export function normalizeStatusName(status: StatusLookupItem): string {
  return (status?.name ?? status?.label ?? '').toString().trim().toLowerCase();
}

export function findStatusByName(
  statuses: StatusLookupItem[] | undefined,
  names: string[]
): StatusLookupItem | undefined {
  return statuses?.find((s) => names.includes(normalizeStatusName(s)));
}
