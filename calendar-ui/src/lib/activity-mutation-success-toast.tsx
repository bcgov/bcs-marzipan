import { toast } from 'sonner';

import { cn } from '@/lib/utils';

export const ACTIVITY_MUTATION_SUCCESS_TOAST_DURATION_MS = 7000;

export type ActivityMutationSuccessKind = 'created' | 'updated';

export type ShowActivityMutationSuccessToastParams = {
  toastId: string;
  kind: ActivityMutationSuccessKind;
  /** Resolved display id including team/ministry prefix (e.g. MIN-000001). */
  displayId: string;
  /** Activity title; shown below the headline with two-line clamp. */
  title: string;
  activityId: number;
  showViewButton: boolean;
  onViewNavigate: (activityId: number) => void;
};

/**
 * Success toast after create/update: headline with display id, truncated title, optional text link to open the activity.
 */
export function showActivityMutationSuccessToast(
  params: ShowActivityMutationSuccessToastParams
): void {
  const {
    toastId,
    kind,
    displayId,
    title,
    activityId,
    showViewButton,
    onViewNavigate,
  } = params;

  const headline =
    kind === 'created'
      ? `Created activity ${displayId}`
      : `Updated activity ${displayId}`;
  const trimmed = title.trim();
  const subtitle =
    trimmed.length > 0
      ? trimmed
      : kind === 'created'
        ? 'Your activity has been created.'
        : 'Your activity has been updated.';

  toast.success(
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <p className="text-foreground leading-tight font-semibold">{headline}</p>
      <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
        {subtitle}
      </p>
      {showViewButton ? (
        <button
          type="button"
          className={cn(
            'text-primary m-0 h-auto w-fit shrink-0 cursor-pointer border-0 bg-transparent p-0 text-left text-sm font-normal underline-offset-4 shadow-none outline-none hover:underline',
            'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2'
          )}
          onClick={() => {
            toast.dismiss(toastId);
            onViewNavigate(activityId);
          }}
        >
          View activity
        </button>
      ) : null}
    </div>,
    {
      id: toastId,
      duration: ACTIVITY_MUTATION_SUCCESS_TOAST_DURATION_MS,
      classNames: {
        content: 'min-w-0 flex-1',
      },
      // Sonner merges by id: omitted keys are kept from the previous toast. Clear
      // action/description so an older toast shape (e.g. outline "View activity")
      // never sticks when reusing activity-updated-{id}.
      action: undefined,
      description: undefined,
      cancel: undefined,
    }
  );
}
