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

import { pathsIncludeFieldChange } from '@/components/activity/ActivityTable/activityTableRowDisplay';
import {
  FORM_FIELD_LABEL_HIGHLIGHT_CLASS,
  getFormFieldHighlightScreenReaderText,
} from '@/lib/form-field-highlight';

import { cn } from '../../lib/utils';
import { Label } from './label';

const Form = FormProvider;

type FormDisplayOptionsContextValue = {
  /** Yellow label highlights for unsaved + since-review paths (ACTIVITIES.REVIEW on edit). */
  showFieldChangeHighlights: boolean;
  /** Dotted field paths flagged as changed since the last Reviewed snapshot. Empty set = no review diff. */
  reviewerChangedPaths: ReadonlySet<string>;
};

const FormDisplayOptionsContext = createContext<FormDisplayOptionsContextValue>(
  {
    showFieldChangeHighlights: true,
    reviewerChangedPaths: new Set(),
  }
);

export function useFormDisplayOptions(): FormDisplayOptionsContextValue {
  return useContext(FormDisplayOptionsContext);
}

type FormDisplayOptionsProviderProps = {
  showFieldChangeHighlights?: boolean;
  reviewerChangedPaths?: ReadonlySet<string>;
  children: ReactNode;
};

function FormDisplayOptionsProvider({
  showFieldChangeHighlights = true,
  reviewerChangedPaths,
  children,
}: FormDisplayOptionsProviderProps): ReactElement {
  const value = {
    showFieldChangeHighlights,
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

    return (
      <FormItemContext.Provider value={{ id, ariaRequired, setAriaRequired }}>
        <div ref={ref} className={cn('space-y-2', className)} {...props} />
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

type FormPathsFieldHighlightState = {
  highlight: boolean;
  screenReaderText: string | null;
};

/**
 * Label highlight for composite group labels (Date, Time, Venue) when any nested path is dirty or needs review.
 */
function useFormPathsFieldHighlight(
  names: readonly string[]
): FormPathsFieldHighlightState {
  const { showFieldChangeHighlights, reviewerChangedPaths } =
    useFormDisplayOptions();
  const { control } = useFormContext();
  const { dirtyFields } = useFormState({ control });

  if (!showFieldChangeHighlights) {
    return { highlight: false, screenReaderText: null };
  }

  const anyDirty = names.some((path) => dirtyFieldAtPath(dirtyFields, path));
  const anyReview = names.some((path) =>
    pathsIncludeFieldChange(reviewerChangedPaths, path)
  );
  const highlight = anyDirty || anyReview;
  return {
    highlight,
    screenReaderText: highlight
      ? getFormFieldHighlightScreenReaderText(anyDirty, anyReview)
      : null,
  };
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
    const { showFieldChangeHighlights, reviewerChangedPaths } =
      useFormDisplayOptions();

    useLayoutEffect(() => {
      if (!showRequired) return;
      setAriaRequired(true);
      return () => {
        setAriaRequired(false);
      };
    }, [showRequired, setAriaRequired]);

    const needsReview = pathsIncludeFieldChange(reviewerChangedPaths, name);
    const highlight =
      showFieldChangeHighlights &&
      showDirtyIndicator &&
      (isDirty || needsReview);
    const screenReaderText = highlight
      ? getFormFieldHighlightScreenReaderText(isDirty, needsReview)
      : null;

    return (
      <Label
        ref={ref}
        className={cn(
          showError && 'text-destructive',
          className,
          'flex items-center gap-2'
        )}
        htmlFor={formItemId}
        {...props}
      >
        <span
          className={cn(
            'inline-flex items-center gap-1',
            highlight && FORM_FIELD_LABEL_HIGHLIGHT_CLASS
          )}
        >
          {children}
          {showRequired ? <RequiredFieldIndicator className="inline" /> : null}
          {screenReaderText ? (
            <span className="sr-only">{screenReaderText}</span>
          ) : null}
        </span>
      </Label>
    );
  }
);
FormLabel.displayName = 'FormLabel';

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
  FormDisplayOptionsProvider,
  RequiredFieldIndicator,
  useFormPathsFieldHighlight,
};
