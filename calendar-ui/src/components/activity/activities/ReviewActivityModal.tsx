import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
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
  /** When true, copy explains saving pending edits plus marking reviewed. */
  isDirty: boolean;
  isSubmitting: boolean;
  onConfirm: (notes?: string) => void;
  displayId?: string;
}

export function ReviewActivityModal({
  open,
  onOpenChange,
  isDirty,
  isSubmitting,
  onConfirm,
  displayId,
}: ReviewActivityModalProps) {
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    onConfirm(notes.trim() || undefined);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setNotes('');
    }
    onOpenChange(value);
  };

  const title = isDirty ? 'Save and mark as reviewed?' : 'Mark as reviewed?';

  const description = isDirty
    ? 'Changes will be saved and the activity status will be set to reviewed.'
    : 'The activity status will be set to reviewed.';

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

        <div className="space-y-2">
          <Label htmlFor="review-confirm-notes">Add a note (optional)</Label>
          <Textarea
            id="review-confirm-notes"
            placeholder="Optional context for the activity history."
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
