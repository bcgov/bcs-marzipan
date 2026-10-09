import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { HistoryChange } from '@corpcal/shared/api/types';
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
import type { ActivityConfirmBlockedNoticeState } from '@/lib/activity-edit-session-messages';

import {
  ActivityConfirmHeaderBlockedNotice,
  ActivityConfirmPrimaryActionGroup,
} from './ActivityConfirmSubmitBlockedNotice';
import { ActivityFormChangesList } from './ActivityFormChangesList';
import { RenewPublicLastUpdatedField } from './RenewPublicLastUpdatedField';

export type ActivitySaveConfirmPayload = {
  notes?: string;
  renewPublicLastUpdated?: boolean;
};

interface EditActivityConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changes: HistoryChange[];
  onConfirm: (value: ActivitySaveConfirmPayload) => void;
  isSubmitting: boolean;
  confirmDisabled?: boolean;
  confirmBlockedNotice?: ActivityConfirmBlockedNoticeState;
}

export function EditActivityConfirmModal({
  open,
  onOpenChange,
  changes,
  onConfirm,
  isSubmitting,
  confirmDisabled = false,
  confirmBlockedNotice = {
    headerBlockedMessage: null,
    connectionFooterMessage: null,
  },
}: EditActivityConfirmModalProps) {
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Updating {changes.length} field{changes.length !== 1 ? 's' : ''}
          </DialogTitle>
          <DialogDescription>
            Review your changes before saving.
          </DialogDescription>
        </DialogHeader>

        <ActivityConfirmHeaderBlockedNotice
          headerBlockedMessage={confirmBlockedNotice.headerBlockedMessage}
        />

        <div className="max-h-[60vh] overflow-y-auto">
          <ActivityFormChangesList
            key={open ? 'edit-confirm-open' : 'edit-confirm-closed'}
            changes={changes}
          />

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-confirm-notes">Add a note (optional)</Label>
              <Textarea
                id="edit-confirm-notes"
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
              id="edit-confirm-renew-public"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Return to edit
          </Button>
          <ActivityConfirmPrimaryActionGroup
            connectionFooterMessage={
              confirmBlockedNotice.connectionFooterMessage
            }
          >
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting || confirmDisabled}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Updating...
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
