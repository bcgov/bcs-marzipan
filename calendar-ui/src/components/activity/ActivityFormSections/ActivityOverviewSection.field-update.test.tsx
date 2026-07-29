import { zodResolver } from '@hookform/resolvers/zod';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  createActivityRequestSchema,
  type ActivityFormData,
} from '@corpcal/shared/schemas';
import {
  createMockActivityResponse,
  createMockTeamListItem,
} from '@corpcal/shared/test-utils';
import { tipTapDocJsonFromPlainText } from '@corpcal/shared/utils';
import { getDefaultFormValues } from '@/lib/activity-form-defaults';

import { useActivityEditFormHydration } from '../../../hooks/useActivityEditFormHydration';
import type { FormLookupData } from '../../../hooks/useFormLookups';
import { ActivityEditProvider } from '../activity-edit-context';
import { ActivityOverviewSection } from './ActivityOverviewSection';

beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.setPointerCapture = () => undefined;
    Element.prototype.releasePointerCapture = () => undefined;
  }
});

vi.mock('@/components/ui/rich-text-field', () =>
  import('@/test-utils/rich-text-field-mock').then((m) => ({
    RichTextField: m.RichTextFieldMock,
  }))
);

vi.mock('../activity-info-icon-settings-context', () => ({
  ActivityFieldInfoIcon: () => null,
}));

const mockLookups: FormLookupData = {
  isLoading: false,
  hasError: false,
  categories: [
    {
      id: 1,
      name: 'test_category',
      displayName: 'Test Category',
      visibility: 'global',
    },
  ],
  organizations: [],
  ministries: [],
  users: [],
  eventPlanners: [],
  tags: [],
  pitchStatuses: [],
  pitchRequiredStatuses: [
    {
      id: 1,
      label: 'Pending',
      value: 1,
      name: 'pending',
      displayName: 'Pending',
    },
    {
      id: 2,
      label: 'Required',
      value: 2,
      name: 'required',
      displayName: 'Required',
    },
  ],
  activityStatuses: [],
  commsMaterials: [],
  translationLanguages: [],
  translationRequiredStatuses: [],
  governmentRepresentatives: [],
  newsReleaseDistributions: [],
  premierRequested: [],
  newsReleaseOrigins: [],
  sharedWithTeams: [],
  quickShareGroups: [],
  dateStatuses: [],
  timeStatuses: [],
  venueStatuses: [],
};

function ActivityOverviewSectionHarness({
  activity = createMockActivityResponse({
    id: 301,
    lastUpdatedDateTime: '2026-05-20T12:00:00.000Z',
    isIssue: false,
    pitchRequiredStatusId: 1,
    category: ['Test Category'],
    commsContacts: [{ userId: 1, name: 'Lead', isLead: true }],
    summary: tipTapDocJsonFromPlainText('Test summary'),
  }),
  onFormReady,
}: {
  activity?: ReturnType<typeof createMockActivityResponse>;
  onFormReady?: (form: ReturnType<typeof useForm<ActivityFormData>>) => void;
}) {
  const form = useForm<ActivityFormData>({
    resolver: zodResolver(
      createActivityRequestSchema
    ) as Resolver<ActivityFormData>,
    mode: 'onChange',
    defaultValues: getDefaultFormValues() as ActivityFormData,
  });

  useActivityEditFormHydration(activity, mockLookups, form);
  onFormReady?.(form);

  return (
    <FormProvider {...form}>
      <ActivityEditProvider
        value={{
          readOnly: false,
          canViewFieldScope: () => true,
          canEditFieldScope: () => true,
        }}
      >
        <ActivityOverviewSection
          categories={mockLookups.categories}
          organizations={[]}
          tags={[]}
          pitchRequiredStatuses={mockLookups.pitchRequiredStatuses}
          userTeamIds={[5]}
          leadTeamField={{
            options: [
              createMockTeamListItem({
                id: 5,
                name: 'Team',
                displayName: 'Team',
                abbreviation: 'TM',
                ministryId: 1,
                ministryName: 'Ministry',
                memberCount: 1,
              }),
            ],
            displayLabel: 'Team',
            optionsFetching: false,
          }}
        />
      </ActivityEditProvider>
    </FormProvider>
  );
}

describe('ActivityOverviewSection field updates after hydration', () => {
  it('marks isIssue dirty when the Issue checkbox is clicked', async () => {
    const user = userEvent.setup();
    let formRef: ReturnType<typeof useForm<ActivityFormData>> | undefined;

    render(
      <ActivityOverviewSectionHarness
        onFormReady={(form) => {
          formRef = form;
        }}
      />
    );

    const issueCheckbox = await screen.findByRole('checkbox', {
      name: /Issue/i,
    });
    expect(issueCheckbox).not.toBeChecked();

    await user.click(issueCheckbox);

    await waitFor(() => {
      expect(formRef!.getValues('isIssue')).toBe(true);
      expect(formRef!.formState.dirtyFields.isIssue).toBe(true);
    });
  });

  it('marks pitchRequiredStatusId dirty when FormSelectSafe value changes', async () => {
    const user = userEvent.setup();
    let formRef: ReturnType<typeof useForm<ActivityFormData>> | undefined;

    render(
      <ActivityOverviewSectionHarness
        onFormReady={(form) => {
          formRef = form;
        }}
      />
    );

    const pitchSelect = await screen.findByRole('combobox', {
      name: /^Pitch required$/i,
    });
    await user.click(pitchSelect);

    const requiredOption = await screen.findByText('Required');
    await user.click(requiredOption);

    await waitFor(() => {
      expect(formRef!.getValues('pitchRequiredStatusId')).toBe(2);
      expect(formRef!.formState.dirtyFields.pitchRequiredStatusId).toBe(true);
    });
  });
});
