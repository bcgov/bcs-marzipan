import { zodResolver } from '@hookform/resolvers/zod';
import {
  useForm,
  useWatch,
  type Resolver,
  type UseFormReturn,
} from 'react-hook-form';
import { useEffect } from 'react';

import type {
  CommsContactCandidate,
  TeamListItem,
} from '@corpcal/shared/api/types';
import {
  createActivityRequestSchema,
  type ActivityFormData,
} from '@corpcal/shared/schemas';

import { getDefaultFormValues } from '../lib/activity-form-defaults';
import { useCommsContactCandidates } from './useCommsContactCandidates';
import { useCommsContactSync } from './useCommsContactSync';
import { useFormLookups, type FormLookupData } from './useFormLookups';
import { useLeadTeamOptions } from './useLeadTeamOptions';

const NOT_CONFIRMED_STATUS_NAME = 'not_confirmed';

function resolveNotConfirmedStatusId<
  T extends { id: number; name: string; displayName: string },
>(statuses: T[]): number | undefined {
  const notConfirmedByName = statuses.find(
    (s) => s.name === NOT_CONFIRMED_STATUS_NAME
  );
  return notConfirmedByName?.id;
}

export interface UseActivityFormSetupOptions {
  mode: 'create' | 'edit';
  leadTeamFetchEnabled: boolean;
  userId: number | undefined;
  userTeamIds?: number[];
  /** When true, comms candidates may be loaded for any lead team (mirrors activities.create.any). */
  hasCreateAny?: boolean;
}

export interface ActivityFormSetupResult {
  form: UseFormReturn<ActivityFormData>;
  lookups: FormLookupData;
  leadTeamOptions: TeamListItem[];
  leadTeamOptionsError: boolean;
  leadTeamOptionsFetching: boolean;
  refetchLeadTeamOptions: ReturnType<typeof useLeadTeamOptions>['refetch'];
  commsContactCandidates: CommsContactCandidate[] | undefined;
  watchedLeadTeamId: number | undefined;
}

/**
 * Shared form setup used by both ActivityPage (edit) and CreateActivityForm (create).
 * Owns: form instance, lookups, lead team options, comms candidates, comms sync,
 * and (on create) default status / lead team hydration.
 */
export function useActivityFormSetup({
  mode,
  leadTeamFetchEnabled,
  userId,
  userTeamIds,
  hasCreateAny = false,
}: UseActivityFormSetupOptions): ActivityFormSetupResult {
  const lookups = useFormLookups();

  const {
    data: leadTeamOptions = [],
    isError: leadTeamOptionsError,
    isFetching: leadTeamOptionsFetching,
    refetch: refetchLeadTeamOptions,
  } = useLeadTeamOptions(leadTeamFetchEnabled);

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(
      createActivityRequestSchema
    ) as Resolver<ActivityFormData>,
    mode: 'onChange',
    // Create/edit pages focus invalid fields in layout order via onError + form-utils.
    shouldFocusError: false,
    defaultValues: getDefaultFormValues(),
  });

  const watchedLeadTeamId = useWatch({
    control: form.control,
    name: 'leadTeamId',
  });
  const canFetchCommsForLeadTeam =
    hasCreateAny ||
    (watchedLeadTeamId != null &&
      watchedLeadTeamId > 0 &&
      (userTeamIds?.includes(watchedLeadTeamId) ?? false));
  const { data: commsContactCandidates } = useCommsContactCandidates(
    watchedLeadTeamId,
    canFetchCommsForLeadTeam
  );

  useCommsContactSync({
    form,
    candidates: commsContactCandidates,
    userId,
    isCreate: mode === 'create',
    candidatesTeamId: watchedLeadTeamId,
  });

  useEffect(() => {
    if (mode !== 'create') return;
    if (lookups.dateStatuses.length === 0) return;

    const resolvedStatusId = resolveNotConfirmedStatusId(lookups.dateStatuses);
    if (resolvedStatusId == null) return;

    const currentStatusId = form.getValues('dateStatusId');
    const { isDirty } = form.getFieldState('dateStatusId');

    if (
      currentStatusId == null ||
      (currentStatusId !== resolvedStatusId && !isDirty)
    ) {
      form.setValue('dateStatusId', resolvedStatusId, { shouldValidate: true });
    }
  }, [mode, lookups.dateStatuses, form]);

  useEffect(() => {
    if (mode !== 'create') return;
    if (lookups.timeStatuses.length === 0) return;

    const resolvedStatusId = resolveNotConfirmedStatusId(lookups.timeStatuses);
    if (resolvedStatusId == null) return;

    const currentStatusId = form.getValues('timeStatusId');
    const { isDirty } = form.getFieldState('timeStatusId');

    if (
      currentStatusId == null ||
      (currentStatusId !== resolvedStatusId && !isDirty)
    ) {
      form.setValue('timeStatusId', resolvedStatusId, { shouldValidate: true });
    }
  }, [mode, lookups.timeStatuses, form]);

  useEffect(() => {
    if (mode !== 'create') return;
    if (leadTeamOptions.length === 0 || lookups.organizations.length === 0)
      return;

    const currentLeadTeamId = form.getValues('leadTeamId');
    if (currentLeadTeamId != null && currentLeadTeamId !== 0) {
      const leadOrgId = form.getValues('leadOrgId');
      const leadOrgName = form.getValues('leadOrgName');
      const orgAlreadySet =
        (leadOrgId != null && leadOrgId !== 0) ||
        (leadOrgName != null && leadOrgName !== '');
      if (orgAlreadySet) return;

      const team = leadTeamOptions.find((t) => t.id === currentLeadTeamId);
      if (team?.ministryId) {
        const orgForMinistry = lookups.organizations.find(
          (o) => o.ministryId != null && o.ministryId === team.ministryId
        );
        if (orgForMinistry) {
          form.setValue('leadOrgId', orgForMinistry.value);
          form.setValue('leadOrgName', null);
        }
      }
      return;
    }

    const firstUserTeamId = userTeamIds?.[0];
    const defaultTeam =
      (firstUserTeamId != null &&
        leadTeamOptions.find((t) => t.id === firstUserTeamId)) ||
      leadTeamOptions[0];
    if (!defaultTeam) return;

    form.setValue('leadTeamId', defaultTeam.id);
    form.setValue('leadMinistryId', defaultTeam.ministryId ?? undefined);

    if (defaultTeam.ministryId) {
      const orgForMinistry = lookups.organizations.find(
        (o) => o.ministryId != null && o.ministryId === defaultTeam.ministryId
      );
      if (orgForMinistry) {
        form.setValue('leadOrgId', orgForMinistry.value);
        form.setValue('leadOrgName', null);
      }
    }
  }, [mode, leadTeamOptions, userTeamIds, lookups.organizations, form]);

  return {
    form,
    lookups,
    leadTeamOptions,
    leadTeamOptionsError,
    leadTeamOptionsFetching,
    refetchLeadTeamOptions,
    commsContactCandidates,
    watchedLeadTeamId,
  };
}
