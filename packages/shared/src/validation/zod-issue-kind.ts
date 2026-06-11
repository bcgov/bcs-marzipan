/**
 * Stable discriminators for Zod custom issues.
 *
 * Activity form submit-gating (`isZodMissingRequiredIssue` in calendar-ui) keys off
 * `params.kind` instead of validation message text. See REQUIRED_FIELDS.md when adding
 * required create/edit fields.
 */
export const ZOD_ISSUE_KIND = {
  /** Empty or absent value for a required field (counts toward "N more required fields"). */
  REQUIRED: 'required',
  /**
   * Value is present but fails a structural/business rule (e.g. exactly one lead planner).
   * Does not count toward the missing-required-fields hint.
   */
  CONSTRAINT: 'constraint',
} as const;

export type ZodIssueKind = (typeof ZOD_ISSUE_KIND)[keyof typeof ZOD_ISSUE_KIND];

export type ZodIssueParams = {
  kind?: ZodIssueKind;
};

/** Reads `params.kind` from a Zod issue when present. */
export function getZodIssueKind(issue: {
  params?: unknown;
}): ZodIssueKind | undefined {
  const params = issue.params;
  if (!params || typeof params !== 'object') return undefined;
  const kind = (params as ZodIssueParams).kind;
  if (kind === ZOD_ISSUE_KIND.REQUIRED || kind === ZOD_ISSUE_KIND.CONSTRAINT) {
    return kind;
  }
  return undefined;
}

/** Refine options fragment: tags the issue as empty/missing required. */
export function zodRequiredIssueParams(): { params: ZodIssueParams } {
  return { params: { kind: ZOD_ISSUE_KIND.REQUIRED } };
}

/** Refine options fragment: tags the issue as a structural constraint violation. */
export function zodConstraintIssueParams(): { params: ZodIssueParams } {
  return { params: { kind: ZOD_ISSUE_KIND.CONSTRAINT } };
}
