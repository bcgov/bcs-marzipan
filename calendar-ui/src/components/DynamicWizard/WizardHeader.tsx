import * as React from 'react';
import {
  Title2,
  Caption1,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { StepSchema } from '../../schemas/types';

const useStyles = makeStyles({
  header: { display: 'grid', gap: tokens.spacingVerticalXS },
  stepper: { display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px' },
  circle: {
    width: '24px',
    height: '24px',
    borderRadius: '9999',
    border: `2px solid ${tokens.colorNeutralStroke1}`,
    display: 'grid',
    placeItems: 'center',
  },
  circleActive: {
    background: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    ...shorthands.borderColor(tokens.colorBrandBackground),
  },
  circleCompleted: { ...shorthands.borderColor(tokens.colorBrandBackground) },
});

export type Step = string;

type WizardHeaderProps = {
  title: string;
  entryId?: string;
  steps: StepSchema[];
  stepIndex: number;
};

export const WizardHeader: React.FC<WizardHeaderProps> = ({
  title,
  entryId,
  steps,
  stepIndex,
}) => {
  const s = useStyles();
  return (
    <div className={s.header}>
      <Title2>{title}</Title2>
      {entryId && <Caption1>{entryId}</Caption1>}
      <div className={s.stepper}>
        {steps.map((st, i) => {
          const active = st.key === steps[stepIndex].key;
          const done = i < stepIndex;
          return (
            <div key={st.key} style={{ textAlign: 'center' }}>
              <div
                className={[
                  s.circle,
                  active ? s.circleActive : '',
                  done ? s.circleCompleted : '',
                ].join(' ')}
              >
                {i + 1}
              </div>
              <Caption1>{st.label}</Caption1>
            </div>
          );
        })}
      </div>
    </div>
  );
};
