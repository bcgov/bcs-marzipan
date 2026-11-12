import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { TranslationRequiredStatusLookupItem } from '@corpcal/shared/api/types';
import type { ActivityFormData } from '@corpcal/shared/schemas';
import { getDefaultFormValues } from '@/lib/activity-form-defaults';

import { ActivityEditProvider } from '../activity-edit-context';
import { ActivityCommsSection } from './ActivityCommsSection';

beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.setPointerCapture = () => undefined;
    Element.prototype.releasePointerCapture = () => undefined;
  }
});

vi.mock('../activity-info-icon-settings-context', () => ({
  ActivityFieldInfoIcon: () => null,
}));

const mockTranslationRequiredStatuses = [
  {
    id: 1,
    name: 'tbd',
    displayName: 'Translations TBD',
    label: 'Translations TBD',
    value: 1,
  },
  {
    id: 2,
    name: 'required',
    displayName: 'Required',
    label: 'Required',
    value: 2,
  },
  {
    id: 3,
    name: 'no_translations',
    displayName: 'No translations',
    label: 'No translations',
    value: 3,
  },
];

const mockNewsReleaseCommsMaterial = {
  id: 4,
  name: 'news_release',
  displayName: 'News release',
  visibility: 'global' as const,
  teamIds: [] as number[],
  releaseType: {
    audience: 'public' as const,
    allowsTranslation: true,
    requiresNewsReleaseDetails: true,
  },
};

const mockTranslationOnlyCommsMaterial = {
  id: 5,
  name: 'syndicated',
  displayName: 'Syndicated content',
  visibility: 'global' as const,
  teamIds: [] as number[],
  releaseType: {
    audience: 'public' as const,
    allowsTranslation: true,
    requiresNewsReleaseDetails: false,
  },
};

const mockLookups = {
  isLoading: false,
  hasError: false,
  categories: [],
  organizations: [],
  ministries: [],
  users: [],
  eventPlanners: [],
  tags: [],
  activityStatuses: [],
  commsMaterials: [
    mockNewsReleaseCommsMaterial,
    mockTranslationOnlyCommsMaterial,
  ],
  translationLanguages: [
    { id: 1, name: 'French', displayName: 'French' },
    { id: 2, name: 'Spanish', displayName: 'Spanish' },
  ],
  translationRequiredStatuses: mockTranslationRequiredStatuses,
  governmentRepresentatives: [],
  newsReleaseDistributions: [{ value: '1', label: 'Internal' }],
  premierRequested: [],
  newsReleaseOrigins: [{ value: '1', label: 'Origin A' }],
  sharedWithTeams: [],
  quickShareGroups: [],
  dateStatuses: [
    { id: 1, name: 'tbd', displayName: 'Date TBD' },
    { id: 2, name: 'tentative', displayName: 'Tentative' },
    { id: 3, name: 'confirmed', displayName: 'Confirmed' },
  ],
  timeStatuses: [
    { id: 1, name: 'tbd', displayName: 'Time TBD' },
    { id: 2, name: 'tentative', displayName: 'Tentative' },
    { id: 3, name: 'confirmed', displayName: 'Confirmed' },
  ],
  venueStatuses: [],
};

function ActivityCommsSectionHarness({
  readOnly,
  canEditFieldScope,
  defaultValues,
  commsMaterialOptions = mockLookups.commsMaterials,
  translationRequiredStatuses = mockLookups.translationRequiredStatuses,
  newsReleaseOriginOptions = mockLookups.newsReleaseOrigins,
  onFormReady,
}: {
  readOnly: boolean;
  canEditFieldScope?: (s: string) => boolean;
  defaultValues?: Partial<ActivityFormData>;
  commsMaterialOptions?: typeof mockLookups.commsMaterials;
  translationRequiredStatuses?: TranslationRequiredStatusLookupItem[];
  newsReleaseOriginOptions?: typeof mockLookups.newsReleaseOrigins;
  onFormReady?: (form: ReturnType<typeof useForm<ActivityFormData>>) => void;
}) {
  const form = useForm<ActivityFormData>({
    defaultValues: {
      ...(getDefaultFormValues() as ActivityFormData),
      ...defaultValues,
    },
  });

  onFormReady?.(form);

  return (
    <FormProvider {...form}>
      <ActivityEditProvider
        value={{
          readOnly,
          canViewFieldScope: () => true,
          canEditFieldScope: canEditFieldScope ?? (() => true),
        }}
      >
        <ActivityCommsSection
          commsMaterialOptions={commsMaterialOptions}
          dateStatuses={mockLookups.dateStatuses}
          timeStatuses={mockLookups.timeStatuses}
          newsReleaseDistributionOptions={mockLookups.newsReleaseDistributions}
          newsReleaseOriginOptions={newsReleaseOriginOptions}
          translationRequiredStatuses={translationRequiredStatuses}
          translationLanguageOptions={mockLookups.translationLanguages}
          userTeamIds={[]}
        />
      </ActivityEditProvider>
    </FormProvider>
  );
}

