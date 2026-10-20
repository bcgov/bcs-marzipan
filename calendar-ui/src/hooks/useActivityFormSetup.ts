import { zodResolver } from '@hookform/resolvers/zod';
import {
  useForm,
  useWatch,
  type Resolver,
  type UseFormReturn,
} from 'react-hook-form';
import { useEffect, useMemo } from 'react';

import { TBD_LOOKUP_NAME } from '@corpcal/shared';
import type {
  CommsContactCandidate,
  TeamListItem,
} from '@corpcal/shared/api/types';
import {
  createActivityRequestSchemaWithLookups,
  type ActivityFormData,
} from '@corpcal/shared/schemas';
import type { ActivitySchedulingLookupResolvers } from '@corpcal/shared/validation';

import { getDefaultFormValues } from '../lib/activity-form-defaults';
import { useCommsContactCandidates } from './useCommsContactCandidates';
import { useCommsContactSync } from './useCommsContactSync';
import { useFormLookups, type FormLookupData } from './useFormLookups';
import { useLeadTeamOptions } from './useLeadTeamOptions';

function resolveTbdStatusId<
  T extends { id: number; name: string; displayName: string },
>(statuses: T[]): number | undefined {
  return statuses.find((s) => s.name === TBD_LOOKUP_NAME)?.id;
}

function buildSchedulingResolvers(
  lookups: FormLookupData
): ActivitySchedulingLookupResolvers {
  return {
    dateStatusNameForId: (id) =>
      lookups.dateStatuses.find((s) => s.id === id)?.name,
    timeStatusNameForId: (id) =>
      lookups.timeStatuses.find((s) => s.id === id)?.name,
    pitchRequiredStatusNameForId: (id) =>
      lookups.pitchRequiredStatuses.find((s) => s.id === id)?.name,
  };
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

  const schedulingResolvers = useMemo(
    () => buildSchedulingResolvers(lookups),
    [lookups]
  );

  const formSchema = useMemo(
    () => createActivityRequestSchemaWithLookups(schedulingResolvers),
    [schedulingResolvers]
  );

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(formSchema) as Resolver<ActivityFormData>,
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

    const resolvedStatusId = resolveTbdStatusId(lookups.dateStatuses);
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

    const resolvedStatusId = resolveTbdStatusId(lookups.timeStatuses);
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
