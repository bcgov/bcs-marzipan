import type { ReactElement } from 'react';

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

type DiscardActivityChangesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changes: HistoryChange[];
  dateStatuses?: Array<{ id: string | number; label: string }>;
  venueStatuses?: Array<{
    id: number;
    name: string;
    displayName?: string;
  }>;
  onReturnToEdit: () => void;
  onDiscard: () => void;
  isDiscarding?: boolean;
};

export function DiscardActivityChangesDialog({
  open,
  onOpenChange,
  changes,
  dateStatuses,
  venueStatuses,
  onReturnToEdit,
  onDiscard,
  isDiscarding = false,
}: DiscardActivityChangesDialogProps): ReactElement {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Discard changes?</DialogTitle>
          <DialogDescription>
            The following changes will be lost if you discard them.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          <ActivityFormChangesList
            key={open ? 'discard-open' : 'discard-closed'}
            changes={changes}
            dateStatuses={dateStatuses}
            venueStatuses={venueStatuses}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onReturnToEdit}
            disabled={isDiscarding}
          >
            Return to edit
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onDiscard}
            disabled={isDiscarding}
          >
            Discard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
