import { useEffect, useState } from 'react';

import {
  canSelectHistoryAudience,
  hasHistoryAudienceInternalPermission,
  hasHistoryAudiencePrivatePermission,
  resolveHistoryAudience,
  type HistoryAudience,
} from '@corpcal/shared';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type HistoryAudienceConfirmValue = {
  notes?: string;
  historyAudience?: HistoryAudience;
};

export type ReviewActivityConfirmPayload = HistoryAudienceConfirmValue & {
  markAsCompleted?: boolean;
  unassignMe?: boolean;
};

export function defaultHistoryAudienceForUser(
  permissions: string[]
): HistoryAudience {
  const resolved = resolveHistoryAudience(undefined, permissions);
  return resolved.ok ? resolved.audience : 'public';
}

/** Resets audience to the server default whenever a confirm dialog opens. */
export function useHistoryAudienceWhenOpen(
  open: boolean,
  permissions: string[]
): [HistoryAudience, (value: HistoryAudience) => void] {
  const [historyAudience, setHistoryAudience] = useState<HistoryAudience>(() =>
    defaultHistoryAudienceForUser(permissions)
  );

  useEffect(() => {
    if (open) {
      setHistoryAudience(defaultHistoryAudienceForUser(permissions));
    }
  }, [open, permissions]);

  return [historyAudience, setHistoryAudience];
}

interface HistoryAudienceSelectorProps {
  permissions: string[];
  value: HistoryAudience;
  onChange: (value: HistoryAudience) => void;
  id?: string;
}

/** Shown when the user may save activity history as internal or private. */
export function HistoryAudienceSelector({
  permissions,
  value,
  onChange,
  id = 'history-audience',
}: HistoryAudienceSelectorProps) {
  if (!canSelectHistoryAudience(permissions)) {
    return null;
  }

  const canInternal = hasHistoryAudienceInternalPermission(permissions);
  const canPrivate = hasHistoryAudiencePrivatePermission(permissions);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>History visibility</Label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as HistoryAudience)}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Select audience" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="public">
            Public — visible to all viewers
          </SelectItem>
          {canInternal ? (
            <SelectItem value="internal">
              Internal — admins with internal history access
            </SelectItem>
          ) : null}
          {canPrivate ? (
            <SelectItem value="private">
              Private — only you (System Admin audit)
            </SelectItem>
          ) : null}
        </SelectContent>
      </Select>
    </div>
  );
}
