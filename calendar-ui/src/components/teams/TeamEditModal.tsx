import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useMemo, useState } from 'react';

import type { TeamDetail, TeamListItem } from '@corpcal/shared/api/types';
import { fetchMinistries } from '@/api/lookupsApi';
import { createTeam, fetchTeamById, updateTeam } from '@/api/teamsApi';
import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { lookupQueryKeys } from '@/lib/lookupQueryKeys';
import type { OptionItem } from '@/schemas/types';

interface TeamEditModalProps {
  /** When null, modal is in create mode. Otherwise edit mode for this team. */
  team: TeamListItem | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function TeamEditModal({
  team,
  open,
  onClose,
  onSaved,
}: TeamEditModalProps) {
  const isCreate = team === null;
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [ministryId, setMinistryId] = useState<string | null>(null);

  const { data: detail, isLoading: isLoadingDetail } =
    useQuery<TeamDetail | null>({
      queryKey: ['team', team?.id],
      queryFn: () => (team ? fetchTeamById(team.id) : Promise.resolve(null)),
      enabled: open && !!team?.id,
    });

  const { data: ministries = [] } = useQuery({
    queryKey: lookupQueryKeys.ministries(),
    queryFn: fetchMinistries,
    enabled: open,
  });

  const ministryOptions = useMemo(
    () =>
      ministries.map((m) => ({
        value: String(m.id),
        label: m.displayName ?? m.name ?? String(m.id),
      })),
    [ministries]
  );

  useEffect(() => {
    if (!open) return;
    if (isCreate) {
      setName('');
      setAbbreviation('');
      setDisplayName('');
      setDescription('');
      setIsActive(true);
      setMinistryId(null);
    } else if (detail) {
      setName(detail.name);
      setAbbreviation(detail.abbreviation);
      setDisplayName(detail.displayName ?? '');
      setDescription(detail.description ?? '');
      setIsActive(detail.isActive);
      setMinistryId(
        detail.ministryId != null ? String(detail.ministryId) : null
      );
    }
  }, [open, isCreate, detail]);

  const createMutation = useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: lookupQueryKeys.teams() });
      toast.success('Team created', { id: 'team-created' });
      onSaved();
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create team', {
        id: 'team-created',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: Parameters<typeof updateTeam>[1];
    }) => updateTeam(id, body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: lookupQueryKeys.teams() });
      toast.success('Team updated', { id: `team-updated-${variables.id}` });
      onSaved();
      onClose();
    },
    onError: (err: Error, variables) => {
      toast.error(err.message || 'Failed to update team', {
        id: variables ? `team-updated-${variables.id}` : undefined,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedAbbrev = abbreviation.trim().replace(/\s+/g, '');
    if (!trimmedName) {
      toast.error('Name is required', { id: 'team-edit-validation-name' });
      return;
    }
    if (!trimmedAbbrev) {
      toast.error('Abbreviation is required', {
        id: 'team-edit-validation-abbrev',
      });
      return;
    }
    if (isCreate) {
      createMutation.mutate({
        name: trimmedName,
        abbreviation: trimmedAbbrev,
        displayName: displayName.trim() || undefined,
        description: description.trim() || undefined,
        isActive,
        ministryId: ministryId != null ? parseInt(ministryId, 10) : undefined,
      });
    } else if (team) {
      updateMutation.mutate({
        id: team.id,
        body: {
          name: trimmedName,
          abbreviation: trimmedAbbrev,
          displayName: displayName.trim() || undefined,
          description: description.trim() || undefined,
          isActive,
          ministryId: ministryId != null ? parseInt(ministryId, 10) : null,
        },
      });
    }
  };

  const selectedMinistry = ministryId
    ? (ministryOptions.find((m) => m.value === ministryId) ?? null)
    : null;

  const isLoading = !isCreate && isLoadingDetail;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isCreate ? 'Create team' : 'Edit team'}</DialogTitle>
          <DialogDescription className="sr-only">
            {isCreate
              ? 'Enter details to create a new team.'
              : 'Edit team name, display name, description, and settings.'}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Name *</Label>
              <Input
                id="team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Team name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-abbreviation">Abbreviation *</Label>
              <Input
                id="team-abbreviation"
                value={abbreviation}
                onChange={(e) => setAbbreviation(e.target.value)}
                placeholder="e.g. MR"
                maxLength={5}
                required
                aria-describedby="team-abbreviation-hint"
              />
              <p
                id="team-abbreviation-hint"
                className="text-muted-foreground text-xs"
              >
                Short code (max 5 characters) used in activity IDs for
                non-ministry teams.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-display-name">Display name</Label>
              <Input
                id="team-display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Short or display name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-description">Description</Label>
              <Textarea
                id="team-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="team-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="team-active">Active</Label>
            </div>
            <div className="space-y-2">
              <Label>Ministry</Label>
              <Combobox
                items={ministryOptions}
                value={selectedMinistry}
                onValueChange={(option: OptionItem | null) =>
                  setMinistryId(option ? option.value : null)
                }
                itemToStringValue={(o: OptionItem) => o.label}
              >
                <ComboboxInput placeholder="Select ministry..." />
                <ComboboxContent>
                  <ComboboxEmpty>No ministries found.</ComboboxEmpty>
                  <ComboboxList>
                    {(option: OptionItem) => (
                      <ComboboxItem key={option.value} value={option}>
                        {option.label}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isCreate ? 'Create' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
