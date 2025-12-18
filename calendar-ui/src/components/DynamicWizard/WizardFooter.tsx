import * as React from 'react';
import { Button, makeStyles } from '@fluentui/react-components';

const useStyles = makeStyles({
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    marginTop: '1.5rem',
    flexWrap: 'wrap',
  },
});

interface WizardFooterProps {
  stepKey: string;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  onSaveDraft: () => void;
  isLast: boolean;
  disableNext?: boolean;
  stepIndex?: number;
}

export const WizardFooter: React.FC<WizardFooterProps> = ({
  stepKey,
  onNext,
  onBack,
  isLast,
  onSubmit,
  onSaveDraft,
  disableNext,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.footer}>
      <Button onClick={onBack}>Back</Button>
      <Button appearance="secondary" onClick={onSaveDraft}>
        Save as Draft
      </Button>
      {!isLast ? (
        <Button appearance="primary" onClick={onNext} disabled={disableNext}>
          Next
        </Button>
      ) : (
        <Button appearance="primary" onClick={onSubmit}>
          Submit
        </Button>
      )}
      <Button>Cancel</Button>
    </div>
  );
};
