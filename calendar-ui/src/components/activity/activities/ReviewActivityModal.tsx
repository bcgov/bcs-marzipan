import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

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
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import type { ActivityConfirmBlockedNotice } from '@/lib/activity-edit-session-messages';

import {
  ActivityConfirmHeaderBlockedNotice,
  ActivityConfirmPrimaryActionGroup,
} from './ActivityConfirmSubmitBlockedNotice';
import { ActivityFormChangesList } from './ActivityFormChangesList';
import { type ActivitySaveConfirmPayload } from './EditActivityConfirmModal';
import { RenewPublicLastUpdatedField } from './RenewPublicLastUpdatedField';

export type ReviewActivityConfirmPayload = ActivitySaveConfirmPayload & {
  markAsCompleted?: boolean;
  unflagMe?: boolean;
};

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
  /** When true, show optional "Mark as completed" (activities.complete + eligibility). */
  showMarkAsCompletedOption?: boolean;
  /** Formatted end from saved activity; woven into description when completion is offered. */
  activityEndedAtLabel?: string | null;
  /** When true, show "Unflag me" checkbox (current user is flagged on this activity). */
  showUnflagMeOption?: boolean;
  confirmDisabled?: boolean;
  confirmBlockedNotice?: ActivityConfirmBlockedNotice | null;
}

export function ReviewActivityModal({
  open,
  onOpenChange,
  changes,
  isDirty,
  isSubmitting,
  onConfirm,
  displayId,
  showMarkAsCompletedOption = false,
  activityEndedAtLabel = null,
  showUnflagMeOption = false,
  confirmDisabled = false,
  confirmBlockedNotice = null,
}: ReviewActivityModalProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [markAsCompleted, setMarkAsCompleted] = useState(false);
  const [unflagMe, setUnflagMe] = useState(false);
  const [renewPublicLastUpdated, setRenewPublicLastUpdated] = useState(false);

  useEffect(() => {
    if (open) {
      setRenewPublicLastUpdated(false);
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm({
      notes: notes.trim() || undefined,
      ...(renewPublicLastUpdated ? { renewPublicLastUpdated: true } : {}),
      ...(markAsCompleted ? { markAsCompleted: true } : {}),
      ...(unflagMe ? { unflagMe: true } : {}),
    });
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setNotes('');
      setMarkAsCompleted(false);
      setUnflagMe(false);
      setRenewPublicLastUpdated(false);
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

        <ActivityConfirmHeaderBlockedNotice notice={confirmBlockedNotice} />

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

          {showUnflagMeOption && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="review-confirm-unflag-me"
                checked={unflagMe}
                onCheckedChange={(checked) => setUnflagMe(checked === true)}
              />
              <Label
                htmlFor="review-confirm-unflag-me"
                className="cursor-pointer text-sm font-normal"
              >
                Unflag me
              </Label>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="review-confirm-notes">Add a note (optional)</Label>
            <Textarea
              id="review-confirm-notes"
              placeholder="Give additional context about your changes."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>

          <RenewPublicLastUpdatedField
            permissions={user?.permissions ?? []}
            checked={renewPublicLastUpdated}
            onCheckedChange={setRenewPublicLastUpdated}
            id="review-confirm-renew-public"
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
          <ActivityConfirmPrimaryActionGroup notice={confirmBlockedNotice}>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting || confirmDisabled}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Submitting...
                </>
              ) : (
                primaryLabel
              )}
            </Button>
          </ActivityConfirmPrimaryActionGroup>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
