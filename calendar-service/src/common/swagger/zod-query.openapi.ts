import { applyDecorators } from '@nestjs/common';
import { ApiQuery, type ApiQueryOptions } from '@nestjs/swagger';
import type { z } from 'zod';

type ZodTypeAny = z.ZodType;

/** Zod v4 internal def fields used for OpenAPI query generation (not public API). */
type ZodDefInternals = {
  shape?: Record<string, ZodTypeAny>;
  innerType?: ZodTypeAny;
  in?: ZodTypeAny;
  schema?: ZodTypeAny;
  defaultValue?: unknown;
  entries?: Record<string, string>;
};

function getDef(schema: ZodTypeAny): ZodDefInternals {
  return schema.def as ZodDefInternals;
}

type InferredOpenApiQuery = {
  type: StringConstructor | BooleanConstructor | NumberConstructor;
  enum?: string[];
};

/**
 * Returns the shape of a flat Zod object schema, or null if unsupported.
 */
export function getZodObjectShape(
  schema: ZodTypeAny
): Record<string, ZodTypeAny> | null {
  if (schema.type !== 'object') {
    return null;
  }
  const shape = getDef(schema).shape;
  return shape ?? null;
}

function collectDescription(schema: ZodTypeAny): string | undefined {
  let cur: ZodTypeAny | undefined = schema;
  for (let i = 0; i < 24 && cur; i++) {
    if (cur.description) {
      return cur.description;
    }
    cur = stepInnerSchema(cur);
  }
  return undefined;
}

function stepInnerSchema(schema: ZodTypeAny): ZodTypeAny | undefined {
  const t = schema.type;
  const def = getDef(schema);
  if (t === 'optional' || t === 'default' || t === 'nullable') {
    return def.innerType;
  }
  if (t === 'pipe') {
    return def.in;
  }
  const wrapped = def.schema ?? def.innerType;
  if (wrapped) {
    return wrapped;
  }
  return undefined;
}

function isOptionalOnWire(schema: ZodTypeAny): boolean {
  let cur: ZodTypeAny | undefined = schema;
  for (let i = 0; i < 24 && cur; i++) {
    const t = cur.type;
    if (t === 'optional' || t === 'default') {
      return true;
    }
    if (t === 'pipe') {
      cur = getDef(cur).in;
      continue;
    }
    cur = stepInnerSchema(cur);
  }
  return false;
}

function collectDefaultHint(schema: ZodTypeAny): string | undefined {
  let cur: ZodTypeAny | undefined = schema;
  for (let i = 0; i < 24 && cur; i++) {
    if (cur.type === 'default') {
      const value = getDef(cur).defaultValue;
      try {
        const resolved =
          typeof value === 'function' ? (value as () => unknown)() : value;
        return `Default: ${JSON.stringify(resolved)}`;
      } catch {
        return 'Default value applied when omitted';
      }
    }
    cur = stepInnerSchema(cur);
  }
  return undefined;
}

function findEnumValues(schema: ZodTypeAny): string[] | undefined {
  let cur: ZodTypeAny | undefined = schema;
  for (let i = 0; i < 24 && cur; i++) {
    if (cur.type === 'enum') {
      const values = getDef(cur).entries;
      if (values && typeof values === 'object') {
        return Object.keys(values);
      }
    }
    cur = stepInnerSchema(cur);
  }
  return undefined;
}

function inferQueryOpenApiType(schema: ZodTypeAny): InferredOpenApiQuery {
  let cur: ZodTypeAny | undefined = schema;
  for (let i = 0; i < 24 && cur; i++) {
    const enumValues = findEnumValues(cur);
    if (enumValues?.length) {
      return { type: String, enum: enumValues };
    }

    const t = cur.type;
    if (t === 'boolean') {
      return { type: Boolean };
    }
    if (t === 'number' || t === 'bigint') {
      return { type: Number };
    }
    if (t === 'string') {
      return { type: String };
    }
    if (t === 'array' || t === 'union') {
      return {
        type: String,
      };
    }

    cur = stepInnerSchema(cur);
  }

  return { type: String };
}

function buildDescription(schema: ZodTypeAny): string | undefined {
  const parts: string[] = [];
  const base = collectDescription(schema);
  if (base) {
    parts.push(base);
  }
  const defaultHint = collectDefaultHint(schema);
  if (defaultHint) {
    parts.push(defaultHint);
  }
  if (parts.length === 0) {
    return undefined;
  }
  return parts.join(' ');
}

/**
 * Builds Nest `@ApiQuery` method decorators from a flat Zod object schema.
 * HTTP query values are documented as strings unless the schema resolves to
 * boolean/number/enum after unwrapping.
 */
export function buildApiQueryDecorators(schema: ZodTypeAny): MethodDecorator[] {
  const shape = getZodObjectShape(schema);
  if (!shape) {
    throw new Error(
      '@ApiZodQueries requires a Zod object schema (flat z.object). Use Pattern B for other shapes.'
    );
  }

  const decorators: MethodDecorator[] = [];
  for (const [name, fieldSchema] of Object.entries(shape)) {
    const { type, enum: enumValues } = inferQueryOpenApiType(fieldSchema);
    const description = buildDescription(fieldSchema);
    const options: ApiQueryOptions = {
      name,
      required: !isOptionalOnWire(fieldSchema),
      type,
      ...(enumValues ? { enum: enumValues } : {}),
      ...(description ? { description } : {}),
    };
    decorators.push(ApiQuery(options));
  }
  return decorators;
}

/**
 * Pattern A: document query params from the same Zod schema used with
 * `@Query(new ZodValidationPipe(schema))`.
 */
export function ApiZodQueries(schema: ZodTypeAny): MethodDecorator {
  return applyDecorators(...buildApiQueryDecorators(schema));
}
