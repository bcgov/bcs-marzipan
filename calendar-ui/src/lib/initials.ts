import { parseGovBcDisplayName } from '@corpcal/shared';

/**
 * Two-letter avatar initials: first given name + surname.
 * Handles Azure AD style names ("Carmichael, Alexander CITZ:EX" -> "AC").
 * Falls back to `fallback` when the name has no usable characters.
 */
export function getInitials(
  name: string | null | undefined,
  fallback = 'U'
): string {
  const parsed = parseGovBcDisplayName(name);
  if (!parsed) {
    return fallback;
  }

  const initials =
    (parsed.givenNameTokens[0]?.charAt(0) ?? '') + parsed.surname.charAt(0);
  return initials ? initials.toUpperCase() : fallback;
}
