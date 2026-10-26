export interface ParsedGovBcDisplayName {
  surname: string;
  /** Given names joined for display (excludes ministry tags). */
  givenNames: string;
  /** Whitespace-separated given-name tokens after ministry tags are removed. */
  givenNameTokens: readonly string[];
}

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/** Azure AD appends org tags such as `CITZ:EX`; they are not part of the name. */
export function tokenizeGovBcDisplayNameParts(value: string): string[] {
  return value.split(/\s+/).filter((part) => part && !part.includes(':'));
}

/**
 * Parses BC Government Azure AD display names (`Last, First MINISTRY:TYPE` or
 * `First Last MINISTRY:TYPE`) into surname and given-name components.
 */
export function parseGovBcDisplayName(
  value: string | null | undefined
): ParsedGovBcDisplayName | null {
  const normalized = normalizeWhitespace(value ?? '');
  if (!normalized) {
    return null;
  }

  const commaIndex = normalized.indexOf(',');
  let surname: string;
  let givenNameTokens: string[];

  if (commaIndex > 0) {
    surname = normalized.slice(0, commaIndex).trim();
    givenNameTokens = tokenizeGovBcDisplayNameParts(
      normalized.slice(commaIndex + 1)
    );
  } else {
    const parts = tokenizeGovBcDisplayNameParts(normalized);
    if (parts.length === 0) {
      return null;
    }
    if (parts.length === 1) {
      return {
        surname: '',
        givenNames: parts[0] ?? '',
        givenNameTokens: parts,
      };
    }
    surname = parts[parts.length - 1] ?? '';
    givenNameTokens = parts.slice(0, -1);
  }

  const givenNames = givenNameTokens.join(' ').trim();
  if (!surname && !givenNames) {
    return null;
  }

  return { surname, givenNames, givenNameTokens };
}

/** `First Last` label for UI and sorting; falls back to tag-stripped input. */
export function formatGovBcDisplayNameAsFirstLast(
  value: string | null | undefined
): string {
  const normalized = normalizeWhitespace(value ?? '');
  if (!normalized) {
    return '';
  }

  const parsed = parseGovBcDisplayName(normalized);
  if (parsed?.surname && parsed.givenNames) {
    return `${parsed.givenNames} ${parsed.surname}`;
  }
  if (parsed?.givenNames && !parsed.surname) {
    return parsed.givenNames;
  }

  const withoutTags = tokenizeGovBcDisplayNameParts(normalized).join(' ');
  return withoutTags || normalized;
}

/** Splits a display name into editable first / last fields. */
export function getGovBcStaffNameFields(value: string | null | undefined): {
  firstName: string;
  lastName: string;
} {
  const display = normalizeWhitespace(value ?? '');
  if (!display) {
    return { firstName: '', lastName: '' };
  }

  const parsed = parseGovBcDisplayName(display);
  if (parsed) {
    return {
      firstName: parsed.givenNames,
      lastName: parsed.surname,
    };
  }

  const parts = display.split(/\s+/).filter(Boolean);
  return {
    firstName: parts.slice(0, -1).join(' ') || parts[0] || '',
    lastName: parts.length > 1 ? (parts[parts.length - 1] ?? '') : '',
  };
}
