import { describe, expect, it } from 'vitest';

import { lookAheadResetRunPreviewQuerySchema } from './look-ahead-reset.schema';

describe('lookAheadResetRunPreviewQuerySchema', () => {
  it('defaults includePast to false when omitted', () => {
    expect(lookAheadResetRunPreviewQuerySchema.parse({})).toEqual({
      scope: 'window',
      includePast: false,
    });
  });

  it('parses includePast=false from query string without coercing to true', () => {
    expect(
      lookAheadResetRunPreviewQuerySchema.parse({ includePast: 'false' })
    ).toEqual({
      scope: 'window',
      includePast: false,
    });
  });

  it('parses includePast=true from query string', () => {
    expect(
      lookAheadResetRunPreviewQuerySchema.parse({
        scope: 'all_future',
        includePast: 'true',
      })
    ).toEqual({
      scope: 'all_future',
      includePast: true,
    });
  });
});
