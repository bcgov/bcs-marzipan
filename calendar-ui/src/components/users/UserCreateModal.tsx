import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UserCreateModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal for the "Add user" flow. User creation is not yet supported by the API;
 * users are added when they first sign in. This modal explains that and can be
 * extended when a create-user endpoint is available.
 */
export function UserCreateModal({ open, onClose }: UserCreateModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600">
          User creation is not yet available. Users are added to the system when
          they first sign in to the application.
        </p>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
