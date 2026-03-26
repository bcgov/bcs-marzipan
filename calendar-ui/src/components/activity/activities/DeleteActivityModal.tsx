import { OctagonAlertIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 1000;

interface DeleteActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityId: number;
  displayId: string;
  onSoftDelete: (reason: string) => void | Promise<void>;
  onHardDelete: (reason: string) => void | Promise<void>;
  isSubmitting: boolean;
  /** When provided, pre-populates the notes field when the modal opens (e.g. from Delete requested history). */
  initialNotes?: string;
}

export function DeleteActivityModal({
  open,
  onOpenChange,
  activityId: _activityId,
  displayId,
  onSoftDelete,
  onHardDelete,
  isSubmitting,
  initialNotes,
}: DeleteActivityModalProps): React.ReactElement {
  const [notes, setNotes] = useState('');
  const [deletePermanently, setDeletePermanently] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [touched, setTouched] = useState(false);

  const requiredConfirmPhrase = `Delete ${displayId}`;
  const trimmedNotes = notes.trim();
  const notesValid =
    trimmedNotes.length >= MIN_REASON_LENGTH &&
    trimmedNotes.length <= MAX_REASON_LENGTH;
  const confirmPhraseMatch = confirmPhrase.trim() === requiredConfirmPhrase;
  const canConfirmSoft = notesValid;
  const canConfirmHard = notesValid && deletePermanently && confirmPhraseMatch;
  const canConfirm = deletePermanently ? canConfirmHard : canConfirmSoft;
  const showNotesError = touched && trimmedNotes.length > 0 && !notesValid;

  useEffect(() => {
    if (open) {
      setNotes(initialNotes ?? '');
      setDeletePermanently(false);
      setConfirmPhrase('');
      setTouched(false);
    }
  }, [open, initialNotes]);

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setNotes('');
      setDeletePermanently(false);
      setConfirmPhrase('');
      setTouched(false);
    }
    onOpenChange(value);
  };

  const handleConfirm = () => {
    setTouched(true);
    if (!canConfirm) return;
    if (deletePermanently) {
      void onHardDelete(trimmedNotes);
    } else {
      void onSoftDelete(trimmedNotes);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="pb-4">
            Delete activity {displayId}
          </DialogTitle>
          <DialogDescription>
            Soft delete marks the activity as deleted but keeps the record.
            Permanently delete removes it from the database. Both require a
            reason (at least {MIN_REASON_LENGTH} characters).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="delete-activity-notes">
              Add a note (required) <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="delete-activity-notes"
              placeholder="Give additional context about your changes."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => setTouched(true)}
              rows={3}
              maxLength={MAX_REASON_LENGTH}
              className={showNotesError ? 'border-destructive' : ''}
            />
            {showNotesError && (
              <p className="text-destructive text-sm">
                Note must be between {MIN_REASON_LENGTH} and {MAX_REASON_LENGTH}{' '}
                characters.
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              {trimmedNotes.length} / {MAX_REASON_LENGTH}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="delete-permanently"
              checked={deletePermanently}
              onCheckedChange={(checked) =>
                setDeletePermanently(checked === true)
              }
            />
            <Label
              htmlFor="delete-permanently"
              className="cursor-pointer text-sm font-normal"
            >
              Delete completely
            </Label>
          </div>

          <div
            className="grid transition-[grid-template-rows] duration-200 ease-out"
            style={{ gridTemplateRows: deletePermanently ? '1fr' : '0fr' }}
          >
            <div
              className="min-h-0 overflow-hidden"
              aria-hidden={!deletePermanently}
            >
              <div className="border-border bg-muted/30 space-y-3 rounded-md border p-3">
                <p className="text-sm">
                  <span className="inline-flex items-center gap-2">
                    <OctagonAlertIcon className="text-destructive h-4 w-4" />
                    <strong>
                      Deleting an activity completely is permanent is a
                      non-reversible.
                    </strong>{' '}
                  </span>
                  <br />
                  <br />
                  All details of the activity will be removed from the calendar.
                  <br />
                  <br />A record of the deletion will be recorded. The record
                  will include your name, date and time of the deletion, the
                  activity ID, and your provided reason for the delete.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="delete-confirm-phrase">
                    To confirm, type &quot;Delete {displayId}&quot; below{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="delete-confirm-phrase"
                    type="text"
                    placeholder={requiredConfirmPhrase}
                    value={confirmPhrase}
                    onChange={(e) => setConfirmPhrase(e.target.value)}
                    className="font-mono"
                    aria-describedby="delete-confirm-description"
                  />
                  <p id="delete-confirm-description" className="sr-only">
                    Type exactly: {requiredConfirmPhrase}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Go back
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isSubmitting || !canConfirm}
          >
            {isSubmitting ? 'Deleting...' : 'Confirm delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