describe('ActivityCommsSection release time', () => {
  it('renders release scheduling select when public comms is selected', async () => {
    render(
      <ActivityCommsSectionHarness
        readOnly={false}
        defaultValues={{
          commsMaterialIds: [4],
          releaseSchedulingMode: 'relative',
          releaseTimeOffsetMinutes: 15,
          startDate: '2026-03-13',
          startTime: '14:30:00',
        }}
      />
    );

    expect(
      screen.getByText('Release time is relative to start date and time.')
    ).toBeInTheDocument();
    expect(await screen.findByText('15 minutes after')).toBeInTheDocument();
    expect(screen.getByText('2:45 pm')).toBeInTheDocument();
  });
});

describe('ActivityCommsSection optional lookup clear', () => {
  it('clears news release origin when Clear is clicked', async () => {
    const user = userEvent.setup();
    let formRef: ReturnType<typeof useForm<ActivityFormData>> | undefined;

    const newsReleaseOrigins = [
      { value: '1', label: 'TBD' },
      { value: '2', label: 'Ministry release' },
      { value: '3', label: 'Federal release' },
    ];

    render(
      <ActivityCommsSectionHarness
        readOnly={false}
        defaultValues={{
          commsMaterialIds: [4],
          newsReleaseOriginId: 3,
        }}
        newsReleaseOriginOptions={newsReleaseOrigins}
        onFormReady={(form) => {
          formRef = form;
        }}
      />
    );

    const origin = await screen.findByRole('combobox', {
      name: /News release origin/i,
    });
    expect(origin).toHaveTextContent('Federal release');

    await user.click(origin);
    await user.click(
      await screen.findByRole('button', { name: /Clear News release origin/i })
    );
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(formRef!.getValues('newsReleaseOriginId')).toBeNull();
      expect(formRef!.formState.dirtyFields.newsReleaseOriginId).toBe(true);
      const clearedOrigin = screen.getByRole('combobox', {
        name: /News release origin/i,
      });
      expect(clearedOrigin).not.toHaveTextContent('Ministry release');
      expect(clearedOrigin).not.toHaveTextContent('Federal release');
    });
  });

  it('clears news release origin UI when hydrated value was Ministry release', async () => {
    const user = userEvent.setup();
    let formRef: ReturnType<typeof useForm<ActivityFormData>> | undefined;

    const newsReleaseOrigins = [
      { value: '1', label: 'TBD' },
      { value: '2', label: 'Ministry release' },
    ];

    render(
      <ActivityCommsSectionHarness
        readOnly={false}
        defaultValues={{
          commsMaterialIds: [4],
          newsReleaseOriginId: 2,
        }}
        newsReleaseOriginOptions={newsReleaseOrigins}
        onFormReady={(form) => {
          formRef = form;
        }}
      />
    );

    const origin = await screen.findByRole('combobox', {
      name: /News release origin/i,
    });
    await user.click(origin);
    await user.click(
      await screen.findByRole('button', { name: /Clear News release origin/i })
    );
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(formRef!.getValues('newsReleaseOriginId')).toBeNull();
      const clearedOrigin = screen.getByRole('combobox', {
        name: /News release origin/i,
      });
      expect(clearedOrigin).not.toHaveTextContent('Ministry release');
    });
  });

  it('hides Clear for news release origin when read-only', () => {
    render(
      <ActivityCommsSectionHarness
        readOnly
        defaultValues={{
          commsMaterialIds: [4],
          newsReleaseOriginId: 1,
        }}
      />
    );

    expect(
      screen.queryByRole('button', { name: /Clear News release origin/i })
    ).not.toBeInTheDocument();
  });
});

