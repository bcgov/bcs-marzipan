import { useMemo, useState } from 'react';

import type { HistoryChange } from '@corpcal/shared/api/types';

import {
  formatHistoryFieldValue,
  getHistoryFieldLabel,
  type StatusLookupMap,
} from '../../lib/activity-history-format';
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

const INITIAL_VISIBLE_CHANGES = 5;

interface EditActivityConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changes: HistoryChange[];
  dateStatuses?: Array<{ id: string | number; label: string }>;
  onConfirm: (notes?: string) => void;
  isSubmitting: boolean;
}

export function EditActivityConfirmModal({
  open,
  onOpenChange,
  changes,
  dateStatuses,
  onConfirm,
  isSubmitting,
}: EditActivityConfirmModalProps) {
  const [notes, setNotes] = useState('');
  const [showAllChanges, setShowAllChanges] = useState(false);

  const dateStatusMap: StatusLookupMap = useMemo(() => {
    const map = new Map<number | string, string>();
    if (dateStatuses) {
      dateStatuses.forEach((status) => {
        map.set(status.id, status.label);
      });
    }
    return map;
  }, [dateStatuses]);

  const visibleChanges = showAllChanges
    ? changes
    : changes.slice(0, INITIAL_VISIBLE_CHANGES);
  const hiddenCount = changes.length - INITIAL_VISIBLE_CHANGES;

  const handleConfirm = () => {
    onConfirm(notes.trim() || undefined);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setNotes('');
      setShowAllChanges(false);
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
          {changes.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No changes detected.
            </p>
          ) : (
            <div className="space-y-2 pr-1">
              {visibleChanges.map((change, idx) => (
                <div key={idx} className="text-sm">
                  <strong className="font-medium">
                    {getHistoryFieldLabel(change.field)}:
                  </strong>{' '}
                  <span className="text-muted-foreground">
                    {formatHistoryFieldValue(
                      change.field,
                      change.oldValue,
                      dateStatusMap
                    )}
                  </span>{' '}
                  &rarr;{' '}
                  <span>
                    {formatHistoryFieldValue(
                      change.field,
                      change.newValue,
                      dateStatusMap
                    )}
                  </span>
                </div>
              ))}

              {!showAllChanges && hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllChanges(true)}
                  className="mt-2 cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  Show {hiddenCount} more change{hiddenCount !== 1 ? 's' : ''}
                </button>
              )}
              {showAllChanges && hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllChanges(false)}
                  className="mt-2 cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  Show less
                </button>
              )}
            </div>
          )}

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
            {isSubmitting ? 'Updating...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
