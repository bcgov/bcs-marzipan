import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';

import type { CommsContactCandidate } from '@corpcal/shared/api/types';
import type { ActivityFormData } from '@corpcal/shared/schemas';

/**
 * Synchronises the commsContacts field with the current lead team's eligible
 * candidate set. On lead-team change: prunes invalid contacts and shows a
 * toast when contacts are removed. On create: pre-fills the current user as
 * lead when the field is empty and they are eligible.
 */
export function useCommsContactSync({
  form,
  candidates,
  userId,
  isCreate,
  /** Same value passed to `useCommsContactCandidates` — guards sync against stale `watch('leadTeamId')` when React Query updates. */
  candidatesTeamId,
}: {
  form: UseFormReturn<ActivityFormData>;
  candidates: CommsContactCandidate[] | undefined;
  userId: number | undefined;
  isCreate: boolean;
  candidatesTeamId: number | undefined;
}) {
  const prevLeadTeamRef = useRef<number | undefined>(undefined);
  const didPrefillRef = useRef(false);

  useEffect(() => {
    const formLeadTeamId = form.getValues('leadTeamId');

    if (!candidates || candidatesTeamId == null || candidatesTeamId === 0)
      return;

    const eligibleIds = new Set(candidates.map((c) => c.id));

    const isInitialMount = prevLeadTeamRef.current === undefined;
    const teamChanged = prevLeadTeamRef.current !== formLeadTeamId;
    prevLeadTeamRef.current = formLeadTeamId;

    if (teamChanged && !isInitialMount) {
      const contacts = form.getValues('commsContacts') ?? [];
      const next = contacts.filter((c) => eligibleIds.has(c.userId));
      const removedCount = contacts.length - next.length;

      if (removedCount > 0) {
        if (next.length > 0 && !next.some((c) => c.isLead)) {
          next[0].isLead = true;
        }
        form.setValue('commsContacts', next, { shouldDirty: true });
        toast.info(
          `Removed ${removedCount} contact${removedCount > 1 ? 's' : ''} not on the selected lead team.`
        );
      }
    }

    if (isCreate && !didPrefillRef.current) {
      const contacts = form.getValues('commsContacts') ?? [];
      if (contacts.length === 0 && userId != null && eligibleIds.has(userId)) {
        form.setValue('commsContacts', [{ userId, isLead: true }], {
          shouldDirty: false,
        });
        didPrefillRef.current = true;
      }
    }
  }, [candidatesTeamId, candidates, form, userId, isCreate]);
}
