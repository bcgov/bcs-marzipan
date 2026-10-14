import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

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
import { useAuth } from '@/hooks/useAuth';

import {
  ActivityConfirmHeaderBlockedNotice,
  ActivityConfirmPrimaryActionGroup,
} from './ActivityConfirmSubmitBlockedNotice';
import { type ActivitySaveConfirmPayload } from './EditActivityConfirmModal';
import { RenewPublicLastUpdatedField } from './RenewPublicLastUpdatedField';

interface CompleteActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDirty: boolean;
  isSubmitting: boolean;
  onConfirm: (value: ActivitySaveConfirmPayload) => void;
  displayId?: string;
  confirmBlockedMessage?: string | null;
}

export function CompleteActivityModal({
  open,
  onOpenChange,
  isDirty,
  isSubmitting,
  onConfirm,
  displayId,
  confirmBlockedMessage = null,
}: CompleteActivityModalProps) {
  const confirmDisabled =
    isSubmitting ||
    (confirmBlockedMessage != null && confirmBlockedMessage.length > 0);
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
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
    });
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setNotes('');
      setRenewPublicLastUpdated(false);
    }
    onOpenChange(value);
  };

  const title = isDirty ? 'Save and mark as completed?' : 'Mark as completed?';

  const description = isDirty
    ? 'Changes will be saved and the activity status will be set to completed.'
    : 'The activity status will be set to completed. This action cannot be undone through the normal workflow.';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <ActivityConfirmHeaderBlockedNotice
          confirmBlockedMessage={confirmBlockedMessage}
        />

        {displayId != null && displayId.length > 0 && (
          <p className="text-muted-foreground text-sm">
            Activity:{' '}
            <span className="text-foreground font-medium">{displayId}</span>
          </p>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="complete-confirm-notes">
              Add a note (optional)
            </Label>
            <Textarea
              id="complete-confirm-notes"
              placeholder="Optional context for the activity history."
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
            id="complete-confirm-renew-public"
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
          <ActivityConfirmPrimaryActionGroup
            confirmBlockedMessage={confirmBlockedMessage}
          >
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={confirmDisabled}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Submitting...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </ActivityConfirmPrimaryActionGroup>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
