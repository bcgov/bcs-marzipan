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

type DeleteAction = 'soft' | 'hard';

interface DeleteActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSoftDelete: (reason: string) => void | Promise<void>;
  onHardDelete: (reason: string) => void | Promise<void>;
  isSubmitting: boolean;
}

export function DeleteActivityModal({
  open,
  onOpenChange,
  onSoftDelete,
  onHardDelete,
  isSubmitting,
}: DeleteActivityModalProps): React.ReactElement {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const [pendingAction, setPendingAction] = useState<DeleteAction | null>(null);

  const trimmed = reason.trim();
  const valid =
    trimmed.length >= MIN_REASON_LENGTH && trimmed.length <= MAX_REASON_LENGTH;
  const showError = touched && !valid && trimmed.length > 0;

  const handleSoftDelete = () => {
    setTouched(true);
    if (!valid) return;
    setPendingAction('soft');
    void onSoftDelete(trimmed);
  };

  const handleHardDelete = () => {
    setTouched(true);
    if (!valid) return;
    setPendingAction('hard');
    void onHardDelete(trimmed);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setReason('');
      setTouched(false);
      setPendingAction(null);
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete activity</DialogTitle>
          <DialogDescription>
            Soft delete marks the activity as deleted but keeps the record.
            Permanently delete removes it from the database. Both require a
            reason (at least {MIN_REASON_LENGTH} characters).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="delete-activity-reason">
            Reason <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="delete-activity-reason"
            placeholder="Reason for deletion (required for audit)."
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
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            variant="destructive"
            className="w-full sm:w-auto"
            onClick={handleSoftDelete}
            disabled={isSubmitting}
          >
            {pendingAction === 'soft' && isSubmitting
              ? 'Soft deleting...'
              : 'Soft delete'}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="w-full sm:w-auto"
            onClick={handleHardDelete}
            disabled={isSubmitting}
          >
            {pendingAction === 'hard' && isSubmitting
              ? 'Deleting...'
              : 'Permanently delete'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
