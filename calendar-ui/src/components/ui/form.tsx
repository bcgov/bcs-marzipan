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
  useLayoutEffect,
  useState,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';

import { cn } from '../../lib/utils';
import { FormFieldIndicator } from './form-field-changed-indicator';
import { Label } from './label';

const Form = FormProvider;

type FormDisplayOptionsContextValue = {
  showChangedBadges: boolean;
  /** Dotted field paths flagged as changed since the last Reviewed snapshot. Empty set = no review diff. */
  reviewerChangedPaths: ReadonlySet<string>;
};

const FormDisplayOptionsContext = createContext<FormDisplayOptionsContextValue>(
  {
    showChangedBadges: true,
    reviewerChangedPaths: new Set(),
  }
);

export function useFormDisplayOptions(): FormDisplayOptionsContextValue {
  return useContext(FormDisplayOptionsContext);
}

type FormDisplayOptionsProviderProps = {
  showChangedBadges?: boolean;
  reviewerChangedPaths?: ReadonlySet<string>;
  children: ReactNode;
};

function FormDisplayOptionsProvider({
  showChangedBadges = true,
  reviewerChangedPaths,
  children,
}: FormDisplayOptionsProviderProps): ReactElement {
  const value = {
    showChangedBadges,
    reviewerChangedPaths: reviewerChangedPaths ?? new Set<string>(),
  };
  return (
    <FormDisplayOptionsContext.Provider value={value}>
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
  const { id, ariaRequired } = itemContext;
  const showError = Boolean(
    fieldState.error &&
    (fieldState.isTouched || fieldState.isDirty || formState.submitCount > 0)
  );

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ariaRequired,
    ...fieldState,
    showError,
  };
};

type FormItemContextValue = {
  id: string;
  ariaRequired: boolean;
  setAriaRequired: (value: boolean) => void;
};

const FormItemContext = createContext<FormItemContextValue | null>(null);

const FormItem = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const id = useId();
    const [ariaRequired, setAriaRequired] = useState(false);
    const { name } = useContext(FormFieldContext);
    const { reviewerChangedPaths } = useFormDisplayOptions();
    const showReviewChangedHighlight =
      typeof name === 'string' && reviewerChangedPaths.has(name);

    return (
      <FormItemContext.Provider value={{ id, ariaRequired, setAriaRequired }}>
        <div
          ref={ref}
          className={cn(
            'space-y-2',
            showReviewChangedHighlight && 'rounded-sm bg-[#FFDDB3]',
            className
          )}
          {...props}
        />
      </FormItemContext.Provider>
    );
  }
);
FormItem.displayName = 'FormItem';

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

const FormLabel = forwardRef<
  ElementRef<typeof LabelPrimitive.Root>,
  ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    showDirtyIndicator?: boolean;
    /** Renders the required asterisk and sets `aria-required` on the sibling {@link FormControl}. */
    showRequired?: boolean;
  }
>(
  (
    {
      className,
      children,
      showDirtyIndicator = true,
      showRequired = false,
      ...props
    },
    ref
  ) => {
    const { showError, formItemId, isDirty, name } = useFormField();
    const { setAriaRequired } = useContext(FormItemContext)!;
    const { showChangedBadges, reviewerChangedPaths } = useFormDisplayOptions();

    useLayoutEffect(() => {
      if (!showRequired) return;
      setAriaRequired(true);
      return () => {
        setAriaRequired(false);
      };
    }, [showRequired, setAriaRequired]);

    return (
      <Label
        ref={ref}
        className={cn(
          showError && 'text-destructive',
          className,
          'flex items-center gap-2',
          showChangedBadges && showDirtyIndicator && 'min-h-[18px]'
        )}
        htmlFor={formItemId}
        {...props}
      >
        <span className="inline-flex items-center gap-1">
          {children}
          {showRequired ? <RequiredFieldIndicator className="inline" /> : null}
        </span>
        {showChangedBadges &&
          showDirtyIndicator &&
          (isDirty ? (
            <FormFieldIndicator variant="changed" />
          ) : reviewerChangedPaths.has(name) ? (
            <FormFieldIndicator variant="review" />
          ) : null)}
      </Label>
    );
  }
);
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
 * Prioritises the RHF dirty indicator; falls back to review-diff indicator when not dirty.
 */
function FormFieldDirtyIndicator({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const { showChangedBadges, reviewerChangedPaths } = useFormDisplayOptions();
  const { control } = useFormContext();
  const { dirtyFields } = useFormState({ control });
  if (!showChangedBadges) return null;
  if (dirtyFieldAtPath(dirtyFields, name)) {
    return <FormFieldIndicator variant="changed" className={className} />;
  }
  if (reviewerChangedPaths.has(name)) {
    return <FormFieldIndicator variant="review" className={className} />;
  }
  return null;
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
  const { showChangedBadges, reviewerChangedPaths } = useFormDisplayOptions();
  const { control } = useFormContext();
  const { dirtyFields } = useFormState({ control });
  if (!showChangedBadges) return null;
  const anyDirty = names.some((path) => dirtyFieldAtPath(dirtyFields, path));
  if (anyDirty) {
    return <FormFieldIndicator variant="changed" className={className} />;
  }
  const anyReview = names.some((path) => reviewerChangedPaths.has(path));
  if (anyReview) {
    return <FormFieldIndicator variant="review" className={className} />;
  }
  return null;
}

const FormControl = forwardRef<
  ElementRef<typeof Slot>,
  ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const {
    showError,
    formItemId,
    formDescriptionId,
    formMessageId,
    ariaRequired,
  } = useFormField();

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !showError
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={showError}
      {...props}
      aria-required={ariaRequired ? true : undefined}
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
  const { error, showError, formMessageId } = useFormField();
  const body = showError && error ? String(error?.message) : children;

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
