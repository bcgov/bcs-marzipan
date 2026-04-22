import { useMemo } from 'react';

import type {
  DateStatusLookupItem,
  PitchRequiredStatusLookupItem,
  TimeStatusLookupItem,
  TranslationRequiredStatusLookupItem,
  VenueStatusLookupItem,
} from '@corpcal/shared/api/types';
import type { OptionItem } from '@/schemas/types';

import {
  useActivityStatuses,
  useCategories,
  useCommsMaterials,
  useDateStatuses,
  useEventPlanners,
  useGovernmentRepresentatives,
  useMinistries,
  useNewsReleaseDistributions,
  useNewsReleaseOrigins,
  useOrganizations,
  usePitchRequiredStatuses,
  usePitchStatuses,
  usePremierRequested,
  useTags,
  useTeams,
  useTimeStatuses,
  useTranslationLanguages,
  useTranslationRequiredStatuses,
  useUsers,
  useVenueStatuses,
} from './useLookups';

export interface FormLookupData {
  // Categories - for Badge components
  categories: Array<{
    id: number;
    name: string;
    displayName?: string;
    visibility?: string;
  }>;

  // Organizations - for Select/Combobox (id is number; coerce to string where UI requires). ministryId used for Lead Org sync from Lead Team.
  organizations: Array<{
    value: number;
    label: string;
    ministryId?: number | null;
  }>;

  // Ministries - for Select (id is number; coerce to string where UI requires)
  ministries: Array<{ id: number; name: string; displayName?: string }>;

  // Users - for Select/Combobox
  users: OptionItem[];

  // Event Planners - for Select/Combobox
  eventPlanners: OptionItem[];

  // Tags - for Badge components
  tags: Array<{ id: number; text: string; visibility: 'global' | 'team' }>;

  // Pitch Statuses - for Select
  pitchStatuses: Array<{ id: number; name: string; displayName?: string }>;

  // Activity Statuses - for Select
  activityStatuses: Array<{ id: number; name: string; displayName?: string }>;

  // Comms Materials - for Badge components
  commsMaterials: Array<{ id: number; name: string; displayName?: string }>;

  // Translation Languages - for Badge components (shortcode is an internal language code when set)
  translationLanguages: Array<{
    id: number;
    name: string;
    displayName?: string;
    shortcode?: string | null;
  }>;

  // Government Representatives - for Badge components
  governmentRepresentatives: Array<{
    id: number;
    name: string;
    displayName?: string;
    title?: string;
  }>;

  // News Release Distributions - for Select
  newsReleaseDistributions: OptionItem[];

  // Premier Requested - for Select
  premierRequested: OptionItem[];

  // News Release Origins - for Select
  newsReleaseOrigins: OptionItem[];

  // Teams - for Shared With resolution (name to id in mapper) and dropdown options
  sharedWithTeams: Array<{ id: number; name: string; displayName?: string }>;

  // Date Statuses - for Schedule section and confirm modals
  dateStatuses: DateStatusLookupItem[];

  // Time Statuses - for Schedule section and confirm modals
  timeStatuses: TimeStatusLookupItem[];

  // Venue Statuses - Event section (next to venue name)
  venueStatuses: VenueStatusLookupItem[];

  // Pitch Required Statuses - for Overview section
  pitchRequiredStatuses: PitchRequiredStatusLookupItem[];

  // Translation Required Statuses - for Comms section
  translationRequiredStatuses: TranslationRequiredStatusLookupItem[];

  // Loading state
  isLoading: boolean;

  // Error state
  hasError: boolean;
}

