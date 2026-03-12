import { useMemo, useState } from 'react';

import type { HistoryChange } from '@corpcal/shared/api/types';
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
import {
  formatHistoryFieldValue,
  getHistoryFieldLabel,
  type StatusLookupMap,
} from '@/lib/activity-history-format';

const INITIAL_VISIBLE_CHANGES = 5;

interface EditActivityConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changes: HistoryChange[];
  dateStatuses?: Array<{ id: string | number; label: string }>;
  onConfirm: (notes?: string, markAsReviewed?: boolean) => void;
  isSubmitting: boolean;
  /** When true, show "Mark as reviewed" checkbox (admin/sysAdmin only). */
  showMarkAsReviewed?: boolean;
}

export function EditActivityConfirmModal({
  open,
  onOpenChange,
  changes,
  dateStatuses,
  onConfirm,
  isSubmitting,
  showMarkAsReviewed = false,
}: EditActivityConfirmModalProps) {
  const [notes, setNotes] = useState('');
  const [markAsReviewed, setMarkAsReviewed] = useState(true);
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
    onConfirm(
      notes.trim() || undefined,
      showMarkAsReviewed ? markAsReviewed : undefined
    );
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setNotes('');
      setMarkAsReviewed(true);
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

          {showMarkAsReviewed && (
            <div className="mt-4 flex items-center space-x-2">
              <Checkbox
                id="edit-confirm-mark-reviewed"
                checked={markAsReviewed}
                onCheckedChange={(checked) =>
                  setMarkAsReviewed(checked === true)
                }
              />
              <Label
                htmlFor="edit-confirm-mark-reviewed"
                className="cursor-pointer text-sm font-normal"
              >
                Mark as reviewed
              </Label>
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
