import * as React from 'react';
import { FieldSchema, StepSchema } from '../../schemas/types';

type WizardStepFormProps = {
  step: StepSchema;
  values: Record<string, any>;
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
};

export const WizardStepForm: React.FC<WizardStepFormProps> = ({
  step,
  values,
  errors,
  onChange,
}) => {
  return (
    <form>
      {step.fields.map((field) => {
        const value = values[field.name];
        const error = errors[field.name];

        if (field.type === 'multiselect' || field.type === 'checkbox-group') {
          return (
            <div key={field.name} style={{ marginBottom: 16 }}>
              <label>{field.label}</label>
              <textarea
                readOnly
                value={Array.isArray(value) ? value.join(', ') : ''}
                style={{ width: '100%', minHeight: '40px', resize: 'none' }}
              />
              {error && <div style={{ color: 'red' }}>{error}</div>}
            </div>
          );
        }

        return (
          <div key={field.name} style={{ marginBottom: 16 }}>
            <label>{field.label}</label>
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              value={value ?? ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              style={{ width: '100%' }}
            />
            {error && <div style={{ color: 'red' }}>{error}</div>}
          </div>
        );
      })}
    </form>
  );
};
