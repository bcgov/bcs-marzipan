import * as React from 'react';
import {
  Field,
  Input,
  Textarea,
  Dropdown,
  Option,
  Checkbox,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { FieldSchema, StepSchema } from '../../schemas/types';

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: tokens.spacingHorizontalM,
    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
    },
  },
  cell12: { gridColumn: 'span 12' },
  cell6: {
    gridColumn: 'span 12',
    '@media (min-width: 768px)': { gridColumn: 'span 6' },
  },
});

type Props = {
  step: StepSchema;
  values: Record<string, any>;
  errors: Record<string, string | undefined>;
  onChange: (name: string, value: any) => void;
  onBlurValidate: (field: FieldSchema) => void;
};

export const FieldRenderer: React.FC<Props> = ({
  step,
  values,
  errors,
  onChange,
  onBlurValidate,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.grid}>
      {step.fields.map((f) => {
        const colClass = f.colSpan === 6 ? styles.cell6 : styles.cell12;
        const error = errors[f.name];
        const validationState = error ? 'error' : 'none';

        const commonFieldProps = {
          key: f.name,
          label: f.label,
          validationMessage: error,
          validationState: validationState as any,
          hint: f.helperText,
          required: !!f.validation?.required,
        };

        switch (f.type) {
          case 'text':
          case 'number':
          case 'date':
          case 'time':
            return (
              <div key={f.name} className={colClass}>
                <Field {...commonFieldProps}>
                  <Input
                    type={f.type === 'number' ? 'number' : f.type}
                    value={values[f.name] ?? ''}
                    placeholder={f.placeholder}
                    onChange={(_, d) => onChange(f.name, d.value)}
                    onBlur={() => onBlurValidate(f)}
                    onClick={(e) =>
                      // open native pickers on click for date/time
                      (e.currentTarget as HTMLInputElement).showPicker?.()
                    }
                  />
                </Field>
              </div>
            );

          case 'textarea':
            return (
              <div key={f.name} className={colClass}>
                <Field {...commonFieldProps}>
                  <Textarea
                    value={values[f.name] ?? ''}
                    placeholder={f.placeholder}
                    onChange={(_, d) => onChange(f.name, d.value)}
                    onBlur={() => onBlurValidate(f)}
                    resize="vertical"
                  />
                </Field>
              </div>
            );

          case 'select':
            return (
              <div key={f.name} className={colClass}>
                <Field {...commonFieldProps}>
                  <Dropdown
                    placeholder={f.placeholder}
                    selectedOptions={values[f.name] ? [values[f.name]] : []}
                    onOptionSelect={(_, data) =>
                      onChange(f.name, data.optionValue)
                    }
                    onBlur={() => onBlurValidate(f)}
                  >
                    {f.options?.map((o) => (
                      <Option key={o.value} value={o.value}>
                        {o.label}
                      </Option>
                    ))}
                  </Dropdown>
                </Field>
              </div>
            );

          case 'multiselect':
            return (
              <div key={f.name} className={colClass}>
                <Field {...commonFieldProps}>
                  <Dropdown
                    multiselect
                    placeholder={f.placeholder}
                    selectedOptions={values[f.name] ?? []}
                    onOptionSelect={(_, data) =>
                      onChange(f.name, data.selectedOptions)
                    }
                    onBlur={() => onBlurValidate(f)}
                  >
                    {f.options?.map((o) => (
                      <Option key={o.value} value={o.value}>
                        {o.label}
                      </Option>
                    ))}
                  </Dropdown>
                </Field>
              </div>
            );

          case 'checkbox':
            return (
              <div key={f.name} className={colClass}>
                <Field {...commonFieldProps}>
                  <Checkbox
                    label={f.label}
                    checked={!!values[f.name]}
                    onChange={(_, data) => onChange(f.name, data.checked)}
                    onBlur={() => onBlurValidate(f)}
                  />
                </Field>
              </div>
            );

          case 'checkbox-group':
            return (
              <div key={f.name} className={colClass}>
                <Field {...commonFieldProps}>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {f.options?.map((o) => {
                      const selected: string[] = values[f.name] ?? [];
                      const checked = selected.includes(o.value);
                      return (
                        <Checkbox
                          key={o.value}
                          label={o.label}
                          checked={checked}
                          onChange={(_, data) => {
                            const next = data.checked
                              ? [...selected, o.value]
                              : selected.filter((v) => v !== o.value);
                            onChange(f.name, next);
                          }}
                          onBlur={() => onBlurValidate(f)}
                        />
                      );
                    })}
                  </div>
                </Field>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};
