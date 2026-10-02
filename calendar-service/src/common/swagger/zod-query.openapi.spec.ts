import { z } from 'zod';

import {
  buildApiQueryDecorators,
  getZodObjectShape,
} from './zod-query.openapi';

describe('getZodObjectShape', () => {
  it('returns shape for z.object', () => {
    const schema = z.object({ a: z.string() });
    expect(getZodObjectShape(schema)).toEqual({ a: expect.anything() });
  });

  it('returns null for non-object schemas', () => {
    expect(getZodObjectShape(z.string())).toBeNull();
  });
});

describe('buildApiQueryDecorators', () => {
  it('builds decorators for enum and coerce number fields', () => {
    const schema = z.object({
      order: z.enum(['asc', 'desc']).optional().describe('Sort order'),
      page: z.coerce.number().int().min(1).optional().default(1),
    });

    const decorators = buildApiQueryDecorators(schema);
    expect(decorators).toHaveLength(2);
  });

  it('throws for non-object schemas', () => {
    expect(() => buildApiQueryDecorators(z.string())).toThrow(/flat z\.object/);
  });

  it('documents comma-separated array fields as string query params', () => {
    const schema = z.object({
      userIds: z.string().optional().describe('Comma-separated user IDs'),
    });
    const decorators = buildApiQueryDecorators(schema);
    expect(decorators).toHaveLength(1);
  });

  it('marks fields with defaults as optional in OpenAPI', () => {
    const schema = z.object({
      page: z.coerce.number().int().min(1).optional().default(1),
    });
    const decorators = buildApiQueryDecorators(schema);
    expect(decorators).toHaveLength(1);
  });
});
