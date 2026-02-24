import { useState } from 'react';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 1000;

interface RequestDeleteActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void | Promise<void>;
  isSubmitting: boolean;
}

export function RequestDeleteActivityModal({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: RequestDeleteActivityModalProps): React.ReactElement {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  const trimmed = reason.trim();
  const valid =
    trimmed.length >= MIN_REASON_LENGTH && trimmed.length <= MAX_REASON_LENGTH;
  const showError = touched && !valid && trimmed.length > 0;

  const handleConfirm = () => {
    setTouched(true);
    if (!valid) return;
    void onConfirm(trimmed);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setReason('');
      setTouched(false);
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request delete</DialogTitle>
          <DialogDescription>
            This will mark the activity for deletion. An admin can approve or
            restore it. You must provide a reason (at least {MIN_REASON_LENGTH}{' '}
            characters).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="request-delete-reason">
            Reason <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="request-delete-reason"
            placeholder="Explain why this activity should be deleted."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => setTouched(true)}
            rows={4}
            maxLength={MAX_REASON_LENGTH}
            className={showError ? 'border-destructive' : ''}
          />
          {showError && (
            <p className="text-destructive text-sm">
              Reason must be between {MIN_REASON_LENGTH} and {MAX_REASON_LENGTH}{' '}
              characters.
            </p>
          )}
          <p className="text-muted-foreground text-xs">
            {trimmed.length} / {MAX_REASON_LENGTH}
          </p>
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
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || !valid}
          >
            {isSubmitting ? 'Submitting...' : 'Request delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
