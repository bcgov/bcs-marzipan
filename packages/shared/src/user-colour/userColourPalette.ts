import { z } from 'zod';

/**
 * Twelve identity hues (Tailwind 600 flag / 50 avatar bg / 700 avatar fg / 400 picker).
 * Stored as `user_colour_key`.
 */
export const USER_COLOUR_KEYS = [
  'red',
  'orange',
  'yellow',
  'lime',
  'green',
  'teal',
  'cyan',
  'blue',
  'indigo',
  'purple',
  'fuchsia',
  'pink',
] as const;

export type UserColourKey = (typeof USER_COLOUR_KEYS)[number];

export const userColourKeySchema = z.enum(USER_COLOUR_KEYS);

export type UserColourPresentation = {
  label: string;
  flagHex: `#${string}`;
  avatarBgHex: `#${string}`;
  avatarFgHex: `#${string}`;
  /** Picker UI only (Tailwind 400). */
  pickerSwatchHex: `#${string}`;
};

export const USER_COLOUR_PALETTE: Record<
  UserColourKey,
  UserColourPresentation
> = {
  red: {
    label: 'Red',
    flagHex: '#dc2626',
    avatarBgHex: '#fef2f2',
    avatarFgHex: '#b91c1c',
    pickerSwatchHex: '#f87171',
  },
  orange: {
    label: 'Orange',
    flagHex: '#ea580c',
    avatarBgHex: '#fff7ed',
    avatarFgHex: '#c2410c',
    pickerSwatchHex: '#fb923c',
  },
  yellow: {
    label: 'Yellow',
    flagHex: '#ca8a04',
    avatarBgHex: '#fefce8',
    avatarFgHex: '#a16207',
    pickerSwatchHex: '#facc15',
  },
  lime: {
    label: 'Lime',
    flagHex: '#65a30d',
    avatarBgHex: '#f7fee7',
    avatarFgHex: '#4d7c0f',
    pickerSwatchHex: '#a3e635',
  },
  green: {
    label: 'Green',
    flagHex: '#16a34a',
    avatarBgHex: '#f0fdf4',
    avatarFgHex: '#15803d',
    pickerSwatchHex: '#4ade80',
  },
  teal: {
    label: 'Teal',
    flagHex: '#0d9488',
    avatarBgHex: '#f0fdfa',
    avatarFgHex: '#0f766e',
    pickerSwatchHex: '#2dd4bf',
  },
  cyan: {
    label: 'Cyan',
    flagHex: '#0891b2',
    avatarBgHex: '#ecfeff',
    avatarFgHex: '#0e7490',
    pickerSwatchHex: '#22d3ee',
  },
  blue: {
    label: 'Blue',
    flagHex: '#2563eb',
    avatarBgHex: '#eff6ff',
    avatarFgHex: '#1d4ed8',
    pickerSwatchHex: '#60a5fa',
  },
  indigo: {
    label: 'Indigo',
    flagHex: '#4f46e5',
    avatarBgHex: '#eef2ff',
    avatarFgHex: '#4338ca',
    pickerSwatchHex: '#818cf8',
  },
  purple: {
    label: 'Purple',
    flagHex: '#9333ea',
    avatarBgHex: '#faf5ff',
    avatarFgHex: '#7e22ce',
    pickerSwatchHex: '#c084fc',
  },
  fuchsia: {
    label: 'Fuchsia',
    flagHex: '#c026d3',
    avatarBgHex: '#fdf4ff',
    avatarFgHex: '#a21caf',
    pickerSwatchHex: '#e879f9',
  },
  pink: {
    label: 'Pink',
    flagHex: '#db2777',
    avatarBgHex: '#fdf2f8',
    avatarFgHex: '#be185d',
    pickerSwatchHex: '#f472b6',
  },
};

export function defaultUserColourKeyForUserId(userId: number): UserColourKey {
  const index =
    ((userId % USER_COLOUR_KEYS.length) + USER_COLOUR_KEYS.length) %
    USER_COLOUR_KEYS.length;
  return USER_COLOUR_KEYS[index];
}

export function isUserColourKey(value: string): value is UserColourKey {
  return (USER_COLOUR_KEYS as readonly string[]).includes(value);
}

export function coerceUserColourKey(
  dbValue: string | null | undefined,
  userId: number
): UserColourKey {
  if (dbValue != null && isUserColourKey(dbValue)) {
    return dbValue;
  }
  return defaultUserColourKeyForUserId(userId);
}

export function resolveUserColourPresentation(
  key: UserColourKey
): UserColourPresentation {
  return USER_COLOUR_PALETTE[key];
}

export function getUserColourLabel(key: string): string {
  if (isUserColourKey(key)) {
    return USER_COLOUR_PALETTE[key].label;
  }
  return key;
}
