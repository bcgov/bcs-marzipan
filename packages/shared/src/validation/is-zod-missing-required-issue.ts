import {
  getZodIssueKind,
  ZOD_ISSUE_KIND,
  type ZodIssueKind,
} from './zod-issue-kind';

export type ZodIssueLike = {
  path: ReadonlyArray<PropertyKey>;
  code?: string;
  message?: unknown;
  params?: unknown;
};

/**
 * True when a Zod issue represents an empty/missing required value.
 *
 * Classification order:
 * 1. `params.kind` from shared schema refines (`required` vs `constraint`)
 * 2. Built-in Zod codes: `too_small` and `invalid_type` (e.g. `.min(1)`, required types)
 * 3. Excludes length violations (`too_big`, `too_long`) and untagged `custom` issues
 */
export function isZodMissingRequiredIssue(issue: ZodIssueLike): boolean {
  const kind: ZodIssueKind | undefined = getZodIssueKind(issue);
  if (kind === ZOD_ISSUE_KIND.CONSTRAINT) return false;
  if (kind === ZOD_ISSUE_KIND.REQUIRED) return true;

  const code = issue.code;
  if (code === 'too_big' || code === 'too_long') return false;
  if (code === 'too_small' || code === 'invalid_type') return true;

  return false;
}
