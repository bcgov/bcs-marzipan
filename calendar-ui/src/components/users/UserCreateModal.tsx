import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCallback, useState } from 'react';

import type { CreateUserBody } from '@corpcal/shared/api/types';
import { createUser, fetchRoles, fetchTeams } from '@/api/usersApi';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

/**
 * Modal for the "Add user" flow. Creates a local user (email + role required)
 * so they can sign in with Azure AD; optional display name and initial teams.
 */
export function UserCreateModal({
  open,
  onClose,
  onSaved,
}: UserCreateModalProps) {
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState<string>('');
  const [displayName, setDisplayName] = useState('');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  const queryClient = useQueryClient();

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await fetchRoles();
      return res;
    },
    enabled: open,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: (body: CreateUserBody) => createUser(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created');
      onSaved?.();
      onClose();
      setEmail('');
      setRoleId('');
      setDisplayName('');
      setSelectedTeamIds([]);
    },
    onError: (err: Error & { response?: { status?: number } }) => {
      const status = err.response?.status;
      const message =
        status === 409
          ? 'A user with this email already exists.'
          : err.message || 'Create failed';
      toast.error(message);
    },
  });

  const handleTeamToggle = useCallback((value: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(value)
        ? prev.filter((id) => id !== value)
        : [...prev, value]
    );
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error('Email is required');
      return;
    }
    const parsedRoleId = parseInt(roleId, 10);
    if (Number.isNaN(parsedRoleId)) {
      toast.error('Role is required');
      return;
    }
    const body: CreateUserBody = {
      email: trimmedEmail,
      roleId: parsedRoleId,
      ...(displayName.trim() && { displayName: displayName.trim() }),
      ...(selectedTeamIds.length > 0 && {
        teams: selectedTeamIds.map((id) => ({
          teamId: parseInt(id, 10),
          role: 'member',
        })),
      }),
    };
    createMutation.mutate(body);
  };

  const teamOptions = teams.map((t) => ({
    value: String(t.id),
    label: t.displayName ?? t.name ?? `Team ${t.id}`,
  }));

  const selectedRole = roles.find((r) => String(r.id) === roleId);
  const roleDescription = selectedRole?.description?.trim();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>
            Create a new user. Users can sign in with their email and Microsoft
            account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-user-email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="create-user-email"
              type="email"
              required
              placeholder="user@example.gov.bc.ca"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-user-role">
              Role <span className="text-destructive">*</span>
            </Label>
            <Select value={roleId} onValueChange={setRoleId} required>
              <SelectTrigger id="create-user-role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {roleDescription && (
              <div className="bg-muted/50 text-muted-foreground rounded-md border px-3 py-2 text-sm">
                {roleDescription}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-user-display-name">Display name</Label>
            <Input
              id="create-user-display-name"
              type="text"
              placeholder="Optional"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Teams</Label>
            <Combobox
              options={teamOptions}
              selectedValues={selectedTeamIds}
              onSelect={handleTeamToggle}
              placeholder="Select teams..."
              searchPlaceholder="Search teams..."
              emptyMessage="No teams found."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create user
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
