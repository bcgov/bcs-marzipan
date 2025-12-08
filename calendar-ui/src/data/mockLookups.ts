/**
 * Mock lookup data for development and testing
 * These should eventually be replaced with API calls to fetch real data
 */

export interface MockCategory {
  id: number;
  name: string;
  displayName?: string;
}

export interface MockSchedulingStatus {
  id: number;
  name: string;
  displayName?: string;
}

export interface MockPitchStatus {
  id: number;
  name: string;
  displayName?: string;
}

export interface MockOrganization {
  id: string;
  name: string;
}

export interface MockTag {
  id: string;
  text: string;
}

export interface MockActivityStatus {
  id: number;
  name: string;
  displayName?: string;
}

export interface MockCity {
  id: number;
  name: string;
  displayName?: string;
  province?: string;
}

export interface MockSystemUser {
  id: number;
  name: string;
  email?: string;
}

export interface MockMinistry {
  id: string;
  name: string;
  displayName?: string;
}

export interface MockCommsMaterial {
  id: number;
  name: string;
  displayName?: string;
}

export interface MockTranslationLanguage {
  id: number;
  name: string;
  displayName?: string;
}

export interface MockGovernmentRepresentative {
  id: number;
  name: string;
  displayName?: string;
  title?: string;
}

export interface MockLookAheadOption {
  value: string;
  label: string;
}

export interface MockCalendarVisibilityOption {
  value: string;
  label: string;
}

/**
 * Mock categories based on database seed data
 * Values: 'event', 'release', 'awareness', 'conference', 'fyi', 'social media', 'speech', 'tv radio'
 * Note regarding mocking RFC 4122 UUIDs:
 * mock UUIDs like '00000000-0000-0000-0000-000000000010' have the correct format (8-4-4-4-12 hex characters), but they're invalid according to RFC 4122 because:
 * Version nibble (first character of the 3rd group) must be 1-5, not 0
 * Variant nibble (first character of the 4th group) must be 8, 9, a, or b, not 0
 * Valid UUID v4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where:
 * The 4 indicates version 4
 * The y must be 8, 9, a, or b (variant)
 */
export const mockCategories: MockCategory[] = [
  { id: 1, name: 'event', displayName: 'Event' },
  { id: 2, name: 'release', displayName: 'Release' },
  { id: 3, name: 'awareness', displayName: 'Awareness' },
  { id: 4, name: 'conference', displayName: 'Conference' },
  { id: 5, name: 'fyi', displayName: 'FYI' },
  { id: 6, name: 'social media', displayName: 'Social Media' },
  { id: 7, name: 'speech', displayName: 'Speech' },
  { id: 8, name: 'tv radio', displayName: 'TV/Radio' },
];

/**
 * Mock scheduling statuses based on database seed data
 * Values: 'unknown', 'tentative', 'confirmed'
 */
export const mockSchedulingStatuses: MockSchedulingStatus[] = [
  { id: 1, name: 'unknown', displayName: 'Unknown' },
  { id: 2, name: 'tentative', displayName: 'Tentative' },
  { id: 3, name: 'confirmed', displayName: 'Confirmed' },
];

/**
 * Mock pitch statuses based on database seed data
 * Values: 'not required', 'submitted', 'pitched', 'approved'
 */
export const mockPitchStatuses: MockPitchStatus[] = [
  { id: 1, name: 'not required', displayName: 'Not Required' },
  { id: 2, name: 'submitted', displayName: 'Submitted' },
  { id: 3, name: 'pitched', displayName: 'Pitched' },
  { id: 4, name: 'approved', displayName: 'Approved' },
];

/**
 * Mock organizations - sample BC government organizations
 * These are placeholder values and should be replaced with real data from the API
 */
