// Field types the renderer supports
export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'time'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'checkbox-group';

export type OptionItem = { value: string; label: string };

export type ValidationRules = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string; // regex string
  email?: boolean;
};

export type FieldSchema = {
  name: string; // unique within a step
  label: string;
  type: FieldType;
  placeholder?: string;
  helperText?: string;
  defaultValue?: any;
  options?: OptionItem[]; // for select/multiselect/checkbox-group
  validation?: ValidationRules;
  colSpan?: 6 | 12; // layout: 12 = full, 6 = half on desktop
};

export type StepSchema = {
  key: string; // machine key, e.g. "details"
  title: string;
  label: string; // human label
  // description?: string;
  fields: FieldSchema[];
  // step?: string;               // optional, defaults to key
};

export type WizardSchema = StepSchema[];
