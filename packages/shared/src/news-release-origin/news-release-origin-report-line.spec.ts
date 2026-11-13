import { describe, expect, it } from 'vitest';

import { NEWS_RELEASE_ORIGIN_IDS } from './constants';
import { newsReleaseOriginReportLine } from './news-release-origin-report-line';

describe('newsReleaseOriginReportLine', () => {
  it('maps ministry release id to BCGov', () => {
    expect(
      newsReleaseOriginReportLine(NEWS_RELEASE_ORIGIN_IDS.ministryRelease)
    ).toBe('BCGov');
  });

  it('maps federal release to Fed', () => {
    expect(newsReleaseOriginReportLine(NEWS_RELEASE_ORIGIN_IDS.federal)).toBe(
      'Fed'
    );
  });
});
