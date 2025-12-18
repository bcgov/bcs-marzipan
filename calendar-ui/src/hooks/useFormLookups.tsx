import { useQueries } from '@tanstack/react-query';
import {
  useCategories,
  useOrganizations,
  useUsers,
  useTags,
  usePitchStatuses,
  useSchedulingStatuses,
  useCommsMaterials,
  useTranslationLanguages,
  useGovernmentRepresentatives,
  useActivitiesForLookup,
} from './useLookups';

export interface FormLookupData {
  // Categories - for Badge components
  categories: Array<{ id: number; name: string; displayName?: string }>;

  // Organizations - for Select/Combobox
  organizations: Array<{ value: string; label: string }>;

  // Users - for Select/Combobox
  users: Array<{ value: string; label: string }>;

  // Tags - for Badge components
  tags: Array<{ id: string; text: string }>;

  // Pitch Statuses - for Select
  pitchStatuses: Array<{ id: number; name: string; displayName?: string }>;

  // Scheduling Statuses - for Select
  schedulingStatuses: Array<{ id: number; name: string; displayName?: string }>;

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

  // Related Activities - for Combobox
  relatedActivities: Array<{ value: string; label: string }>;

  // Loading state
  isLoading: boolean;

  // Error state
  hasError: boolean;
}

export function useFormLookups(): FormLookupData {
  const categoriesQuery = useCategories();
  const organizationsQuery = useOrganizations();
  const usersQuery = useUsers();
  const tagsQuery = useTags();
  const pitchStatusesQuery = usePitchStatuses();
  const schedulingStatusesQuery = useSchedulingStatuses();
  const commsMaterialsQuery = useCommsMaterials();
  const translationLanguagesQuery = useTranslationLanguages();
  const governmentRepresentativesQuery = useGovernmentRepresentatives();
  const activitiesQuery = useActivitiesForLookup();

  const isLoading =
    categoriesQuery.isLoading ||
    organizationsQuery.isLoading ||
    usersQuery.isLoading ||
    tagsQuery.isLoading ||
    pitchStatusesQuery.isLoading ||
    schedulingStatusesQuery.isLoading ||
    commsMaterialsQuery.isLoading ||
    translationLanguagesQuery.isLoading ||
    governmentRepresentativesQuery.isLoading ||
    activitiesQuery.isLoading;

  const hasError =
    categoriesQuery.isError ||
    organizationsQuery.isError ||
    usersQuery.isError ||
    tagsQuery.isError ||
    pitchStatusesQuery.isError ||
    schedulingStatusesQuery.isError ||
    commsMaterialsQuery.isError ||
    translationLanguagesQuery.isError ||
    governmentRepresentativesQuery.isError ||
    activitiesQuery.isError;

  // Transform categories for Badge components
  const categories =
    categoriesQuery.data?.map((item) => ({
      id: item.id as number,
      name: (item.name as string) || item.label,
      displayName: (item.displayName as string) || item.label,
    })) || [];

  // Transform organizations for Select/Combobox
  const organizations =
    organizationsQuery.data?.map((item) => ({
      value: item.value.toString(),
      label: item.label,
    })) || [];

  // Transform users for Select/Combobox
  const users =
    usersQuery.data?.map((item) => ({
      value: item.value.toString(),
      label: item.label,
    })) || [];

  // Transform tags for Badge components
  const tags =
    tagsQuery.data?.map((item) => ({
      id: item.id as string,
      text: (item.displayName as string) || (item.key as string) || item.label,
    })) || [];

  // Transform pitch statuses for Select
  const pitchStatuses =
    pitchStatusesQuery.data?.map((item) => ({
      id: item.id as number,
      name: (item.name as string) || item.label,
      displayName: (item.displayName as string) || item.label,
    })) || [];

  // Transform scheduling statuses for Select
  const schedulingStatuses =
    schedulingStatusesQuery.data?.map((item) => ({
      id: item.id as number,
      name: (item.name as string) || item.label,
      displayName: (item.displayName as string) || item.label,
    })) || [];

  // Transform comms materials for Badge components
  const commsMaterials =
    commsMaterialsQuery.data?.map((item) => ({
      id: item.id as number,
      name: (item.name as string) || item.label,
      displayName: (item.displayName as string) || item.label,
    })) || [];

  // Transform translation languages for Badge components
  const translationLanguages =
    translationLanguagesQuery.data?.map((item) => ({
      id: item.id as number,
      name: (item.name as string) || item.label,
      displayName: (item.displayName as string) || item.label,
    })) || [];

  // Transform government representatives for Badge components
  const governmentRepresentatives =
    governmentRepresentativesQuery.data?.map((item) => ({
      id: item.id as number,
      name: (item.name as string) || item.label,
      displayName: (item.displayName as string) || item.label,
      title: item.title as string | undefined,
    })) || [];

  // Transform related activities for Combobox
  const relatedActivities =
    activitiesQuery.data?.map((item) => ({
      value: item.value.toString(),
      label: item.label,
    })) || [];

  return {
    categories,
    organizations,
    users,
    tags,
    pitchStatuses,
    schedulingStatuses,
    commsMaterials,
    translationLanguages,
    governmentRepresentatives,
    relatedActivities,
    isLoading,
    hasError,
  };
}
