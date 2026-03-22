import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { ActivityFormHeading } from './ActivityFormHeading';

type ActivityFormSectionProps = {
  title: string;
  children: ReactNode;
  className?: string;
  fieldsClassName?: string;
};

export const ActivityFormSection: React.FC<ActivityFormSectionProps> = ({
  title,
  children,
  className,
  fieldsClassName = 'space-y-6',
}) => {
  return (
    <div
      className={cn(
        'space-y-6 rounded-md border border-gray-300 p-6',
        className
      )}
    >
      <ActivityFormHeading>{title}</ActivityFormHeading>
      <div className={fieldsClassName}>{children}</div>
    </div>
  );
};
