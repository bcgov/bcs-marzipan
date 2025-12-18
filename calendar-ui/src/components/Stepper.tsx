import * as React from 'react';
import { makeStyles, shorthands } from '@fluentui/react-components';
import { CheckmarkCircle24Filled } from '@fluentui/react-icons';

const useStyles = makeStyles({
  stepper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
    marginBottom: '24px',
  },
  step: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    flex: '1',
  },
  circle: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '2px solid #ccc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
    color: '#666',
    fontWeight: 600,
    marginBottom: '6px',
  },
  active: {
    // borderColor: "#0078D4",
    color: '#0078D4',
  },
  completed: {
    background: 'green',
    // borderColor: "green",
    color: 'white',
  },
  label: {
    fontSize: '14px',
    color: '#333',
  },
  connector: {
    position: 'absolute',
    top: '16px',
    left: '100%',
    width: '100%',
    height: '2px',
    background: '#ccc',
    zIndex: -1,
  },
  connectorActive: {
    background: '#0078D4',
  },
});

const steps = ['Details', 'Schedule', 'Event', 'Comms', 'Sharing'];

export const Stepper = ({ currentStep }: { currentStep: number }) => {
  const styles = useStyles();

  return (
    <div className={styles.stepper}>
      {steps.map((label, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div className={styles.step} key={label}>
            <div
              className={`${styles.circle} ${
                isCompleted ? styles.completed : isActive ? styles.active : ''
              }`}
            >
              {isCompleted ? <CheckmarkCircle24Filled /> : index + 1}
            </div>
            <span className={styles.label}>{label}</span>

            {index < steps.length - 1 && (
              <div
                className={`${styles.connector} ${
                  isCompleted ? styles.connectorActive : ''
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