export const mockOrganizations: MockOrganization[] = [
  { id: '00000000-0000-4000-8000-000000000001', name: 'Office of the Premier' },
  { id: '00000000-0000-4000-8000-000000000002', name: 'Agriculture and Food' },
  { id: '00000000-0000-4000-8000-000000000003', name: 'Attorney General' },
  {
    id: '00000000-0000-4000-8000-000000000004',
    name: 'Children and Family Development',
  },
  { id: '00000000-0000-4000-8000-000000000005', name: "Citizens' Services" },
  {
    id: '00000000-0000-4000-8000-000000000006',
    name: 'Education and Child Care',
  },
  {
    id: '00000000-0000-4000-8000-000000000007',
    name: 'Emergency Management and Climate Readiness',
  },
  {
    id: '00000000-0000-4000-8000-000000000008',
    name: 'Energy and Climate Solutions',
  },
  { id: '00000000-0000-4000-8000-000000000009', name: 'Environment and Parks' },
  { id: '00000000-0000-4000-8000-000000000010', name: 'Finance' },
  { id: '00000000-0000-4000-8000-000000000011', name: 'Forests' },
  { id: '00000000-0000-4000-8000-000000000012', name: 'Health' },
  {
    id: '00000000-0000-4000-8000-000000000013',
    name: 'Housing and Municipal Affairs',
  },
  {
    id: '00000000-0000-4000-8000-000000000014',
    name: 'Indigenous Relations and Reconciliation',
  },
  { id: '00000000-0000-4000-8000-000000000015', name: 'Infrastructure' },
  {
    id: '00000000-0000-4000-8000-000000000016',
    name: 'Intergovernmental Relations Secretariat',
  },
  {
    id: '00000000-0000-4000-8000-000000000017',
    name: 'Jobs and Economic Growth',
  },
  { id: '00000000-0000-4000-8000-000000000018', name: 'Labour' },
  {
    id: '00000000-0000-4000-8000-000000000019',
    name: 'Mining and Critical Minerals',
  },
  {
    id: '00000000-0000-4000-8000-000000000020',
    name: 'Post-Secondary Education and Future Skills',
  },
  {
    id: '00000000-0000-4000-8000-000000000021',
    name: 'Public Safety and Solicitor General',
  },
  {
    id: '00000000-0000-4000-8000-000000000022',
    name: 'Social Development and Poverty Reduction',
  },
  {
    id: '00000000-0000-4000-8000-000000000023',
    name: 'Tourism, Arts, Culture and Sport',
  },
  {
    id: '00000000-0000-4000-8000-000000000024',
    name: 'Transportation and Transit',
  },
  {
    id: '00000000-0000-4000-8000-000000000025',
    name: 'Water, Land and Resource Stewardship',
  },
];

/**
 * Mock tags - sample tags for activities
 * These are placeholder values and should be replaced with real data from the API
 */
export const mockTags: MockTag[] = [
  { id: '00000000-0000-4000-8000-000000000101', text: 'HQ-1P' },
  { id: '00000000-0000-4000-8000-000000000102', text: 'HQ-3S' },
  { id: '00000000-0000-4000-8000-000000000103', text: 'HQ-4W' },
  { id: '00000000-0000-4000-8000-000000000104', text: 'HQ-PR' },
  { id: '00000000-0000-4000-8000-000000000105', text: 'HQ-EV' },
  { id: '00000000-0000-4000-8000-000000000106', text: 'HQ-ECO' },
  { id: '00000000-0000-4000-8000-000000000107', text: 'CAS' },
];

/**
 * Mock activity statuses based on database seed data
 * Values: 'new', 'queued', 'reviewed', 'changed', 'paused', 'deleted'
 */
export const mockActivityStatuses: MockActivityStatus[] = [
  { id: 1, name: 'new', displayName: 'New' },
  { id: 2, name: 'queued', displayName: 'Queued' },
  { id: 3, name: 'reviewed', displayName: 'Reviewed' },
  { id: 4, name: 'changed', displayName: 'Changed' },
  { id: 5, name: 'paused', displayName: 'Paused' },
  { id: 6, name: 'deleted', displayName: 'Deleted' },
];

/**
 * Mock cities - sample cities for activities
 * These are placeholder values and should be replaced with real data from the API
 */
