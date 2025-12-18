import * as React from 'react';
import { WizardStepForm } from './WizardStepForm';
import { WizardHeader } from './WizardHeader';
import { WizardFooter } from './WizardFooter';
import { zodForStep } from '../../schemas/buildZod';
import { StepSchema } from '../../schemas/types';

type WizardProps = {
  title: string;
  entryId?: string;
  schema: StepSchema[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<void>;
};

const Wizard: React.FC<WizardProps> = ({
  title,
  entryId,
  schema,
  initialValues = {},
  onSubmit,
}) => {
  const [stepIndex, setStepIndex] = React.useState(0);
  const [values, setValues] =
    React.useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = React.useState<Record<string, any>>({});

  const stepSchema = schema[stepIndex];

  const handleChange = (field: string, value: any) => {
    setValues((prev) => ({
      ...prev,
      [stepSchema.key]: { ...prev[stepSchema.key], [field]: value },
    }));
  };

  const handleNext = async () => {
    const validator = zodForStep(stepSchema);
    try {
      validator.parse(values[stepSchema.key] || {});
      setErrors({});
      if (stepIndex < schema.length - 1) {
        setStepIndex(stepIndex + 1);
      } else {
        await onSubmit(values);
      }
    } catch (err: any) {
      const fieldErrors: Record<string, string> = {};
      if (err.errors) {
        err.errors.forEach((e: any) => {
          fieldErrors[e.path[0]] = e.message;
        });
      }
      setErrors({ [stepSchema.key]: fieldErrors });
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  return (
    <div>
      <WizardHeader
        title={title}
        entryId={entryId}
        steps={schema}
        stepIndex={stepIndex}
      />
      <WizardStepForm
        step={stepSchema}
        values={values[stepSchema.key] || {}}
        errors={errors[stepSchema.key] || {}}
        onChange={handleChange}
      />
      <WizardFooter
        stepKey={stepSchema.key}
        onBack={handleBack}
        onNext={handleNext}
        onSubmit={() => onSubmit(values)}
        onSaveDraft={() => onSubmit(values)} // Placeholder for draft saving
        isLast={stepIndex === schema.length - 1}
        stepIndex={stepIndex}
      />
      {/* <pre style={{ marginTop: "1rem", background: "#f9f9f9", padding: "0.5rem" }}>
        {JSON.stringify(values, null, 2)}
      </pre> */}
    </div>
  );
};

export default Wizard;
