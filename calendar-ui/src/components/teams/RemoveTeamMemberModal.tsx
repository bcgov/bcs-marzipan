import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RemovableTeamMember {
  userId: number;
  userName: string;
  adEmail?: string | null;
}

interface RemoveTeamMemberModalProps {
  open: boolean;
  teamId: number;
  teamName: string;
  member: RemovableTeamMember | null;
  onClose: () => void;
  onRemoved: () => void;
}

export default function RemoveTeamMemberModal({
  open,
  onClose,
}: RemoveTeamMemberModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove team member</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-500">Coming soon.</p>
      </DialogContent>
    </Dialog>
  );
}
