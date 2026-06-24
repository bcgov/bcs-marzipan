import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AddTeamMemberModalProps {
  open: boolean;
  teamId: number;
  existingMemberIds: number[];
  onClose: () => void;
  onAdded: () => void;
}

export default function AddTeamMemberModal({
  open,
  onClose,
}: AddTeamMemberModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add team member</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-500">Coming soon.</p>
      </DialogContent>
    </Dialog>
  );
}
