import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { TeamDetail, TeamListItem } from '@corpcal/shared/api/types';
import { ApiError } from '@/api/errors';
import { fetchMinistries } from '@/api/lookupsApi';
import {
  createTeam,
  fetchTeamById,
  fetchTeamsList,
  updateTeam,
} from '@/api/teamsApi';
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
import { InfoIconButton } from '@/components/ui/info-icon-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  const [abbreviation, setAbbreviation] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [abbrevManuallyEdited, setAbbrevManuallyEdited] = useState(false);
  const [hasServerAbbreviationConflict, setHasServerAbbreviationConflict] =
    useState(false);
  const [isActive, setIsActive] = useState(true);
  const [ministryId, setMinistryId] = useState<string | null>(null);

  const isDuplicateAbbreviationError = (error: unknown): boolean => {
    return (
      error instanceof ApiError &&
      error.status === 409 &&
      error.detail.toLowerCase().includes('abbreviation')
    );
  };

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

  const { data: allTeams = [] } = useQuery<TeamListItem[]>({
    queryKey: lookupQueryKeys.teamsList(true),
    queryFn: () => fetchTeamsList(false),
    enabled: open,
    staleTime: 30_000,
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
      setAbbreviation('');
      setDisplayName('');
      setDescription('');
      setHasServerAbbreviationConflict(false);
      setIsActive(true);
      setMinistryId(null);
      setAbbrevManuallyEdited(false);
    } else if (detail) {
      setAbbreviation(detail.abbreviation);
      setDisplayName(detail.displayName ?? '');
      setDescription(detail.description ?? '');
      setHasServerAbbreviationConflict(false);
      setIsActive(detail.isActive);
      setMinistryId(
        detail.ministryId != null ? String(detail.ministryId) : null
      );
      setAbbrevManuallyEdited(false);
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
    onError: (err: unknown) => {
      if (isDuplicateAbbreviationError(err)) {
        setHasServerAbbreviationConflict(true);
        return;
      }
      const message =
        err instanceof ApiError ? err.detail : 'Failed to create team';
      toast.error(message, { id: 'team-created' });
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
    onError: (err: unknown, variables) => {
      if (isDuplicateAbbreviationError(err)) {
        setHasServerAbbreviationConflict(true);
        return;
      }
      const message =
        err instanceof ApiError ? err.detail : 'Failed to update team';
      toast.error(message, {
        id: variables ? `team-updated-${variables.id}` : undefined,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDisplay = displayName.trim();
    const trimmedAbbrev = abbreviation.trim().replace(/\s+/g, '');
    const missingFields: string[] = [];
    if (!trimmedDisplay) missingFields.push('Name');
    if (!trimmedAbbrev) missingFields.push('Abbreviation');

    if (missingFields.length > 0) {
      const detail = `Required fields missing: ${missingFields.join(', ')}`;
      toast.error('Submission failed', { description: detail, duration: 6000 });
      return;
    }
    if (hasAbbreviationConflict) {
      toast.error('Submission failed', {
        description: 'Abbreviation must be unique across all teams.',
        duration: 6000,
      });
      return;
    }
    if (isCreate) {
      const nameForCreate = trimmedDisplay;
      createMutation.mutate({
        name: nameForCreate,
        abbreviation: trimmedAbbrev,
        displayName: trimmedDisplay || undefined,
        description: description.trim() || undefined,
        isActive,
        ministryId: ministryId != null ? parseInt(ministryId, 10) : undefined,
      });
    } else if (team) {
      const nameForUpdate = trimmedDisplay;
      updateMutation.mutate({
        id: team.id,
        body: {
          name: nameForUpdate,
          abbreviation: trimmedAbbrev,
          displayName: trimmedDisplay || undefined,
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
  const displayValid = displayName.trim().length > 0;
  const normalizedAbbreviation = abbreviation
    .trim()
    .replace(/\s+/g, '')
    .toLowerCase();
  const abbreviationValid = normalizedAbbreviation.length > 0;
  const abbreviationConflict =
    abbreviationValid &&
    allTeams.some((existingTeam) => {
      const existingAbbreviation =
        existingTeam.abbreviation?.trim().toLowerCase() ?? '';
      if (!existingAbbreviation) return false;
      if (team && existingTeam.id === team.id) return false;
      return existingAbbreviation === normalizedAbbreviation;
    });
  const hasAbbreviationConflict =
    abbreviationConflict || hasServerAbbreviationConflict;
  const isFormValid =
    displayValid && abbreviationValid && !hasAbbreviationConflict;
  const dialogContentRef = useRef<HTMLDivElement | null>(null);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        ref={dialogContentRef}
        className="max-h-[90vh] max-w-lg overflow-x-hidden overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{isCreate ? 'Add team' : 'Edit team'}</DialogTitle>
          <DialogDescription className="sr-only">
            {isCreate
              ? 'Enter details to create a new team.'
              : 'Edit team name, display name, and settings.'}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-display-name">
                Name{' '}
                <span
                  className="text-required-field-indicator font-semibold"
                  aria-hidden
                >
                  *
                </span>
              </Label>
              <Input
                id="team-display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Short or display name"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="team-ministry">Ministry</Label>
                <InfoIconButton aria-label="Ministry is optional" />
              </div>
              <Combobox
                items={ministryOptions}
                value={selectedMinistry}
                onValueChange={(option: OptionItem | null) => {
                  const newId = option ? option.value : null;
                  setMinistryId(newId);
                  // auto-fill abbreviation from ministry unless user edited it
                  if (newId) {
                    const m = ministries.find((mm) => String(mm.id) === newId);
                    const abb = m?.abbreviation ? String(m.abbreviation) : '';
                    if (!abbrevManuallyEdited || !abbreviation) {
                      setHasServerAbbreviationConflict(false);
                      setAbbreviation(abb);
                    }
                  }
                }}
                itemToStringValue={(o: OptionItem) => o.label}
              >
                <ComboboxInput
                  id="team-ministry"
                  placeholder="Select ministry..."
                />
                <ComboboxContent container={dialogContentRef}>
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
            <div className="space-y-2">
              <Label htmlFor="team-abbreviation">
                Abbreviation{' '}
                <span
                  className="text-required-field-indicator font-semibold"
                  aria-hidden
                >
                  *
                </span>
              </Label>
              <Input
                id="team-abbreviation"
                value={abbreviation}
                onChange={(e) => {
                  setHasServerAbbreviationConflict(false);
                  setAbbreviation(e.target.value);
                  setAbbrevManuallyEdited(true);
                }}
                placeholder="e.g. MR"
                maxLength={6}
                required
                aria-describedby="team-abbreviation-hint"
              />
              <p
                id="team-abbreviation-hint"
                className="text-muted-foreground text-xs"
              >
                Short code (max 6 characters) used in activity IDs for
                non-ministry teams.
              </p>
              {hasAbbreviationConflict ? (
                <p className="text-destructive text-xs">
                  Abbreviation is already used by another team.
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-description">Description</Label>
              <Input
                id="team-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={!isFormValid ? 'cursor-not-allowed' : undefined}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isCreate ? 'Create' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
