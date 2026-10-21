/**
 * Two-letter avatar initials: first given name + surname.
 * Handles Azure AD style names ("Carmichael, Alexander CITZ:EX" -> "AC") by
 * reading "Last, First" order and dropping the trailing "MINISTRY:TYPE" tag.
 * Plain "First Last" names are also supported. Falls back to `fallback`
 * when the name has no usable characters.
 */
export function getInitials(
  name: string | null | undefined,
  fallback = 'U'
): string {
  const normalized = (name ?? '').trim();
  const commaIndex = normalized.indexOf(',');

  let surname: string;
  let givenParts: string[];
  if (commaIndex > 0) {
    surname = normalized.slice(0, commaIndex).trim();
    givenParts = tokenize(normalized.slice(commaIndex + 1));
  } else {
    const parts = tokenize(normalized);
    surname = parts.length > 1 ? (parts[parts.length - 1] ?? '') : '';
    givenParts = parts.length > 1 ? parts.slice(0, -1) : parts;
  }

  const initials = (givenParts[0]?.charAt(0) ?? '') + surname.charAt(0);
  return initials ? initials.toUpperCase() : fallback;
}

// Azure appends an org tag such as "CITZ:EX"; it is not part of the name.
function tokenize(value: string): string[] {
  return value.split(/\s+/).filter((part) => part && !part.includes(':'));
}
