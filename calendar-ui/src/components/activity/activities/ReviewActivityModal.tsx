import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import type { HistoryChange } from '@corpcal/shared/api/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

import { ActivityFormChangesList } from './ActivityFormChangesList';
import { ActivityHistorySaveFields } from './ActivityHistorySaveFields';
import {
  useHistoryAudienceWhenOpen,
  type ReviewActivityConfirmPayload,
} from './HistoryAudienceSelector';

interface ReviewActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pending form edits to show before confirming review. */
  changes: HistoryChange[];
  /** When true, copy mentions saving pending edits before updating status. */
  isDirty: boolean;
  isSubmitting: boolean;
  onConfirm: (payload: ReviewActivityConfirmPayload) => void;
  displayId?: string;
  permissions: string[];
  /** When true, show optional "Mark as completed" (activities.complete + eligibility). */
  showMarkAsCompletedOption?: boolean;
  /** Formatted end from saved activity; woven into description when completion is offered. */
  activityEndedAtLabel?: string | null;
  /** When true, show "Unassign me" checkbox (current user is an assignee on this activity). */
  showUnassignMeOption?: boolean;
}

export function ReviewActivityModal({
  open,
  onOpenChange,
  changes,
  isDirty,
  isSubmitting,
  onConfirm,
  displayId,
  permissions,
  showMarkAsCompletedOption = false,
  activityEndedAtLabel = null,
  showUnassignMeOption = false,
}: ReviewActivityModalProps) {
  const [notes, setNotes] = useState('');
  const [historyAudience, setHistoryAudience] = useHistoryAudienceWhenOpen(
    open,
    permissions
  );
  const [markAsCompleted, setMarkAsCompleted] = useState(false);
  const [unassignMe, setUnassignMe] = useState(false);

  const handleConfirm = () => {
    onConfirm({
      notes: notes.trim() || undefined,
      historyAudience,
      markAsCompleted,
      unassignMe,
    });
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setNotes('');
      setMarkAsCompleted(false);
      setUnassignMe(false);
    }
    onOpenChange(value);
  };

  const endedText =
    showMarkAsCompletedOption &&
    activityEndedAtLabel != null &&
    activityEndedAtLabel.length > 0
      ? ` This activity ended at ${activityEndedAtLabel}.`
      : '';

  const { title, description } = showMarkAsCompletedOption
    ? isDirty
      ? {
          title: 'Save and confirm status',
          description: `Your changes will be saved. ${endedText} It will be marked as reviewed unless you check 'Mark as completed' below.`,
        }
      : {
          title: 'Confirm activity status',
          description: `${endedText} It will be marked as reviewed unless you check 'Mark as completed' below.`,
        }
    : isDirty
      ? {
          title: 'Save and mark as reviewed?',
          description:
            'Your changes will be saved and this activity will be marked reviewed.',
        }
      : {
          title: 'Mark as reviewed?',
          description: 'The activity will be marked reviewed.',
        };

  const primaryLabel = 'Confirm';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {displayId != null && displayId.length > 0 && (
          <p className="text-muted-foreground text-sm">
            Activity:{' '}
            <span className="text-foreground font-medium">{displayId}</span>
          </p>
        )}

        <div className="max-h-[60vh] space-y-4 overflow-y-auto">
          {changes.length > 0 && (
            <ActivityFormChangesList
              key={open ? 'review-confirm-open' : 'review-confirm-closed'}
              changes={changes}
            />
          )}

          {showMarkAsCompletedOption && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="review-confirm-mark-completed"
                checked={markAsCompleted}
                onCheckedChange={(checked) =>
                  setMarkAsCompleted(checked === true)
                }
              />
              <Label
                htmlFor="review-confirm-mark-completed"
                className="cursor-pointer text-sm font-normal"
              >
                Mark as completed
              </Label>
            </div>
          )}

          {showUnassignMeOption && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="review-confirm-unassign-me"
                checked={unassignMe}
                onCheckedChange={(checked) => setUnassignMe(checked === true)}
              />
              <Label
                htmlFor="review-confirm-unassign-me"
                className="cursor-pointer text-sm font-normal"
              >
                Unassign me
              </Label>
            </div>
          )}

          <ActivityHistorySaveFields
            permissions={permissions}
            historyAudience={historyAudience}
            onHistoryAudienceChange={setHistoryAudience}
            notes={notes}
            onNotesChange={setNotes}
            idPrefix="review-confirm"
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Submitting...
              </>
            ) : (
              primaryLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
