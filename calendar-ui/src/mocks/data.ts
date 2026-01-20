import type {
  CategoryLookupItem,
  OrganizationLookupItem,
  UserLookupItem,
  TagLookupItem,
  PitchStatusLookupItem,
  CommsMaterialsLookupItem,
  TranslationLanguageLookupItem,
  GovernmentRepresentativeLookupItem,
  ActivityStatusLookupItem,
  CityLookupItem,
  MinistryLookupItem,
} from '@corpcal/shared/api/types';
import type { CreateActivityRequest } from '@corpcal/shared/schemas';

export const mockCategories: CategoryLookupItem[] = [
  { id: 1, value: 1, label: 'Event', name: 'Event', displayName: 'Event' },
  {
    id: 2,
    value: 2,
    label: 'News Release',
    name: 'News Release',
    displayName: 'News Release',
  },
  {
    id: 3,
    value: 3,
    label: 'Awareness',
    name: 'Awareness',
    displayName: 'Awareness',
  },
];

export const mockOrganizations: OrganizationLookupItem[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    value: '550e8400-e29b-41d4-a716-446655440000',
    label: 'Ministry of Health',
    name: 'Ministry of Health',
    displayName: 'Ministry of Health',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    value: '550e8400-e29b-41d4-a716-446655440001',
    label: 'Ministry of Finance',
    name: 'Ministry of Finance',
    displayName: 'Ministry of Finance',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    value: '550e8400-e29b-41d4-a716-446655440002',
    label: 'Ministry of Education',
    name: 'Ministry of Education',
    displayName: 'Ministry of Education',
  },
];

export const mockUsers: UserLookupItem[] = [
  {
    id: 1,
    value: 1,
    label: 'John Doe',
    name: 'John Doe',
    email: 'john.doe@example.com',
    username: 'jdoe',
  },
  {
    id: 2,
    value: 2,
    label: 'Jane Smith',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    username: 'jsmith',
  },
  {
    id: 8,
    value: 8,
    label: 'Test User',
    name: 'Test User',
    email: 'test.user@example.com',
    username: 'testuser',
  },
];

export const mockTags: TagLookupItem[] = [
  {
    id: 1,
    value: 1,
    label: 'Press Briefing',
    name: 'press-briefing',
    displayName: 'Press Briefing',
  },
  {
    id: 2,
    value: 2,
    label: 'Policy',
    name: 'policy',
    displayName: 'Policy',
  },
];

export const mockPitchStatuses: PitchStatusLookupItem[] = [
  { id: 1, value: 1, label: 'Draft', name: 'Draft', displayName: 'Draft' },
  {
    id: 2,
    value: 2,
    label: 'Approved',
    name: 'Approved',
    displayName: 'Approved',
  },
  {
    id: 3,
    value: 3,
    label: 'Rejected',
    name: 'Rejected',
    displayName: 'Rejected',
  },
];

export const mockCommsMaterials: CommsMaterialsLookupItem[] = [
  {
    id: 1,
    value: 1,
    label: 'Press Release',
    name: 'Press Release',
    displayName: 'Press Release',
  },
  {
    id: 2,
    value: 2,
    label: 'Social Media',
    name: 'Social Media',
    displayName: 'Social Media',
  },
];

export const mockTranslationLanguages: TranslationLanguageLookupItem[] = [
  {
    id: 1,
    value: 1,
    label: 'French',
    name: 'French',
    displayName: 'French',
  },
  {
    id: 2,
    value: 2,
    label: 'Spanish',
    name: 'Spanish',
    displayName: 'Spanish',
  },
];

export const mockGovernmentRepresentatives: GovernmentRepresentativeLookupItem[] =
  [
    {
      id: 1,
      value: 1,
      label: 'Minister Smith',
      name: 'Minister Smith',
      displayName: 'Minister Smith',
      title: 'Minister',
      ministryId: '00000000-0000-4000-8000-000000000001',
    },
    {
      id: 2,
      value: 2,
      label: 'Deputy Minister Jones',
      name: 'Deputy Minister Jones',
      displayName: 'Deputy Minister Jones',
      title: 'Deputy Minister',
      ministryId: '00000000-0000-4000-8000-000000000002',
    },
  ];

/**
 * Mock activity statuses based on database seed data
 * Values: 'new', 'queued', 'reviewed', 'changed', 'paused', 'deleted'
 */
export const mockActivityStatuses: ActivityStatusLookupItem[] = [
  { id: 1, value: 1, label: 'New', name: 'new', displayName: 'New' },
  { id: 2, value: 2, label: 'Queued', name: 'queued', displayName: 'Queued' },
  {
    id: 3,
    value: 3,
    label: 'Reviewed',
    name: 'reviewed',
    displayName: 'Reviewed',
  },
  {
    id: 4,
    value: 4,
    label: 'Changed',
    name: 'changed',
    displayName: 'Changed',
  },
  { id: 5, value: 5, label: 'Paused', name: 'paused', displayName: 'Paused' },
  {
    id: 6,
    value: 6,
    label: 'Deleted',
    name: 'deleted',
    displayName: 'Deleted',
  },
];

