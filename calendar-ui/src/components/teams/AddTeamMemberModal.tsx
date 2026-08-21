import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import type { UserListItem } from '@corpcal/shared/api/types';
import { USER_NOTES_MAX_LENGTH } from '@corpcal/shared/schemas';
import { addUserToTeam, fetchUsers } from '@/api/usersApi';
import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { invalidateUserCaches } from '@/lib/userQueryKeys';

interface AddTeamMemberModalProps {
  open: boolean;
  teamId: number;
  existingMemberIds: number[];
  onClose: () => void;
  onAdded: () => void;
}

export function AddTeamMemberModal({
  open,
  teamId,
  existingMemberIds,
  onClose,
  onAdded,
}: AddTeamMemberModalProps) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserListItem[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const comboboxAnchorRef = useComboboxAnchor();
  const dialogContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setUsers([]);
      setSelectedUsers([]);
      setNotes('');
      setIsSubmitting(false);
      return;
    }
    let active = true;
    void fetchUsers({ search })
      .then((res) => {
        if (active) setUsers(res);
      })
      .catch(() => {
        if (active) setUsers([]);
      });
    return () => {
      active = false;
    };
  }, [open, search]);

  const available = useMemo(
    () => users.filter((u) => u.isActive && !existingMemberIds.includes(u.id)),
    [users, existingMemberIds]
  );

  const handleConfirm = async () => {
    if (!selectedUsers || selectedUsers.length === 0) return;
    try {
      setIsSubmitting(true);
      const promises = selectedUsers.map((u) =>
        addUserToTeam(u.id, {
          teamId,
          role: 'member',
          notes: notes || undefined,
        })
      );
      const results = await Promise.allSettled(promises);
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.length - succeeded;
      if (succeeded > 0) {
        toast.success(`${succeeded} member${succeeded > 1 ? 's' : ''} added`, {
          id: `team-member-added-${teamId}`,
        });
      }
      if (failed > 0) {
        toast.error(`${failed} failed to add`, {
          id: `team-member-add-failed-${teamId}`,
        });
      }
      void qc.invalidateQueries({ queryKey: ['team', teamId] });
      for (const [index, result] of results.entries()) {
        if (result.status !== 'fulfilled') continue;
        invalidateUserCaches(qc, selectedUsers[index].id);
      }
      onAdded();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add members');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent ref={dialogContentRef} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add team members</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>
              User{' '}
              <span className="text-required-field-indicator font-semibold">
                *
              </span>
            </Label>

            <Combobox
              items={available}
              multiple
              value={selectedUsers}
              onValueChange={(v: UserListItem[]) => setSelectedUsers(v)}
              itemToStringValue={(u: UserListItem) =>
                `${u.adDisplayName} ${u.adEmail ?? ''}`
              }
            >
              <ComboboxChips ref={comboboxAnchorRef} className="w-full">
                <ComboboxValue>
                  {(values: UserListItem[]) => (
                    <>
                      {values.map((option) => (
                        <ComboboxChip key={option.id}>
                          {option.adDisplayName}
                        </ComboboxChip>
                      ))}
                      <ComboboxChipsInput
                        placeholder="Select users..."
                        onChange={(e: any) => setSearch(e.target.value)}
                      />
                    </>
                  )}
                </ComboboxValue>
              </ComboboxChips>

              <ComboboxContent
                anchor={comboboxAnchorRef}
                container={dialogContentRef}
              >
                <ComboboxList>
                  {(u: UserListItem) => (
                    <ComboboxItem key={u.id} value={u}>
                      <div className="flex flex-col">
                        <div className="font-medium">{u.adDisplayName}</div>
                        <div className="text-sm text-slate-500">
                          {u.adEmail}
                        </div>
                      </div>
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>

              {/* Use only the chips input for searching/typing when multiple selection is enabled. */}
            </Combobox>
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Add notes (optional)"
              rows={4}
              value={notes}
              maxLength={USER_NOTES_MAX_LENGTH}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleConfirm()}
            disabled={selectedUsers.length === 0 || isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddTeamMemberModal;