describe('ActivityCommsSection release fields permissions', () => {
  it('renders news release selects as readOnly when activity is view-only', async () => {
    render(
      <ActivityCommsSectionHarness
        readOnly={true}
        defaultValues={{ commsMaterialIds: [4] }}
      />
    );

    const origin = await screen.findByRole('combobox', {
      name: /News release origin/i,
    });
    expect(origin).toHaveAttribute('aria-readonly', 'true');
  });

  it('renders translations combobox as readOnly when activity is view-only', async () => {
    render(
      <ActivityCommsSectionHarness
        readOnly={true}
        defaultValues={{
          commsMaterialIds: [4],
          translationsRequiredStatusId: 1,
        }}
      />
    );

    const input = await screen.findByRole('combobox', {
      name: /^Translations$/i,
    });
    expect(input).toHaveAttribute('aria-readonly', 'true');
  });
});

describe('ActivityCommsSection conditional comms groups', () => {
  it('shows news release details when a material requires them', async () => {
    render(
      <ActivityCommsSectionHarness
        readOnly={false}
        defaultValues={{ commsMaterialIds: [4] }}
      />
    );

    expect(await screen.findByText('News release details')).toBeInTheDocument();
  });

  it('shows translation fields without NR group when only allowsTranslation', async () => {
    render(
      <ActivityCommsSectionHarness
        readOnly={false}
        defaultValues={{
          commsMaterialIds: [5],
          translationsRequiredStatusId: 2,
        }}
      />
    );

    expect(screen.queryByText('News release details')).not.toBeInTheDocument();
    expect(
      await screen.findByRole('combobox', { name: /^Translations$/i })
    ).toBeInTheDocument();
  });
});

describe('ActivityCommsSection translations combobox', () => {
  it('shows Translations TBD placeholder when status is tbd without languages', async () => {
    render(
      <ActivityCommsSectionHarness
        readOnly={false}
        defaultValues={{
          commsMaterialIds: [4],
          translationsRequiredStatusId: 1,
          translationLanguageIds: [],
        }}
      />
    );

    expect(screen.getByText('Translations TBD')).toBeInTheDocument();

    const user = userEvent.setup();
    const combobox = await screen.findByRole('combobox', {
      name: /^Translations$/i,
    });
    await user.click(combobox);
    expect(
      screen.queryByRole('option', { name: 'Translations TBD' })
    ).toBeNull();
  });

  it('sets implicit required when a language is selected', async () => {
    const user = userEvent.setup();
    let formRef: ReturnType<typeof useForm<ActivityFormData>> | undefined;

    render(
      <ActivityCommsSectionHarness
        readOnly={false}
        defaultValues={{
          commsMaterialIds: [4],
          translationsRequiredStatusId: 1,
          translationLanguageIds: [],
        }}
        onFormReady={(form) => {
          formRef = form;
        }}
      />
    );

    const combobox = await screen.findByRole('combobox', {
      name: /^Translations$/i,
    });
    await user.click(combobox);
    await user.click(await screen.findByText('French'));

    await waitFor(() => {
      expect(formRef!.getValues('translationsRequiredStatusId')).toBe(2);
      expect(formRef!.getValues('translationLanguageIds')).toEqual([1]);
    });
  });

  it('clears languages when No translations is selected', async () => {
    const user = userEvent.setup();
    let formRef: ReturnType<typeof useForm<ActivityFormData>> | undefined;

    render(
      <ActivityCommsSectionHarness
        readOnly={false}
        defaultValues={{
          commsMaterialIds: [4],
          translationsRequiredStatusId: 2,
          translationLanguageIds: [1, 2],
        }}
        onFormReady={(form) => {
          formRef = form;
        }}
      />
    );

    const combobox = await screen.findByRole('combobox', {
      name: /^Translations$/i,
    });
    await user.click(combobox);
    await user.click(await screen.findByText('No translations'));

    await waitFor(() => {
      expect(formRef!.getValues('translationsRequiredStatusId')).toBe(3);
      expect(formRef!.getValues('translationLanguageIds')).toEqual([]);
    });
  });
});