/**
 * Mock cities - sample cities for activities
 * These are placeholder values and should be replaced with real data from the API
 */
export const mockCities: CityLookupItem[] = [
  {
    id: 1,
    value: 1,
    label: 'Victoria',
    name: 'Victoria',
    displayName: 'Victoria',
    province: 'BC',
  },
  {
    id: 2,
    value: 2,
    label: 'Vancouver',
    name: 'Vancouver',
    displayName: 'Vancouver',
    province: 'BC',
  },
  {
    id: 3,
    value: 3,
    label: 'Kelowna',
    name: 'Kelowna',
    displayName: 'Kelowna',
    province: 'BC',
  },
  {
    id: 4,
    value: 4,
    label: 'Nanaimo',
    name: 'Nanaimo',
    displayName: 'Nanaimo',
    province: 'BC',
  },
  {
    id: 5,
    value: 5,
    label: 'Kamloops',
    name: 'Kamloops',
    displayName: 'Kamloops',
    province: 'BC',
  },
  {
    id: 6,
    value: 6,
    label: 'Prince George',
    name: 'Prince George',
    displayName: 'Prince George',
    province: 'BC',
  },
  {
    id: 7,
    value: 7,
    label: 'Terrace',
    name: 'Terrace',
    displayName: 'Terrace',
    province: 'BC',
  },
  {
    id: 8,
    value: 8,
    label: 'Vernon',
    name: 'Vernon',
    displayName: 'Vernon',
    province: 'BC',
  },
  {
    id: 9,
    value: 9,
    label: 'Williams Lake',
    name: 'Williams Lake',
    displayName: 'Williams Lake',
    province: 'BC',
  },
  {
    id: 10,
    value: 10,
    label: 'Prince Rupert',
    name: 'Prince Rupert',
    displayName: 'Prince Rupert',
    province: 'BC',
  },
  {
    id: 11,
    value: 11,
    label: 'Smithers',
    name: 'Smithers',
    displayName: 'Smithers',
    province: 'BC',
  },
];

/**
 * Mock system users - sample users for comms lead, event lead, etc.
 * These are placeholder values and should be replaced with real data from the API
 */
export const mockSystemUsers: UserLookupItem[] = [
  {
    id: 1,
    value: 1,
    label: 'John Doe',
    name: 'John Doe',
    email: 'john.doe@example.com',
    username: 'jdoe',
  },
  {
    id: 2,
    value: 2,
    label: 'Jane Smith',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    username: 'jsmith',
  },
  {
    id: 3,
    value: 3,
    label: 'Sam Wilson',
    name: 'Sam Wilson',
    email: 'sam.wilson@example.com',
    username: 'swilson',
  },
  {
    id: 5,
    value: 5,
    label: 'David Chen',
    name: 'David Chen',
    email: 'david.chen@example.com',
    username: 'dchen',
  },
  {
    id: 6,
    value: 6,
    label: 'Emily Wang',
    name: 'Emily Wang',
    email: 'emily.wang@example.com',
    username: 'ewang',
  },
  {
    id: 7,
    value: 7,
    label: 'Michael Brown',
    name: 'Michael Brown',
    email: 'michael.brown@example.com',
    username: 'mbrown',
  },
  {
    id: 8,
    value: 8,
    label: 'Sarah Kim',
    name: 'Sarah Kim',
    email: 'sarah.kim@example.com',
    username: 'skim',
  },
  {
    id: 9,
    value: 9,
    label: 'Tom Lee',
    name: 'Tom Lee',
    email: 'tom.lee@example.com',
    username: 'tlee',
  },
  {
    id: 10,
    value: 10,
    label: 'Jenny Zhang',
    name: 'Jenny Zhang',
    email: 'jenny.zhang@example.com',
    username: 'jzhang',
  },
];

/**
 * Mock ministries - sample BC government ministries
 * These are placeholder values and should be replaced with real data from the API
 */
