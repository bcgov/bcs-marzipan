import * as LabelPrimitive from '@radix-ui/react-label';
import { Slot } from '@radix-ui/react-slot';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
  useFormState,
} from 'react-hook-form';
import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';

import { cn } from '../../lib/utils';
import { FormFieldChangedIndicator } from './form-field-changed-indicator';
import { Label } from './label';

const Form = FormProvider;

type FormDisplayOptionsContextValue = {
  showChangedBadges: boolean;
};

const FormDisplayOptionsContext = createContext<FormDisplayOptionsContextValue>(
  {
    showChangedBadges: true,
  }
);

export function useFormDisplayOptions(): FormDisplayOptionsContextValue {
  return useContext(FormDisplayOptionsContext);
}

type FormDisplayOptionsProviderProps = {
  showChangedBadges?: boolean;
  children: ReactNode;
};

function FormDisplayOptionsProvider({
  showChangedBadges = true,
  children,
}: FormDisplayOptionsProviderProps): ReactElement {
  return (
    <FormDisplayOptionsContext.Provider value={{ showChangedBadges }}>
      {children}
    </FormDisplayOptionsContext.Provider>
  );
}

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = useContext(FormFieldContext);
  const itemContext = useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  if (!itemContext) {
    throw new Error('useFormField should be used within <FormItem>');
  }

  const fieldState = getFieldState(fieldContext.name, formState);
  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

const FormItem = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const id = useId();

    return (
      <FormItemContext.Provider value={{ id }}>
        <div ref={ref} className={cn('space-y-2', className)} {...props} />
      </FormItemContext.Provider>
    );
  }
);
FormItem.displayName = 'FormItem';

const FormLabel = forwardRef<
  ElementRef<typeof LabelPrimitive.Root>,
  ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    showDirtyIndicator?: boolean;
  }
>(({ className, children, showDirtyIndicator = true, ...props }, ref) => {
  const { error, formItemId, isDirty } = useFormField();
  const { showChangedBadges } = useFormDisplayOptions();

  return (
    <Label
      ref={ref}
      className={cn(
        error && 'text-destructive',
        className,
        'flex items-center gap-2',
        showChangedBadges && showDirtyIndicator && 'min-h-[18px]'
      )}
      htmlFor={formItemId}
      {...props}
    >
      <span className="inline-flex items-center">{children}</span>
      {showChangedBadges && showDirtyIndicator && isDirty && (
        <FormFieldChangedIndicator />
      )}
    </Label>
  );
});
FormLabel.displayName = 'FormLabel';

/** Walks RHF `dirtyFields` for dotted paths (e.g. `venueAddress.city`). */
function dirtyFieldAtPath(dirty: unknown, path: string): boolean {
  const parts = path.split('.');
  let cur: unknown = dirty;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return false;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur === true;
}

/**
 * Shows the changed marker for a field name without nesting the control under {@link FormLabel}
 * (e.g. composite date/time rows, sr-only labels).
 */
function FormFieldDirtyIndicator({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const { showChangedBadges } = useFormDisplayOptions();
  const { control } = useFormContext();
  const { dirtyFields } = useFormState({ control });
  if (!showChangedBadges || !dirtyFieldAtPath(dirtyFields, name)) {
    return null;
  }
  return <FormFieldChangedIndicator className={className} />;
}

/**
 * One “Changed” marker when any of the given RHF paths is dirty (e.g. Date / Time groups).
 */
function FormAggregateDirtyIndicator({
  names,
  className,
}: {
  names: readonly string[];
  className?: string;
}) {
  const { showChangedBadges } = useFormDisplayOptions();
  const { control } = useFormContext();
  const { dirtyFields } = useFormState({ control });
  if (!showChangedBadges) {
    return null;
  }
  const anyDirty = names.some((path) => dirtyFieldAtPath(dirtyFields, path));
  if (!anyDirty) {
    return null;
  }
  return <FormFieldChangedIndicator className={className} />;
}

const FormControl = forwardRef<
  ElementRef<typeof Slot>,
  ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
});
FormControl.displayName = 'FormControl';

const FormDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
});
FormDescription.displayName = 'FormDescription';

const FormMessage = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn('text-destructive text-sm font-medium', className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = 'FormMessage';

/**
 * Asterisk for labels of fields required on create. Colour from
 * Tailwind `text-required-field-indicator` (maps to `--color-required-field-indicator`, same as Deleted status badge background).
 */
function RequiredFieldIndicator({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('text-required-field-indicator font-semibold', className)}
      aria-hidden
      {...props}
    >
      *
    </span>
  );
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  FormFieldDirtyIndicator,
  FormAggregateDirtyIndicator,
  FormDisplayOptionsProvider,
  RequiredFieldIndicator,
};
