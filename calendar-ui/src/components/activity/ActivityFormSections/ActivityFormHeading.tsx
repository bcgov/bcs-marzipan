import type { FC, ReactNode } from 'react';

import { cn } from '@/lib/utils';

type ActivityFormHeadingProps = {
  children: ReactNode;
  className?: string;
};

export const ActivityFormHeading: FC<ActivityFormHeadingProps> = ({
  children,
  className,
}) => (
  <h2 className={cn('text-md pb-3 font-semibold', className)}>{children}</h2>
);
