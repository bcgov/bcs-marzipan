import * as z from 'zod';
import { FieldSchema, StepSchema } from './types';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

function fieldToZod(field: FieldSchema): z.ZodTypeAny {
  const v = field.validation || {};

  switch (field.type) {
    case 'text':
    case 'textarea': {
      let schema = z.string();
      if (v.email) schema = schema.email('Invalid email address');
      if (v.minLength)
        schema = schema.min(v.minLength, `Min ${v.minLength} chars`);
      if (v.maxLength)
        schema = schema.max(v.maxLength, `Max ${v.maxLength} chars`);
      if (v.pattern)
        schema = schema.regex(new RegExp(v.pattern), 'Invalid format');
      if (!v.required) return schema.optional();
      return schema;
    }

    case 'number': {
      let schema = z.coerce.number();
      if (typeof v.min === 'number') schema = schema.min(v.min, `Min ${v.min}`);
      if (typeof v.max === 'number') schema = schema.max(v.max, `Max ${v.max}`);
      if (!v.required) return schema.optional();
      return schema;
    }

    case 'date': {
      const schema = z.string().regex(dateRegex, 'Use YYYY-MM-DD');
      if (!v.required) return schema.optional();
      return schema;
    }

    case 'time': {
      const schema = z.string().regex(timeRegex, 'Use HH:mm');
      if (!v.required) return schema.optional();
      return schema;
    }

    case 'select': {
      const schema = z.string();
      if (!v.required) return schema.optional();
      return schema;
    }

    case 'multiselect':
    case 'checkbox-group': {
      const schema = z.array(z.string());
      if (!v.required) return schema.optional();
      return schema;
    }

    case 'checkbox': {
      let schema: z.ZodTypeAny = z.coerce.boolean();
      if (v.required) {
        schema = schema.refine(Boolean, 'Required');
      } else {
        schema = schema.optional();
      }
      return schema;
    }

    default:
      return z.any();
  }
}

export function zodForStep(step: StepSchema) {
  const shape: Record<string, z.ZodTypeAny> = {};
  step.fields.forEach((f) => {
    shape[f.name] = fieldToZod(f);
  });
  return z.object(shape);
}
