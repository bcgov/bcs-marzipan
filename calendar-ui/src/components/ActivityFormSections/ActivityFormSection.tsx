import { ReactNode } from 'react';

import { cn } from '../../lib/utils';

type ActivityFormSectionVariant =
  | 'full'
  | 'top'
  | 'bottom'
  | 'bottom-no-divider';

type ActivityFormSectionProps = {
  title: string;
  children: ReactNode;
  className?: string;
  fieldsClassName?: string;
  variant?: ActivityFormSectionVariant;
};

export const ActivityFormSection: React.FC<ActivityFormSectionProps> = ({
  title,
  children,
  className,
  fieldsClassName = 'space-y-4',
  variant = 'full',
}) => {
  const borderClasses = {
    full: 'rounded-md border border-gray-300',
    top: 'rounded-t-md border border-b-0 border-gray-300',
    bottom: 'rounded-b-md border border-t border-gray-300',
    'bottom-no-divider':
      'rounded-b-md border-b border-l border-r border-gray-300',
  };

  return (
    <div className={cn('space-y-6 p-6', borderClasses[variant], className)}>
      <h2 className="pb-2 text-xl font-semibold">{title}</h2>
      <div className={fieldsClassName}>{children}</div>
    </div>
  );
};
