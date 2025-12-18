import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

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
  fieldsClassName = 'space-y-4',
}) => {
  return (
    <div className={cn('space-y-6', className)}>
      <h2 className="pb-2 text-xl font-semibold">{title}</h2>
      <div className={fieldsClassName}>{children}</div>
    </div>
  );
};
