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

import { ActivityHistorySaveFields } from './ActivityHistorySaveFields';
import {
  useHistoryAudienceWhenOpen,
  type HistoryAudienceConfirmValue,
} from './HistoryAudienceSelector';

interface CompleteActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDirty: boolean;
  isSubmitting: boolean;
  onConfirm: (value: HistoryAudienceConfirmValue) => void;
  displayId?: string;
  permissions: string[];
}

export function CompleteActivityModal({
  open,
  onOpenChange,
  isDirty,
  isSubmitting,
  onConfirm,
  displayId,
  permissions,
}: CompleteActivityModalProps) {
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

        {displayId != null && displayId.length > 0 && (
          <p className="text-muted-foreground text-sm">
            Activity:{' '}
            <span className="text-foreground font-medium">{displayId}</span>
          </p>
        )}

        <ActivityHistorySaveFields
          permissions={permissions}
          historyAudience={historyAudience}
          onHistoryAudienceChange={setHistoryAudience}
          notes={notes}
          onNotesChange={setNotes}
          idPrefix="complete-confirm"
          notesPlaceholder="Optional context for the activity history."
        />

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
              'Confirm'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
