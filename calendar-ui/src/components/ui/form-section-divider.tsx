import { cn } from '@/lib/utils';

type FormSectionDividerProps = {
  className?: string;
};

/**
 * Horizontal rule between blocks in long forms (e.g. activity form sections).
 * Vertical margin is my-6 (24px) plus 4px on each side for breathing room.
 */
export function FormSectionDivider({ className }: FormSectionDividerProps) {
  return (
    <div
      role="separator"
      aria-hidden="true"
      className={cn('my-8 w-full border-t border-gray-300', className)}
    />
  );
}
