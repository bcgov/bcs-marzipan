import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'border border-destructive bg-background text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:border-destructive focus-visible:ring-[3px] focus-visible:ring-destructive/20 dark:border-destructive dark:bg-input/30 dark:text-destructive dark:hover:bg-destructive/20 dark:hover:text-destructive dark:focus-visible:ring-destructive/40',
        outline:
          'border bg-background hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
        'outline-primary':
          'border border-primary bg-background text-primary hover:bg-primary/10 hover:text-primary focus-visible:border-primary focus-visible:ring-primary/20 dark:border-primary dark:bg-input/30 dark:text-primary dark:hover:bg-primary/20 data-[active=true]:bg-primary/10 data-[active=true]:hover:bg-primary/20 dark:data-[active=true]:bg-primary/20',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        input: 'h-(--input-height) px-4 py-2 has-[>svg]:px-3',
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-xs': "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    }
>(function Button(
  {
    className,
    variant = 'default',
    size = 'default',
    asChild = false,
    ...props
  },
  ref
) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      ref={ref}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
});

Button.displayName = 'Button';

export { Button, buttonVariants };
