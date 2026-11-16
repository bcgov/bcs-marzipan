import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { assertReportTypeAccess } from './assert-report-type-access';

const LOOK_AHEAD_VIEW = 'look_ahead.view';
const LOOK_AHEAD_EXEC_VIEW = 'look_ahead.exec.view';
const REPORTS_VIEW = 'reports.view';

describe('assertReportTypeAccess', () => {
  it('allows look-ahead with look_ahead.view', () => {
    expect(() =>
      assertReportTypeAccess('look-ahead', [LOOK_AHEAD_VIEW])
    ).not.toThrow();
  });

  it('allows look-ahead with reports.view', () => {
    expect(() =>
      assertReportTypeAccess('look-ahead', [REPORTS_VIEW])
    ).not.toThrow();
  });

  it('denies look-ahead without either permission', () => {
    expect(() => assertReportTypeAccess('look-ahead', [])).toThrow(
      ForbiddenException
    );
  });

  it('allows exec with look_ahead.exec.view', () => {
    expect(() =>
      assertReportTypeAccess('exec', [LOOK_AHEAD_EXEC_VIEW])
    ).not.toThrow();
  });

  it('denies exec with only look_ahead.view', () => {
    expect(() => assertReportTypeAccess('exec', [LOOK_AHEAD_VIEW])).toThrow(
      ForbiddenException
    );
  });

  it('allows exec with reports.view', () => {
    expect(() => assertReportTypeAccess('exec', [REPORTS_VIEW])).not.toThrow();
  });

  it('denies custom report without reports.view', () => {
    expect(() => assertReportTypeAccess('custom', [LOOK_AHEAD_VIEW])).toThrow(
      ForbiddenException
    );
  });

  it('allows planning with reports.view', () => {
    expect(() =>
      assertReportTypeAccess('planning', [REPORTS_VIEW])
    ).not.toThrow();
  });
});
