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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { ActivityFormChangesList } from './ActivityFormChangesList';

interface EditActivityConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changes: HistoryChange[];
  dateStatuses?: Array<{ id: string | number; label: string }>;
  venueStatuses?: Array<{
    id: number;
    name: string;
    displayName?: string;
  }>;
  onConfirm: (notes?: string) => void;
  isSubmitting: boolean;
}

export function EditActivityConfirmModal({
  open,
  onOpenChange,
  changes,
  dateStatuses,
  venueStatuses,
  onConfirm,
  isSubmitting,
}: EditActivityConfirmModalProps) {
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
            dateStatuses={dateStatuses}
            venueStatuses={venueStatuses}
          />

          <div className="mt-4 space-y-2">
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
