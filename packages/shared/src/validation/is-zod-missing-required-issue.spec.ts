import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { createActivityRequestSchema } from '../schemas/activity.schema';
import {
  isZodMissingRequiredIssue,
  type ZodIssueLike,
} from './is-zod-missing-required-issue';
import {
  getZodIssueKind,
  ZOD_ISSUE_KIND,
  zodConstraintIssueParams,
  zodRequiredIssueParams,
} from './zod-issue-kind';

function minimalCreateRequest(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Test Activity',
    summary: 'Summary',
    dateStatusId: 1,
    timeStatusId: 1,
    leadTeamId: 1,
    leadMinistryId: 1,
    categoryIds: [1],
    commsContacts: [{ userId: 1, isLead: true }],
    ...overrides,
  };
}

function missingRequiredPaths(data: Record<string, unknown>): string[] {
  const result = createActivityRequestSchema.safeParse(data);
  if (result.success) return [];
  return result.error.issues
    .filter(isZodMissingRequiredIssue)
    .map((issue) => issue.path[0])
    .filter((path): path is string => typeof path === 'string');
}

function commsContactsIssues(data: Record<string, unknown>) {
  const result = createActivityRequestSchema.safeParse(data);
  if (result.success) return [];
  return result.error.issues.filter(
    (issue) => issue.path[0] === 'commsContacts'
  );
}

describe('isZodMissingRequiredIssue', () => {
  it('classifies built-in too_small and invalid_type as missing-required', () => {
    const schema = z.object({
      title: z.string().min(1),
      leadTeamId: z.number().int(),
    });
    const result = schema.safeParse({ title: '', leadTeamId: undefined });
    expect(result.success).toBe(false);
    if (result.success) return;

    for (const issue of result.error.issues) {
      expect(isZodMissingRequiredIssue(issue)).toBe(true);
    }
  });

  it('excludes too_big length violations', () => {
    const schema = z.object({ title: z.string().max(5) });
    const result = schema.safeParse({ title: 'too long title' });
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(isZodMissingRequiredIssue(result.error.issues[0])).toBe(false);
  });

  it('keys off params.kind for custom refines', () => {
    const schema = z
      .object({ name: z.string() })
      .refine((data) => data.name.length > 0, {
        message: 'Name is required',
        path: ['name'],
        ...zodRequiredIssueParams(),
      })
      .refine((data) => data.name !== 'bad', {
        message: 'Name is invalid',
        path: ['name'],
        ...zodConstraintIssueParams(),
      });

    const empty = schema.safeParse({ name: '' });
    expect(empty.success).toBe(false);
    if (empty.success) return;
    expect(empty.error.issues.some(isZodMissingRequiredIssue)).toBe(true);

    const invalid = schema.safeParse({ name: 'bad' });
    expect(invalid.success).toBe(false);
    if (invalid.success) return;
    expect(
      invalid.error.issues.every((issue) => !isZodMissingRequiredIssue(issue))
    ).toBe(true);
  });
});

describe('createActivityRequestSchema missing-required contract', () => {
  it('includes summary when empty', () => {
    expect(
      missingRequiredPaths(minimalCreateRequest({ summary: '' }))
    ).toContain('summary');
  });

  it('excludes max-length title failures', () => {
    expect(
      missingRequiredPaths(minimalCreateRequest({ title: 'a'.repeat(256) }))
    ).toEqual([]);
  });

  it('excludes event-planner lead constraint failures', () => {
    expect(
      missingRequiredPaths(
        minimalCreateRequest({
          eventPlanners: [{ eventPlannerName: 'Planner A', isLead: false }],
        })
      )
    ).toEqual([]);
  });

  it('includes commsContacts when empty or omitted but not when lead is missing', () => {
    expect(
      missingRequiredPaths(minimalCreateRequest({ commsContacts: [] }))
    ).toContain('commsContacts');

    const withoutComms = minimalCreateRequest();
    delete (withoutComms as Record<string, unknown>).commsContacts;
    expect(missingRequiredPaths(withoutComms)).toContain('commsContacts');

    expect(
      missingRequiredPaths(
        minimalCreateRequest({
          commsContacts: [{ userId: 1, isLead: false }],
        })
      )
    ).not.toContain('commsContacts');
  });

  it('emits no constraint issues for empty commsContacts', () => {
    const issues = commsContactsIssues(
      minimalCreateRequest({ commsContacts: [] })
    );
    expect(issues.every((issue) => isZodMissingRequiredIssue(issue))).toBe(
      true
    );
    expect(
      issues.some(
        (issue) =>
          getZodIssueKind(issue as ZodIssueLike) === ZOD_ISSUE_KIND.CONSTRAINT
      )
    ).toBe(false);
  });

  it('emits a single constraint issue when commsContacts has no lead', () => {
    const issues = commsContactsIssues(
      minimalCreateRequest({
        commsContacts: [{ userId: 1, isLead: false }],
      })
    );
    expect(issues).toHaveLength(1);
    expect(getZodIssueKind(issues[0] as ZodIssueLike)).toBe(
      ZOD_ISSUE_KIND.CONSTRAINT
    );
    expect(isZodMissingRequiredIssue(issues[0] as ZodIssueLike)).toBe(false);
  });
});