export function useFormLookups(): FormLookupData {
  const categoriesQuery = useCategories();
  const organizationsQuery = useOrganizations();
  const ministriesQuery = useMinistries();
  const usersQuery = useUsers();
  const eventPlannersQuery = useEventPlanners();
  const tagsQuery = useTags();
  const pitchStatusesQuery = usePitchStatuses();
  const activityStatusesQuery = useActivityStatuses();
  const commsMaterialsQuery = useCommsMaterials();
  const translationLanguagesQuery = useTranslationLanguages();
  const governmentRepresentativesQuery = useGovernmentRepresentatives();
  const newsReleaseDistributionsQuery = useNewsReleaseDistributions();
  const premierRequestedQuery = usePremierRequested();
  const newsReleaseOriginsQuery = useNewsReleaseOrigins();
  const teamsQuery = useTeams();
  const dateStatusesQuery = useDateStatuses();
  const timeStatusesQuery = useTimeStatuses();
  const venueStatusesQuery = useVenueStatuses();
  const pitchRequiredStatusesQuery = usePitchRequiredStatuses();
  const translationRequiredStatusesQuery = useTranslationRequiredStatuses();

  const isLoading =
    categoriesQuery.isLoading ||
    organizationsQuery.isLoading ||
    ministriesQuery.isLoading ||
    usersQuery.isLoading ||
    eventPlannersQuery.isLoading ||
    tagsQuery.isLoading ||
    pitchStatusesQuery.isLoading ||
    activityStatusesQuery.isLoading ||
    commsMaterialsQuery.isLoading ||
    translationLanguagesQuery.isLoading ||
    governmentRepresentativesQuery.isLoading ||
    newsReleaseDistributionsQuery.isLoading ||
    premierRequestedQuery.isLoading ||
    newsReleaseOriginsQuery.isLoading ||
    teamsQuery.isLoading ||
    dateStatusesQuery.isLoading ||
    timeStatusesQuery.isLoading ||
    venueStatusesQuery.isLoading ||
    pitchRequiredStatusesQuery.isLoading ||
    translationRequiredStatusesQuery.isLoading;

  const hasError =
    categoriesQuery.isError ||
    organizationsQuery.isError ||
    ministriesQuery.isError ||
    usersQuery.isError ||
    eventPlannersQuery.isError ||
    tagsQuery.isError ||
    pitchStatusesQuery.isError ||
    activityStatusesQuery.isError ||
    commsMaterialsQuery.isError ||
    translationLanguagesQuery.isError ||
    governmentRepresentativesQuery.isError ||
    newsReleaseDistributionsQuery.isError ||
    premierRequestedQuery.isError ||
    newsReleaseOriginsQuery.isError ||
    teamsQuery.isError ||
    dateStatusesQuery.isError ||
    timeStatusesQuery.isError ||
    venueStatusesQuery.isError ||
    pitchRequiredStatusesQuery.isError ||
    translationRequiredStatusesQuery.isError;

  // Memoized so consumers (e.g. ActivityPage hydration) only see a new
  // object when underlying query data changes, not on every parent re-render.
  return useMemo((): FormLookupData => {
    // Transform categories for Badge components
    const categories =
      categoriesQuery.data?.map((item) => ({
        id: item.id,
        name: item.name || item.label,
        displayName: item.displayName || item.label,
        visibility: item.visibility,
      })) || [];

    // Transform organizations for Select/Combobox (lookup ids are numbers). Include ministryId for Lead Team -> Lead Org sync.
    const organizations =
      organizationsQuery.data?.map((item) => ({
        value: item.value,
        label: item.label,
        ministryId: item.ministryId ?? undefined,
      })) || [];

    // Transform ministries for Select
    const ministries =
      ministriesQuery.data?.map((item) => ({
        id: item.id,
        name: item.label,
        displayName: item.displayName ?? undefined,
      })) || [];

    // Transform users for Select/Combobox (serial IDs need to be strings for Select components)
    const users =
      usersQuery.data?.map((item) => ({
        value: String(item.value),
        label: item.label,
      })) || [];

    // Transform event planners for Select/Combobox (serial IDs need to be strings for Select components)
    const eventPlanners =
      eventPlannersQuery.data?.map((item) => ({
        value: String(item.value),
        label: item.label,
      })) || [];

    // Transform tags for Badge components
    const tags =
      tagsQuery.data?.map((item) => ({
        id: item.id,
        text: item.displayName || item.name || item.label,
        visibility: item.visibility,
      })) || [];

    // Transform pitch statuses for Select
    const pitchStatuses =
      pitchStatusesQuery.data?.map((item) => ({
        id: item.id,
        name: item.name || item.label,
        displayName: item.displayName || item.label,
      })) || [];

    // Transform activity statuses for Select
    const activityStatuses =
      activityStatusesQuery.data?.map((item) => ({
        id: item.id,
        name: item.name || item.label,
        displayName: item.displayName || item.label,
      })) || [];

    // Transform comms materials for Badge components
    const commsMaterials =
      commsMaterialsQuery.data?.map((item) => ({
        id: item.id,
        name: item.name || item.label,
        displayName: item.displayName || item.label,
      })) || [];

    // Transform translation languages for Badge components
    const translationLanguages =
      translationLanguagesQuery.data?.map((item) => ({
        id: item.id,
        name: item.name || item.label,
        displayName: item.displayName || item.label,
        shortcode: item.shortcode ?? null,
      })) || [];

    // Transform government representatives for Badge components
    const governmentRepresentatives =
      governmentRepresentativesQuery.data?.map((item) => ({
        id: item.id,
        name: item.name || item.label,
        displayName: item.displayName || item.label,
        title: item.title as string | undefined,
      })) || [];

    // Transform news release distributions for Select (serial IDs need to be strings for Select components)
    const newsReleaseDistributions =
      newsReleaseDistributionsQuery.data?.map((item) => ({
        value: String(item.value),
        label: item.label,
      })) || [];

    // Transform premier requested for Select (serial IDs need to be strings for Select components)
    const premierRequested =
      premierRequestedQuery.data?.map((item) => ({
        value: String(item.value),
        label: item.label,
      })) || [];

    // Transform news release origins for Select (serial IDs need to be strings for Select components)
    const newsReleaseOrigins =
      newsReleaseOriginsQuery.data?.map((item) => ({
        value: String(item.value),
        label: item.label,
      })) || [];

    // Teams for Shared With dropdown and response->form mapping (name to id)
    const sharedWithTeams =
      teamsQuery.data?.map((t) => ({
        id: t.id,
        name: t.name,
        displayName: t.displayName ?? undefined,
      })) ?? [];

    return {
      categories: categories as Array<{
        id: number;
        name: string;
        displayName?: string;
        visibility?: string;
      }>,
      organizations,
      ministries,
      users,
      eventPlanners,
      tags: tags as Array<{
        id: number;
        text: string;
        visibility: 'global' | 'team';
      }>,
      pitchStatuses: pitchStatuses as Array<{
        id: number;
        name: string;
        displayName?: string;
      }>,
      activityStatuses: activityStatuses as Array<{
        id: number;
        name: string;
        displayName?: string;
      }>,
      commsMaterials: commsMaterials as Array<{
        id: number;
        name: string;
        displayName?: string;
      }>,
      translationLanguages: translationLanguages as Array<{
        id: number;
        name: string;
        displayName?: string;
        shortcode?: string | null;
      }>,
      governmentRepresentatives: governmentRepresentatives as Array<{
        id: number;
        name: string;
        displayName?: string;
        title?: string;
      }>,
      newsReleaseDistributions,
      premierRequested,
      newsReleaseOrigins,
      sharedWithTeams,
      dateStatuses: dateStatusesQuery.data ?? [],
      timeStatuses: timeStatusesQuery.data ?? [],
      venueStatuses: venueStatusesQuery.data ?? [],
      pitchRequiredStatuses: pitchRequiredStatusesQuery.data ?? [],
      translationRequiredStatuses: translationRequiredStatusesQuery.data ?? [],
      isLoading,
      hasError,
    };
  }, [
    activityStatusesQuery.data,
    categoriesQuery.data,
    commsMaterialsQuery.data,
    dateStatusesQuery.data,
    eventPlannersQuery.data,
    governmentRepresentativesQuery.data,
    hasError,
    isLoading,
    ministriesQuery.data,
    newsReleaseDistributionsQuery.data,
    newsReleaseOriginsQuery.data,
    organizationsQuery.data,
    pitchRequiredStatusesQuery.data,
    pitchStatusesQuery.data,
    premierRequestedQuery.data,
    tagsQuery.data,
    teamsQuery.data,
    timeStatusesQuery.data,
    venueStatusesQuery.data,
    translationLanguagesQuery.data,
    translationRequiredStatusesQuery.data,
    usersQuery.data,
  ]);
}
