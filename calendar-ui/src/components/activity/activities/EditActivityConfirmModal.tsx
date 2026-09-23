import { Loader2 } from 'lucide-react';
import { useState } from 'react';

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

import { ActivityFormChangesList } from './ActivityFormChangesList';
import { ActivityHistorySaveFields } from './ActivityHistorySaveFields';
import {
  useHistoryAudienceWhenOpen,
  type HistoryAudienceConfirmValue,
} from './HistoryAudienceSelector';

interface EditActivityConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changes: HistoryChange[];
  onConfirm: (value: HistoryAudienceConfirmValue) => void;
  isSubmitting: boolean;
  permissions: string[];
}

export function EditActivityConfirmModal({
  open,
  onOpenChange,
  changes,
  onConfirm,
  isSubmitting,
  permissions,
}: EditActivityConfirmModalProps) {
  const [notes, setNotes] = useState('');
  const [historyAudience, setHistoryAudience] = useHistoryAudienceWhenOpen(
    open,
    permissions
  );

  const handleConfirm = () => {
    onConfirm({
      notes: notes.trim() || undefined,
      historyAudience,
    });
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setNotes('');
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

        <div className="max-h-[60vh] overflow-y-auto">
          <ActivityFormChangesList
            key={open ? 'edit-confirm-open' : 'edit-confirm-closed'}
            changes={changes}
          />

          <div className="mt-4">
            <ActivityHistorySaveFields
              permissions={permissions}
              historyAudience={historyAudience}
              onHistoryAudienceChange={setHistoryAudience}
              notes={notes}
              onNotesChange={setNotes}
              idPrefix="edit-confirm"
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
          <Button type="button" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Updating...
              </>
            ) : (
              'Confirm'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