export const mockCities: MockCity[] = [
  { id: 1, name: 'Victoria', displayName: 'Victoria', province: 'BC' },
  { id: 2, name: 'Vancouver', displayName: 'Vancouver', province: 'BC' },
  { id: 3, name: 'Kelowna', displayName: 'Kelowna', province: 'BC' },
  { id: 4, name: ' Nanaimo', displayName: 'Nanaimo', province: 'BC' },
  { id: 5, name: 'Kamloops', displayName: 'Kamloops', province: 'BC' },
  {
    id: 6,
    name: 'Prince George',
    displayName: 'Prince George',
    province: 'BC',
  },
  { id: 7, name: 'Terrace', displayName: 'Terrace', province: 'BC' },
  { id: 8, name: 'Vernon', displayName: 'Vernon', province: 'BC' },
  {
    id: 9,
    name: 'Williams Lake',
    displayName: 'Williams Lake',
    province: 'BC',
  },
  {
    id: 10,
    name: 'Prince Rupert',
    displayName: 'Prince Rupert',
    province: 'BC',
  },
  { id: 11, name: 'Smithers', displayName: 'Smithers', province: 'BC' },
  { id: 12, name: 'Terrace', displayName: 'Terrace', province: 'BC' },
  { id: 13, name: 'Vernon', displayName: 'Vernon', province: 'BC' },
  {
    id: 14,
    name: 'Williams Lake',
    displayName: 'Williams Lake',
    province: 'BC',
  },
  {
    id: 15,
    name: 'Prince Rupert',
    displayName: 'Prince Rupert',
    province: 'BC',
  },
];

/**
 * Mock system users - sample users for comms lead, event lead, etc.
 * These are placeholder values and should be replaced with real data from the API
 */
export const mockSystemUsers: MockSystemUser[] = [
  { id: 1, name: 'John Doe', email: 'john.doe@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com' },
  { id: 3, name: 'Sam Wilson', email: 'sam.wilson@example.com' },
  { id: 5, name: 'David Chen', email: 'david.chen@example.com' },
  { id: 6, name: 'Emily Wang', email: 'emily.wang@example.com' },
  { id: 7, name: 'Michael Brown', email: 'michael.brown@example.com' },
  { id: 8, name: 'Sarah Kim', email: 'sarah.kim@example.com' },
  { id: 9, name: 'Tom Lee', email: 'tom.lee@example.com' },
  { id: 10, name: 'Jenny Zhang', email: 'jenny.zhang@example.com' },
];

/**
 * Mock ministries - sample BC government ministries
 * These are placeholder values and should be replaced with real data from the API
 */
export const mockMinistries: MockMinistry[] = [
  { id: '00000000-0000-4000-8000-000000000001', name: 'Office of the Premier' },
  { id: '00000000-0000-4000-8000-000000000002', name: 'Agriculture and Food' },
  { id: '00000000-0000-4000-8000-000000000003', name: 'Attorney General' },
  {
    id: '00000000-0000-4000-8000-000000000004',
    name: 'Children and Family Development',
  },
  { id: '00000000-0000-4000-8000-000000000005', name: "Citizens' Services" },
  {
    id: '00000000-0000-4000-8000-000000000006',
    name: 'Education and Child Care',
  },
  {
    id: '00000000-0000-4000-8000-000000000007',
    name: 'Emergency Management and Climate Readiness',
  },
  {
    id: '00000000-0000-4000-8000-000000000008',
    name: 'Energy and Climate Solutions',
  },
  { id: '00000000-0000-4000-8000-000000000009', name: 'Environment and Parks' },
  { id: '00000000-0000-4000-8000-000000000010', name: 'Finance' },
  { id: '00000000-0000-4000-8000-000000000011', name: 'Forests' },
  { id: '00000000-0000-4000-8000-000000000012', name: 'Health' },
  {
    id: '00000000-0000-4000-8000-000000000013',
    name: 'Housing and Municipal Affairs',
  },
  {
    id: '00000000-0000-4000-8000-000000000014',
    name: 'Indigenous Relations and Reconciliation',
  },
  { id: '00000000-0000-4000-8000-000000000015', name: 'Infrastructure' },
  {
    id: '00000000-0000-4000-8000-000000000016',
    name: 'Intergovernmental Relations Secretariat',
  },
  {
    id: '00000000-0000-4000-8000-000000000017',
    name: 'Jobs and Economic Growth',
  },
  { id: '00000000-0000-4000-8000-000000000018', name: 'Labour' },
  {
    id: '00000000-0000-4000-8000-000000000019',
    name: 'Mining and Critical Minerals',
  },
  {
    id: '00000000-0000-4000-8000-000000000020',
    name: 'Post-Secondary Education and Future Skills',
  },
  {
    id: '00000000-0000-4000-8000-000000000021',
    name: 'Public Safety and Solicitor General',
  },
  {
    id: '00000000-0000-4000-8000-000000000022',
    name: 'Social Development and Poverty Reduction',
  },
  {
    id: '00000000-0000-4000-8000-000000000023',
    name: 'Tourism, Arts, Culture and Sport',
  },
  {
    id: '00000000-0000-4000-8000-000000000024',
    name: 'Transportation and Transit',
  },
  {
    id: '00000000-0000-4000-8000-000000000025',
    name: 'Water, Land and Resource Stewardship',
  },
];

