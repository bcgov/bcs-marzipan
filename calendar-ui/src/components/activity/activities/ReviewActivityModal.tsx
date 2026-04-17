import { Loader2 } from 'lucide-react';
import { useState } from 'react';

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

interface ReviewActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When true, copy mentions saving pending edits before updating status. */
  isDirty: boolean;
  isSubmitting: boolean;
  onConfirm: (notes?: string, markAsCompleted?: boolean) => void;
  displayId?: string;
  /** When true, show optional "Mark as completed" (activities.complete + eligibility). */
  showMarkAsCompletedOption?: boolean;
  /** Formatted end from saved activity; woven into description when completion is offered. */
  activityEndedAtLabel?: string | null;
}

export function ReviewActivityModal({
  open,
  onOpenChange,
  isDirty,
  isSubmitting,
  onConfirm,
  displayId,
  showMarkAsCompletedOption = false,
  activityEndedAtLabel = null,
}: ReviewActivityModalProps) {
  const [notes, setNotes] = useState('');
  const [markAsCompleted, setMarkAsCompleted] = useState(false);

  const handleConfirm = () => {
    onConfirm(notes.trim() || undefined, markAsCompleted);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setNotes('');
      setMarkAsCompleted(false);
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

        {showMarkAsCompletedOption && (
          <div className="space-y-3">
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