export const mockMinistries: MinistryLookupItem[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    value: '00000000-0000-4000-8000-000000000001',
    label: 'Office of the Premier',
    displayName: 'Office of the Premier',
    abbreviation: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    value: '00000000-0000-4000-8000-000000000002',
    label: 'Agriculture and Food',
    displayName: 'Agriculture and Food',
    abbreviation: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    value: '00000000-0000-4000-8000-000000000003',
    label: 'Attorney General',
    displayName: 'Attorney General',
    abbreviation: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    value: '00000000-0000-4000-8000-000000000004',
    label: 'Children and Family Development',
    displayName: 'Children and Family Development',
    abbreviation: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000005',
    value: '00000000-0000-4000-8000-000000000005',
    label: "Citizens' Services",
    displayName: "Citizens' Services",
    abbreviation: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000006',
    value: '00000000-0000-4000-8000-000000000006',
    label: 'Education and Child Care',
    displayName: 'Education and Child Care',
    abbreviation: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000007',
    value: '00000000-0000-4000-8000-000000000007',
    label: 'Emergency Management and Climate Readiness',
    displayName: 'Emergency Management and Climate Readiness',
    abbreviation: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000008',
    value: '00000000-0000-4000-8000-000000000008',
    label: 'Energy and Climate Solutions',
    displayName: 'Energy and Climate Solutions',
    abbreviation: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000009',
    value: '00000000-0000-4000-8000-000000000009',
    label: 'Environment and Parks',
    displayName: 'Environment and Parks',
    abbreviation: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000010',
    value: '00000000-0000-4000-8000-000000000010',
    label: 'Finance',
    displayName: 'Finance',
    abbreviation: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000011',
    value: '00000000-0000-4000-8000-000000000011',
    label: 'Forests',
    displayName: 'Forests',
    abbreviation: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000012',
    value: '00000000-0000-4000-8000-000000000012',
    label: 'Health',
    displayName: 'Health',
    abbreviation: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000013',
    value: '00000000-0000-4000-8000-000000000013',
    label: 'Housing and Municipal Affairs',
    displayName: 'Housing and Municipal Affairs',
    abbreviation: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000014',
    value: '00000000-0000-4000-8000-000000000014',
    label: 'Indigenous Relations and Reconciliation',
    displayName: 'Indigenous Relations and Reconciliation',
    abbreviation: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000015',
    value: '00000000-0000-4000-8000-000000000015',
    label: 'Infrastructure',
    displayName: 'Infrastructure',
    abbreviation: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000016',
    value: '00000000-0000-4000-8000-000000000016',
    label: 'Intergovernmental Relations Secretariat',
    displayName: 'Intergovernmental Relations Secretariat',
    abbreviation: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000017',
    value: '00000000-0000-4000-8000-000000000017',
    label: 'Jobs and Economic Growth',
    displayName: 'Jobs and Economic Growth',
    abbreviation: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000018',
    value: '00000000-0000-4000-8000-000000000018',
    label: 'Labour',
    displayName: 'Labour',
    abbreviation: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000019',
    value: '00000000-0000-4000-8000-000000000019',
    label: 'Mining and Critical Minerals',
    displayName: 'Mining and Critical Minerals',
    abbreviation: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000020',
    value: '00000000-0000-4000-8000-000000000020',
    label: 'Post-Secondary Education and Future Skills',
    displayName: 'Post-Secondary Education and Future Skills',
    abbreviation: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000021',
    value: '00000000-0000-4000-8000-000000000021',
    label: 'Public Safety and Solicitor General',
    displayName: 'Public Safety and Solicitor General',
    abbreviation: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000022',
    value: '00000000-0000-4000-8000-000000000022',
    label: 'Social Development and Poverty Reduction',
    displayName: 'Social Development and Poverty Reduction',
    abbreviation: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000023',
    value: '00000000-0000-4000-8000-000000000023',
    label: 'Tourism, Arts, Culture and Sport',
    displayName: 'Tourism, Arts, Culture and Sport',
    abbreviation: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000024',
    value: '00000000-0000-4000-8000-000000000024',
    label: 'Transportation and Transit',
    displayName: 'Transportation and Transit',
    abbreviation: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000025',
    value: '00000000-0000-4000-8000-000000000025',
    label: 'Water, Land and Resource Stewardship',
    displayName: 'Water, Land and Resource Stewardship',
    abbreviation: null,
  },
];

export function createValidActivityRequest(
  overrides?: Partial<CreateActivityRequest>
): CreateActivityRequest {
  return {
    title: 'Test Activity',
    dateStatusId: 1,
    timeStatusId: 1,
    activityStatusId: 1,
    commsContactLeadId: 8,
    leadMinistryId: '550e8400-e29b-41d4-a716-446655440000',
    isAllDay: false,
    isIssue: false,
    isConfidential: false,
    visibility: 'global',
    summary: 'Test summary',
    significance: '',
    schedulingNotes: '',
    ...overrides,
  };
}

export function createInvalidActivityRequest(): Partial<CreateActivityRequest> {
  return {
    title: 'A'.repeat(256), // Exceeds max length
    dateStatusId: 'invalid' as any, // Wrong type
    timeStatusId: -1, // Invalid ID
    activityStatusId: undefined as any, // Missing required
    commsContactLeadId: 0, // Invalid ID
    leadOrgId: 'not-a-uuid', // Invalid UUID
    startDate: 'invalid-date', // Invalid date format
    startTime: '25:99', // Invalid time format
  };
}

export function createOversizedString(length: number): string {
  return 'A'.repeat(length);
}

export function createInvalidUUID(): string {
  return 'not-a-valid-uuid-format';
}

export function createValidUUID(): string {
  return '550e8400-e29b-41d4-a716-446655440000';
}