/**
 * Mock comms materials based on database seed data
 * Values: 'Media Advisory', 'Q&As', 'Key Messages', 'News Release', etc.
 */
export const mockCommsMaterials: MockCommsMaterial[] = [
  { id: 1, name: 'media advisory', displayName: 'Media Advisory' },
  { id: 2, name: 'q and a', displayName: 'Q&As' },
  { id: 3, name: 'key messages', displayName: 'Key Messages' },
  { id: 4, name: 'news release', displayName: 'News Release' },
  { id: 5, name: 'backgrounder', displayName: 'Backgrounder' },
  { id: 6, name: 'factsheet', displayName: 'Factsheet' },
  { id: 7, name: 'speaking notes', displayName: 'Speaking Notes' },
];

/**
 * Mock translation languages based on database seed data
 * Values: 'French', 'Chinese Simplified', 'Spanish', etc.
 */
export const mockTranslationLanguages: MockTranslationLanguage[] = [
  { id: 1, name: 'french', displayName: 'French' },
  { id: 2, name: 'chinese simplified', displayName: 'Chinese Simplified' },
  { id: 3, name: 'chinese traditional', displayName: 'Chinese Traditional' },
  { id: 4, name: 'spanish', displayName: 'Spanish' },
  { id: 5, name: 'punjabi', displayName: 'Punjabi' },
  { id: 6, name: 'tagalog', displayName: 'Tagalog' },
  { id: 7, name: 'arabic', displayName: 'Arabic' },
  { id: 8, name: 'hindi', displayName: 'Hindi' },
];

/**
 * Mock government representatives - sample representatives for activities
 * These are placeholder values and should be replaced with real data from the API
 */
export const mockGovernmentRepresentatives: MockGovernmentRepresentative[] = [
  {
    id: 1,
    name: 'Premier',
    displayName: 'Premier Eby',
    title: 'Premier of British Columbia',
  },
  {
    id: 2,
    name: 'Minister',
    displayName: 'Minister Osborne',
    title: 'Minister of',
  },
];

/**
 * Look ahead status options - enum values for look ahead status
 * Values: 'none', 'new', 'changed'
 */
export const lookAheadStatusOptions: MockLookAheadOption[] = [
  { value: 'none', label: 'None' },
  { value: 'new', label: 'New' },
  { value: 'changed', label: 'Changed' },
];

/**
 * Look ahead section options - enum values for look ahead section
 * Values: 'events', 'issues', 'news', 'awareness'
 */
export const lookAheadSectionOptions: MockLookAheadOption[] = [
  { value: 'events', label: 'Events' },
  { value: 'issues', label: 'Issues and reports' },
  { value: 'news', label: 'In the news' },
  { value: 'longterm', label: 'Long-term outlook' },
];

/**
 * Calendar visibility options - enum values for calendar visibility
 * Values: 'visible', 'partial', 'hidden'
 */
export const calendarVisibilityOptions: MockCalendarVisibilityOption[] = [
  { value: 'visible', label: 'Visible' },
  { value: 'partial', label: 'Partial' },
  { value: 'hidden', label: 'Hidden' },
];
