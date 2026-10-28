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
    name: 'pending',
    displayName: 'Pending review',
    label: 'Pending review',
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
    name: 'not_required',
    displayName: 'Not required',
    label: 'Not required',
    value: 3,
  },
];

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
  commsMaterials: [],
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
  dateStatuses: [],
  timeStatuses: [],
  venueStatuses: [],
};

function ActivityCommsSectionHarness({
  readOnly,
  canEditFieldScope,
  defaultValues,
  translationRequiredStatuses = mockLookups.translationRequiredStatuses,
  onFormReady,
}: {
  readOnly: boolean;
  canEditFieldScope?: (s: string) => boolean;
  defaultValues?: Partial<ActivityFormData>;
  translationRequiredStatuses?: TranslationRequiredStatusLookupItem[];
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
          commsMaterialOptions={mockLookups.commsMaterials}
          newsReleaseDistributionOptions={mockLookups.newsReleaseDistributions}
          newsReleaseOriginOptions={mockLookups.newsReleaseOrigins}
          translationRequiredStatuses={translationRequiredStatuses}
          translationLanguageOptions={mockLookups.translationLanguages}
        />
      </ActivityEditProvider>
    </FormProvider>
  );
}

describe('ActivityCommsSection optional lookup clear', () => {
  it('clears news release origin when Clear is clicked', async () => {
    const user = userEvent.setup();
    let formRef: ReturnType<typeof useForm<ActivityFormData>> | undefined;

    render(
      <ActivityCommsSectionHarness
        readOnly={false}
        defaultValues={{ newsReleaseOriginId: 1 }}
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

    await waitFor(() => {
      expect(formRef!.getValues('newsReleaseOriginId')).toBeUndefined();
      expect(formRef!.formState.dirtyFields.newsReleaseOriginId).toBe(true);
    });
  });

  it('hides Clear for news release origin when read-only', () => {
    render(
      <ActivityCommsSectionHarness
        readOnly
        defaultValues={{ newsReleaseOriginId: 1 }}
      />
    );

    expect(
      screen.queryByRole('button', { name: /Clear News release origin/i })
    ).not.toBeInTheDocument();
  });
});

describe('ActivityCommsSection release fields permissions', () => {
  it('renders news release selects as readOnly when activity is view-only', async () => {
    render(<ActivityCommsSectionHarness readOnly={true} />);

    const origin = await screen.findByRole('combobox', {
      name: /News release origin/i,
    });
    expect(origin).toHaveAttribute('aria-readonly', 'true');
  });

  it('disables translation languages when field scope forbids edit', async () => {
    render(
      <ActivityCommsSectionHarness
        readOnly={false}
        canEditFieldScope={(s: string) => s !== 'translations'}
        defaultValues={{ translationsRequiredStatusId: 2 }}
      />
    );

    const input = await screen.findByRole('combobox', {
      name: /Translation languages/i,
    });
    expect(input).toBeDisabled();
  });
});

describe('ActivityCommsSection translation languages visibility', () => {
  it('hides translation languages when status is not Required', () => {
    render(
      <ActivityCommsSectionHarness
        readOnly={false}
        defaultValues={{ translationsRequiredStatusId: 1 }}
      />
    );

    expect(
      screen.queryByRole('combobox', { name: /Translation languages/i })
    ).not.toBeInTheDocument();
  });

  it('shows translation languages when status is Required', async () => {
    render(
      <ActivityCommsSectionHarness
        readOnly={false}
        defaultValues={{ translationsRequiredStatusId: 2 }}
      />
    );

    expect(
      await screen.findByRole('combobox', { name: /Translation languages/i })
    ).toBeInTheDocument();
  });
});

const translationRequiredStatusesWithoutRequired =
  mockTranslationRequiredStatuses.filter(
    (status) => status.name !== 'required'
  );

describe('ActivityCommsSection translation status change', () => {
  it('clears translation languages when status changes away from required', async () => {
    const user = userEvent.setup();
    let formRef: ReturnType<typeof useForm<ActivityFormData>> | undefined;

    render(
      <ActivityCommsSectionHarness
        readOnly={false}
        defaultValues={{
          translationsRequiredStatusId: 2,
          translationLanguageIds: [1, 2],
        }}
        onFormReady={(form) => {
          formRef = form;
        }}
      />
    );

    const statusSelect = await screen.findByRole('combobox', {
      name: /^Translations required$/i,
    });
    await user.click(statusSelect);
    await user.click(await screen.findByText('Not required'));

    await waitFor(() => {
      expect(formRef!.getValues('translationsRequiredStatusId')).toBe(3);
      expect(formRef!.getValues('translationLanguageIds')).toEqual([]);
    });
  });

  it('preserves translation languages when required status lookup is unresolved', async () => {
    const user = userEvent.setup();
    let formRef: ReturnType<typeof useForm<ActivityFormData>> | undefined;

    render(
      <ActivityCommsSectionHarness
        readOnly={false}
        translationRequiredStatuses={translationRequiredStatusesWithoutRequired}
        defaultValues={{
          translationsRequiredStatusId: 1,
          translationLanguageIds: [1, 2],
        }}
        onFormReady={(form) => {
          formRef = form;
        }}
      />
    );

    const statusSelect = await screen.findByRole('combobox', {
      name: /^Translations required$/i,
    });
    await user.click(statusSelect);
    await user.click(await screen.findByText('Not required'));

    await waitFor(() => {
      expect(formRef!.getValues('translationsRequiredStatusId')).toBe(3);
      expect(formRef!.getValues('translationLanguageIds')).toEqual([1, 2]);
    });
  });
});
