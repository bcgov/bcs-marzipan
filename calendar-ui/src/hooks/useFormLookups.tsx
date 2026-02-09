import {
  useCategories,
  useOrganizations,
  useUsers,
  useTags,
  usePitchStatuses,
  useActivityStatuses,
  useCommsMaterials,
  useTranslationLanguages,
  useGovernmentRepresentatives,
  useEventPlanners,
  useNewsReleaseDistributions,
  usePremierRequested,
  useNewsReleaseOrigins,
  useMinistries,
} from './useLookups';

export interface FormLookupData {
  // Categories - for Badge components
  categories: Array<{
    id: number;
    name: string;
    displayName?: string;
    allowsPitch: boolean;
  }>;

  // Organizations - for Select/Combobox
  organizations: Array<{ value: string; label: string }>;

  // Ministries - for Select
  ministries: Array<{ id: string; name: string; displayName?: string }>;

  // Users - for Select/Combobox
  users: Array<{ value: string; label: string }>;

  // Event Planners - for Select/Combobox
  eventPlanners: Array<{ value: string; label: string }>;

  // Tags - for Badge components
  tags: Array<{ id: number; text: string }>;

  // Pitch Statuses - for Select
  pitchStatuses: Array<{ id: number; name: string; displayName?: string }>;

  // Activity Statuses - for Select
  activityStatuses: Array<{ id: number; name: string; displayName?: string }>;

  // Comms Materials - for Badge components
  commsMaterials: Array<{ id: number; name: string; displayName?: string }>;

  // Translation Languages - for Badge components
  translationLanguages: Array<{
    id: number;
    name: string;
    displayName?: string;
  }>;

  // Government Representatives - for Badge components
  governmentRepresentatives: Array<{
    id: number;
    name: string;
    displayName?: string;
    title?: string;
  }>;

  // News Release Distributions - for Select
  newsReleaseDistributions: Array<{ value: string; label: string }>;

  // Premier Requested - for Select
  premierRequested: Array<{ value: string; label: string }>;

  // News Release Origins - for Select
  newsReleaseOrigins: Array<{ value: string; label: string }>;

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
    newsReleaseOriginsQuery.isLoading;

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
    newsReleaseOriginsQuery.isError;

  // Transform categories for Badge components
  const categories =
    categoriesQuery.data?.map((item) => ({
      id: item.id,
      name: item.name || item.label,
      displayName: (item.displayName as string) || item.label,
      allowsPitch: item.allowsPitch ?? false,
    })) || [];

  // Transform organizations for Select/Combobox (UUIDs are strings)
  const organizations =
    organizationsQuery.data?.map((item) => ({
      value: item.value,
      label: item.label,
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
      text: (item.displayName as string) || item.name || item.label,
    })) || [];

  // Transform pitch statuses for Select
  const pitchStatuses =
    pitchStatusesQuery.data?.map((item) => ({
      id: item.id,
      name: item.name || item.label,
      displayName: (item.displayName as string) || item.label,
    })) || [];

  // Transform activity statuses for Select
  const activityStatuses =
    activityStatusesQuery.data?.map((item) => ({
      id: item.id,
      name: item.name || item.label,
      displayName: (item.displayName as string) || item.label,
    })) || [];

  // Transform comms materials for Badge components
  const commsMaterials =
    commsMaterialsQuery.data?.map((item) => ({
      id: item.id,
      name: item.name || item.label,
      displayName: (item.displayName as string) || item.label,
    })) || [];

  // Transform translation languages for Badge components
  const translationLanguages =
    translationLanguagesQuery.data?.map((item) => ({
      id: item.id,
      name: item.name || item.label,
      displayName: (item.displayName as string) || item.label,
    })) || [];

  // Transform government representatives for Badge components
  const governmentRepresentatives =
    governmentRepresentativesQuery.data?.map((item) => ({
      id: item.id,
      name: item.name || item.label,
      displayName: (item.displayName as string) || item.label,
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

  return {
    categories: categories as Array<{
      id: number;
      name: string;
      displayName?: string;
      allowsPitch: boolean;
    }>,
    organizations,
    ministries,
    users,
    eventPlanners,
    tags: tags as Array<{ id: number; text: string }>,
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
    isLoading,
    hasError,
  };
}
